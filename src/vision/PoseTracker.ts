import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { BodyMeasurements, CalibrationState, CameraFacingMode, LandmarkPoint, MorphScales } from '../types';

export class PoseTracker {
  private videoElement: HTMLVideoElement | null = null;
  private currentStream: MediaStream | null = null;
  private poseLandmarker: PoseLandmarker | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isDestroyed: boolean = false;
  public isPaused: boolean = false;

  // Camera Facing Mode ('user' for front, 'environment' for back)
  public facingMode: CameraFacingMode = 'user';
  public availableDevices: MediaDeviceInfo[] = [];

  // Smoothing filters (EMA alpha = 0.15)
  private readonly ALPHA: number = 0.15;
  private smoothedShoulderScale: number = 1.0;
  private smoothedWaistHipScale: number = 1.0;
  private smoothedHeightScale: number = 1.0;

  // Calibration state
  private calibrationStartTime: number | null = null;
  private isCalibrated: boolean = false;
  private lockedScales: MorphScales | null = null;
  private readonly CALIBRATION_DURATION_MS: number = 2000;

  // Simulation fallback mode if camera/mediapipe is unavailable
  public isSimulated: boolean = false;

  // Callbacks
  public onPoseUpdate?: (data: {
    landmarks: LandmarkPoint[];
    liveScales: MorphScales;
    measurements: BodyMeasurements;
  }) => void;

  public onCalibrationChange?: (state: CalibrationState) => void;
  public onCameraChange?: (mode: CameraFacingMode) => void;
  public onError?: (error: string) => void;

  constructor() {}

  public async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
    this.videoElement = videoElement;

