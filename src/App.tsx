import { useEffect, useRef, useState, useCallback } from 'react';
import type { AppViewMode, AvatarPoseId, CalibrationState, CameraFacingMode, LandmarkPoint, MorphScales, SareePreset } from './types';
import { MaterialManager, SAREE_CATALOG } from './engine/MaterialManager';
import { PoseTracker } from './vision/PoseTracker';
import { SareeCanvas, type SareeCanvasHandle } from './components/SareeCanvas';
import { ARLiveMirror, type ARLiveMirrorHandle } from './components/ARLiveMirror';
import { KioskOverlay } from './components/KioskOverlay';
import { PhotoModal } from './components/PhotoModal';
import { LocalAIService } from './services/LocalAIService';

const materialManagerInstance = new MaterialManager();

export function App() {
  const [currentPreset, setCurrentPreset] = useState<SareePreset>(SAREE_CATALOG[0]);
  const [switchTimeMs, setSwitchTimeMs] = useState<number>(8.5);

  const [scales, setScales] = useState<MorphScales>({
    shoulderScale: 1.0,
    waistHipScale: 1.0,
    heightScale: 1.0
  });

  const [calibrationState, setCalibrationState] = useState<CalibrationState>({
    status: 'searching',
    progress: 0,
    message: 'Starting camera...',
    isInsideGuide: false,
    lockedScales: null
  });

  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>('user');

  // View Mode: 'ar-live' (Camera full-screen replacing saree on live people) vs '3d-atelier'
  const [viewMode, setViewMode] = useState<AppViewMode>('ar-live');

  // Pose Stills & Camera Freeze Mode
  const [poseId, setPoseId] = useState<AvatarPoseId>('front');
  const [isCameraFrozen, setIsCameraFrozen] = useState<boolean>(false);

  // Idle timer (60 seconds)
  const [idleTimeRemaining, setIdleTimeRemaining] = useState<number>(60);
  const [isIdle, setIsIdle] = useState<boolean>(false);

  // Photo Snap Modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');

  // Local AI State (RTX 5060 Ti)
  const [isAiOnline, setIsAiOnline] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiPhoto, setIsAiPhoto] = useState<boolean>(false);

  // Monitor Local AI Python Service Health
  useEffect(() => {
    const check = async () => {
      const online = await LocalAIService.checkHealth();
      setIsAiOnline(online);
    };
    check();
    const interval = setInterval(check, 4000);
    return () => clearInterval(interval);
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poseTrackerRef = useRef<PoseTracker | null>(null);
  const sareeCanvasRef = useRef<SareeCanvasHandle | null>(null);
  const arMirrorRef = useRef<ARLiveMirrorHandle | null>(null);

  // Throttle face projection to every 300ms
  const lastFaceProjectionTime = useRef<number>(0);

  // Reset idle timer on any touch or interaction
  const recordActivity = useCallback(() => {
    setIdleTimeRemaining(60);
    setIsIdle(false);
  }, []);

  // 1. Initialize PoseTracker and Camera
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tracker = new PoseTracker();
    poseTrackerRef.current = tracker;

    tracker.onPoseUpdate = ({ landmarks: lms, liveScales }) => {
      setLandmarks(lms);
      setScales(liveScales);

      // Project face if in 3D mode
      const now = performance.now();
      if (!tracker.isPaused && now - lastFaceProjectionTime.current > 250) {
        lastFaceProjectionTime.current = now;
        if (video.readyState >= 2 && lms.length > 0) {
          sareeCanvasRef.current?.projectFace(video, lms);
        }
      }
    };

    tracker.onCalibrationChange = (calib) => {
      setCalibrationState(calib);
      if (calib.lockedScales) {
        setScales(calib.lockedScales);
        if (video.readyState >= 2) {
          sareeCanvasRef.current?.projectFace(video, landmarks);
        }
      }
    };

    tracker.onCameraChange = (mode) => {
      setFacingMode(mode);
    };

    tracker.onError = () => {
      setIsSimulated(true);
    };

    tracker.initialize(video).then((success) => {
      if (!success) {
        setIsSimulated(true);
      }
    });

    return () => {
      tracker.destroy();
    };
  }, []);

  // 2. 60-Second Auto-Reset Idle Timer Loop
  useEffect(() => {
    const interval = window.setInterval(() => {
      setIdleTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsIdle(true);
          setCurrentPreset(SAREE_CATALOG[0]);
          materialManagerInstance.applyPreset(SAREE_CATALOG[0].id);
          sareeCanvasRef.current?.resetCamera();
          poseTrackerRef.current?.resetCalibration();
          setIsCameraFrozen(false);
          poseTrackerRef.current?.resume();
          setPoseId('front');
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Attach global interaction listeners for idle detection
  useEffect(() => {
    const events = ['pointerdown', 'pointermove', 'touchstart', 'keydown'];
    const handleAction = () => recordActivity();

    events.forEach((evt) => window.addEventListener(evt, handleAction, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleAction));
    };
  }, [recordActivity]);

  // Handle saree preset switch (<100ms PBR texture swap)
  const handleSelectPreset = (presetId: string) => {
    recordActivity();
    const result = materialManagerInstance.applyPreset(presetId);
    setSwitchTimeMs(result.switchTimeMs);
    setCurrentPreset(result.preset);
  };

  // Recalibrate handler
  const handleRecalibrate = () => {
    recordActivity();
    setIsCameraFrozen(false);
    poseTrackerRef.current?.resume();
    poseTrackerRef.current?.resetCalibration();
  };

  // Manual scale fine-tune handler
  const handleManualScaleChange = (newScales: MorphScales) => {
    recordActivity();
    setScales(newScales);
    poseTrackerRef.current?.setManualScales(newScales);
  };

  // Switch between front and back camera
  const handleSwitchCamera = async () => {
    recordActivity();
    if (poseTrackerRef.current) {
      const newMode = await poseTrackerRef.current.switchCamera();
      setFacingMode(newMode);
    }
  };

  // Toggle Camera Freeze & Unlock Pose Stills
  const handleToggleFreezeCamera = () => {
    recordActivity();
    const nextFrozen = !isCameraFrozen;
    setIsCameraFrozen(nextFrozen);

    if (nextFrozen) {
      if (videoRef.current) {
        sareeCanvasRef.current?.projectFace(videoRef.current, landmarks);
      }
      poseTrackerRef.current?.pause();
    } else {
      poseTrackerRef.current?.resume();
    }
  };

  // Select Couture Pose Still
  const handleSelectPose = (newPoseId: AvatarPoseId) => {
    recordActivity();
    setPoseId(newPoseId);
    sareeCanvasRef.current?.setPose(newPoseId);
  };

  // Screen capture & QR photo generation
  const handleSnapPhoto = () => {
    recordActivity();
    setIsAiPhoto(false);
    let dataUrl = '';
    if (viewMode === 'ar-live' && arMirrorRef.current) {
      dataUrl = arMirrorRef.current.captureScreenshot();
    } else if (sareeCanvasRef.current) {
      dataUrl = sareeCanvasRef.current.captureScreenshot();
    }

    if (dataUrl) {
      setCapturedPhotoUrl(dataUrl);
      setIsPhotoModalOpen(true);
    }
  };

  // Instant Local AI Virtual Saree Try-On (150ms on RTX 5060 Ti)
  const handleAITryOn = async () => {
    recordActivity();
    setIsAiLoading(true);
    try {
      let rawFrame = '';
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const v = videoRef.current;
        const offscreen = document.createElement('canvas');
        offscreen.width = v.videoWidth || 720;
        offscreen.height = v.videoHeight || 1280;
        const octx = offscreen.getContext('2d');
        if (octx) {
          octx.drawImage(v, 0, 0, offscreen.width, offscreen.height);
          rawFrame = offscreen.toDataURL('image/jpeg', 0.92);
        }
      } else if (arMirrorRef.current) {
        rawFrame = arMirrorRef.current.captureScreenshot();
      }

      if (!rawFrame) {
        const res = await fetch('/sarees/teal_zardozi_reference.jpg');
        const blob = await res.blob();
        rawFrame = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const aiRes = await LocalAIService.tryOn(rawFrame, currentPreset.id, facingMode === 'user');
      if (aiRes.success && aiRes.result_base64) {
        setCapturedPhotoUrl(aiRes.result_base64);
        setIsAiPhoto(true);
        setIsPhotoModalOpen(true);
      } else {
        handleSnapPhoto();
      }
    } catch {
      handleSnapPhoto();
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <main
      className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none font-sans"
      onPointerDown={recordActivity}
    >
      {/* Hidden live video element for MediaPipe stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      {/* Portrait Kiosk Frame (Fluid 100dvh on mobile, 9:16 aspect ratio on desktop/kiosk) */}
      <div className="relative w-full h-[100dvh] max-w-full sm:max-w-[1080px] sm:max-h-[1920px] sm:aspect-[9/16] bg-neutral-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Fullscreen Viewport: Live AR Smart Mirror (Default) OR 3D Atelier */}
        {viewMode === 'ar-live' ? (
          <ARLiveMirror
            ref={arMirrorRef}
            videoRef={videoRef}
            landmarks={landmarks}
            currentPreset={currentPreset}
            facingMode={facingMode}
            isFrozen={isCameraFrozen}
          />
        ) : (
          <SareeCanvas
            ref={sareeCanvasRef}
            materialManager={materialManagerInstance}
            currentPresetId={currentPreset.id}
            scales={scales}
            poseId={poseId}
            isIdle={isIdle}
          />
        )}

        {/* HUD & Kiosk Touch Controls */}
        <KioskOverlay
          currentPreset={currentPreset}
          onSelectPreset={handleSelectPreset}
          onSnapPhoto={handleSnapPhoto}
          onAITryOn={handleAITryOn}
          isAiLoading={isAiLoading}
          isAiOnline={isAiOnline}
          videoRef={videoRef}
          landmarks={landmarks}
          calibrationState={calibrationState}
          onRecalibrate={handleRecalibrate}
          scales={scales}
          onManualScaleChange={handleManualScaleChange}
          isSimulated={isSimulated}
          switchTimeMs={switchTimeMs}
          idleTimeRemaining={idleTimeRemaining}
          facingMode={facingMode}
          onSwitchCamera={handleSwitchCamera}
          currentPoseId={poseId}
          onSelectPose={handleSelectPose}
          isCameraFrozen={isCameraFrozen}
          onToggleFreezeCamera={handleToggleFreezeCamera}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
        />

        {/* Photo Look Capture & QR Code Modal */}
        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          photoUrl={capturedPhotoUrl}
          preset={currentPreset}
          scales={scales}
          isAiGenerated={isAiPhoto}
        />
      </div>
    </main>
  );
}

export default App;