    try {
      // 1. Setup camera stream
      await this.startCamera();

      // 2. Setup MediaPipe Pose Landmarker
      await this.initMediaPipe();

      // 3. Start processing loop
      this.startDetectionLoop();
      return true;
    } catch (err: any) {
      console.warn('PoseTracker camera/vision initialization warning, switching to simulation fallback:', err);
      if (this.onError) {
        this.onError(err?.message || 'Camera or MediaPipe unavailable. Enabled interactive simulation mode.');
      }
      this.startSimulationMode();
      return false;
    }
  }

  private async startCamera(): Promise<void> {
    if (!this.videoElement) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Webcam API is not supported in this browser/device.');
    }

    this.stopCurrentStream();

    try {
      // Prefer portrait resolution and current facingMode ('user' or 'environment')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          facingMode: { ideal: this.facingMode }
        },
        audio: false
      });

      this.currentStream = stream;
      this.videoElement.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (!this.videoElement) return resolve();
        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play().catch(() => {});
          resolve();
        };
      });

      // Enumerate cameras in background
      this.fetchAvailableCameras().catch(() => {});
    } catch (err) {
      console.warn('Initial camera constraint failed, trying fallback:', err);
      // Fallback with basic video constraints
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode },
        audio: false
      });
      this.currentStream = fallbackStream;
      this.videoElement.srcObject = fallbackStream;
      await new Promise<void>((resolve) => {
        if (!this.videoElement) return resolve();
        this.videoElement.onloadedmetadata = () => {
          this.videoElement?.play().catch(() => {});
          resolve();
        };
      });
    }

    if (this.onCameraChange) {
      this.onCameraChange(this.facingMode);
    }
  }

  public async switchCamera(targetMode?: CameraFacingMode): Promise<CameraFacingMode> {
    const nextMode: CameraFacingMode = targetMode || (this.facingMode === 'user' ? 'environment' : 'user');
    this.facingMode = nextMode;

    try {
      await this.startCamera();
      // Reset calibration cleanly for new angle
      this.resetCalibration();
    } catch (err: any) {
      console.error('Failed to switch camera:', err);
      if (this.onError) {
        this.onError(`Could not switch to ${nextMode} camera: ${err?.message || ''}`);
      }
    }

    return this.facingMode;
  }

  private async fetchAvailableCameras(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter((d) => d.kind === 'videoinput');
    } catch {
      this.availableDevices = [];
    }
  }

  private stopCurrentStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  private async initMediaPipe(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Try GPU delegate first, fallback to CPU
      try {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
      } catch (gpuError) {
        console.warn('GPU delegate failed for PoseLandmarker, falling back to CPU:', gpuError);
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
      }
    } catch (error) {
      throw new Error('Could not download or initialize MediaPipe Pose model: ' + String(error));
    }
  }

  private startDetectionLoop(): void {
    this.isRunning = true;
    let lastVideoTime = -1;

    const detect = () => {
      if (this.isDestroyed || !this.isRunning) return;
      if (this.isPaused) {
        this.animFrameId = requestAnimationFrame(detect);
        return;
      }

      if (
        this.videoElement &&
        this.videoElement.readyState >= 2 &&
        this.poseLandmarker
      ) {
        if (this.videoElement.currentTime !== lastVideoTime) {
          lastVideoTime = this.videoElement.currentTime;
          const startTimeMs = performance.now();
          const result = this.poseLandmarker.detectForVideo(this.videoElement, startTimeMs);

          if (result && result.landmarks && result.landmarks.length > 0) {
            this.processLandmarks(result.landmarks[0]);
          } else {
            this.handleNoPose();
          }
        }
      }

      this.animFrameId = requestAnimationFrame(detect);
    };

    this.animFrameId = requestAnimationFrame(detect);
  }

  private processLandmarks(landmarks: LandmarkPoint[]): void {
    // 0: Nose
    // 11: Left Shoulder, 12: Right Shoulder
    // 23: Left Hip, 24: Right Hip
    // 27: Left Ankle, 28: Right Ankle
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      this.handleNoPose();
      return;
    }

    // 1. Raw measurements in normalized space (0..1)
    const shoulderDx = leftShoulder.x - rightShoulder.x;
    const shoulderDy = leftShoulder.y - rightShoulder.y;
    const shoulderWidth = Math.sqrt(shoulderDx * shoulderDx + shoulderDy * shoulderDy);

    const hipDx = leftHip.x - rightHip.x;
    const hipDy = leftHip.y - rightHip.y;
    const hipWidth = Math.sqrt(hipDx * hipDx + hipDy * hipDy);

    // Torso height: from mid-shoulder to mid-hip
    const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const midHipY = (leftHip.y + rightHip.y) / 2;
    const torsoHeight = Math.abs(midHipY - midShoulderY);

    // Total body height: from nose to ankles (if visible), else estimate from torso
    let totalHeight: number;
    if (leftAnkle && rightAnkle && leftAnkle.visibility && leftAnkle.visibility > 0.5) {
      const midAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
      totalHeight = Math.abs(midAnkleY - (nose ? nose.y : midShoulderY));
    } else {
      // Typical human ratio: torso is ~35% of total height
      totalHeight = torsoHeight * 2.85;
    }

    const torsoToHipRatio = torsoHeight > 0.01 ? hipWidth / torsoHeight : 0.8;

    const measurements: BodyMeasurements = {
      shoulderWidth,
      torsoHeight,
      hipWidth,
      torsoToHipRatio
    };

    // 2. Map to morph scale factors
    // Baseline averages for a user at standard kiosk distance (1.8m - 2.5m):
    // Standard shoulder width ~ 0.22 (normalized in portrait)
    // Standard hip/torso ratio ~ 0.55
    // Standard body height ~ 0.72
    const targetShoulderScale = this.clamp(
      0.85,
      1.25,
      1.0 + (shoulderWidth - 0.22) * 2.5
    );

    const targetWaistHipScale = this.clamp(
      0.80,
      1.30,
      1.0 + (torsoToHipRatio - 0.55) * 1.8
    );

    const targetHeightScale = this.clamp(
      0.90,
      1.15,
      1.0 + (totalHeight - 0.72) * 1.2
    );

    // 3. Apply Exponential Moving Average (EMA) to prevent jitter (alpha = 0.15)
    this.smoothedShoulderScale =
      this.ALPHA * targetShoulderScale + (1 - this.ALPHA) * this.smoothedShoulderScale;
    this.smoothedWaistHipScale =
      this.ALPHA * targetWaistHipScale + (1 - this.ALPHA) * this.smoothedWaistHipScale;
    this.smoothedHeightScale =
      this.ALPHA * targetHeightScale + (1 - this.ALPHA) * this.smoothedHeightScale;

    const liveScales: MorphScales = {
      shoulderScale: Number(this.smoothedShoulderScale.toFixed(3)),
      waistHipScale: Number(this.smoothedWaistHipScale.toFixed(3)),
      heightScale: Number(this.smoothedHeightScale.toFixed(3))
    };

    // 4. Calibration verification
    this.evaluateCalibration(landmarks, liveScales);

    // Dispatch update to listeners
    if (this.onPoseUpdate) {
      this.onPoseUpdate({
        landmarks,
        liveScales: this.isCalibrated && this.lockedScales ? this.lockedScales : liveScales,
        measurements
      });
    }
  }

  private evaluateCalibration(landmarks: LandmarkPoint[], currentScales: MorphScales): void {
    if (this.isCalibrated) return;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const midX = (leftShoulder.x + rightShoulder.x) / 2;
    const midY = (leftShoulder.y + rightShoulder.y) / 2;

    // Guide Frame Box: User's upper torso should be centered
    // In normalized coords: X between 0.30 and 0.70, Y between 0.15 and 0.55
    const isInsideGuide = midX >= 0.28 && midX <= 0.72 && midY >= 0.12 && midY <= 0.60;

    const now = performance.now();

    if (isInsideGuide) {
      if (this.calibrationStartTime === null) {
        this.calibrationStartTime = now;
      }

      const elapsed = now - this.calibrationStartTime;
      const progress = Math.min(100, Math.floor((elapsed / this.CALIBRATION_DURATION_MS) * 100));

      if (elapsed >= this.CALIBRATION_DURATION_MS) {
        this.isCalibrated = true;
        this.lockedScales = { ...currentScales };
        if (this.onCalibrationChange) {
          this.onCalibrationChange({
            status: 'calibrated',
            progress: 100,
            message: 'Measurements calibrated & locked!',
            isInsideGuide: true,
            lockedScales: this.lockedScales
          });
        }
      } else {
        if (this.onCalibrationChange) {
          this.onCalibrationChange({
            status: 'calibrating',
            progress,
            message: `Hold steady... ${Math.ceil((this.CALIBRATION_DURATION_MS - elapsed) / 1000)}s`,
            isInsideGuide: true,
            lockedScales: null
          });
        }
      }
    } else {
      // User stepped outside guide box
      this.calibrationStartTime = null;
      if (this.onCalibrationChange) {
        this.onCalibrationChange({
          status: 'aligning',
          progress: 0,
          message: 'Step inside the golden guide frame',
          isInsideGuide: false,
          lockedScales: null
        });
      }
    }
  }

  private handleNoPose(): void {
    this.calibrationStartTime = null;
    if (this.onCalibrationChange && !this.isCalibrated) {
      this.onCalibrationChange({
        status: 'searching',
        progress: 0,
        message: 'Looking for customer in frame...',
        isInsideGuide: false,
        lockedScales: null
      });
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public resetCalibration(): void {
    this.isCalibrated = false;
    this.lockedScales = null;
    this.calibrationStartTime = null;
    if (this.onCalibrationChange) {
      this.onCalibrationChange({
        status: 'aligning',
        progress: 0,
        message: 'Step inside the golden guide frame',
        isInsideGuide: false,
        lockedScales: null
      });
    }
  }

  public setManualScales(scales: MorphScales): void {
    this.lockedScales = { ...scales };
    this.isCalibrated = true;
    if (this.onCalibrationChange) {
      this.onCalibrationChange({
        status: 'calibrated',
        progress: 100,
        message: 'Custom proportions active',
        isInsideGuide: true,
        lockedScales: this.lockedScales
      });
    }
    if (this.onPoseUpdate) {
      this.onPoseUpdate({
        landmarks: [],
        liveScales: this.lockedScales,
        measurements: {
          shoulderWidth: 0.22 * scales.shoulderScale,
          torsoHeight: 0.35 * scales.heightScale,
          hipWidth: 0.20 * scales.waistHipScale,
          torsoToHipRatio: 0.55 * scales.waistHipScale
        }
      });
    }
  }

  private startSimulationMode(): void {
    this.isSimulated = true;
    let simAngle = 0;

    const simLoop = () => {
      if (this.isDestroyed) return;

      simAngle += 0.02;
      // Gentle natural breathing / subtle variation
      const simShoulder = 1.0 + Math.sin(simAngle) * 0.04;
      const simHip = 1.0 + Math.cos(simAngle * 0.8) * 0.03;
      const simHeight = 1.0;

      const scales: MorphScales = this.isCalibrated && this.lockedScales
        ? this.lockedScales
        : {
            shoulderScale: Number(simShoulder.toFixed(3)),
            waistHipScale: Number(simHip.toFixed(3)),
            heightScale: simHeight
          };

      // Mock landmarks matching realistic human pose keypoints
      const mockLandmarks: LandmarkPoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      mockLandmarks[0] = { x: 0.46, y: 0.14, z: 0, visibility: 0.95 }; // Nose
      mockLandmarks[11] = { x: 0.38, y: 0.26, z: 0, visibility: 0.95 }; // Left Shoulder
      mockLandmarks[12] = { x: 0.56, y: 0.25, z: 0, visibility: 0.95 }; // Right Shoulder
      mockLandmarks[23] = { x: 0.39, y: 0.55, z: 0, visibility: 0.9 }; // Left Hip
      mockLandmarks[24] = { x: 0.54, y: 0.55, z: 0, visibility: 0.9 }; // Right Hip
      mockLandmarks[25] = { x: 0.40, y: 0.75, z: 0, visibility: 0.85 }; // Left Knee
      mockLandmarks[26] = { x: 0.52, y: 0.75, z: 0, visibility: 0.85 }; // Right Knee
      mockLandmarks[27] = { x: 0.41, y: 0.94, z: 0, visibility: 0.85 }; // Left Ankle
      mockLandmarks[28] = { x: 0.50, y: 0.94, z: 0, visibility: 0.85 }; // Right Ankle

      if (this.onPoseUpdate) {
        this.onPoseUpdate({
          landmarks: mockLandmarks,
          liveScales: scales,
          measurements: {
            shoulderWidth: 0.24,
            torsoHeight: 0.34,
            hipWidth: 0.16,
            torsoToHipRatio: 0.52
          }
        });
      }

      if (!this.isCalibrated) {
        this.evaluateCalibration(mockLandmarks, scales);
      }

      this.animFrameId = requestAnimationFrame(simLoop);
    };

    this.animFrameId = requestAnimationFrame(simLoop);
  }

  private clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.stopCurrentStream();
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
  }
}
