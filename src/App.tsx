import { useEffect, useRef, useState, useCallback } from 'react';
import type { CalibrationState, CameraFacingMode, LandmarkPoint, MorphScales, SareePreset } from './types';
import { MaterialManager, SAREE_CATALOG } from './engine/MaterialManager';
import { PoseTracker } from './vision/PoseTracker';
import { SareeCanvas, type SareeCanvasHandle } from './components/SareeCanvas';
import { KioskOverlay } from './components/KioskOverlay';
import { PhotoModal } from './components/PhotoModal';

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

  // Idle timer (60 seconds)
  const [idleTimeRemaining, setIdleTimeRemaining] = useState<number>(60);
  const [isIdle, setIsIdle] = useState<boolean>(false);

  // Photo Snap Modal
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poseTrackerRef = useRef<PoseTracker | null>(null);
  const sareeCanvasRef = useRef<SareeCanvasHandle | null>(null);

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
    };

    tracker.onCalibrationChange = (calib) => {
      setCalibrationState(calib);
      if (calib.lockedScales) {
        setScales(calib.lockedScales);
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
          // Reset to showcase state
          setIsIdle(true);
          setCurrentPreset(SAREE_CATALOG[0]);
          materialManagerInstance.applyPreset(SAREE_CATALOG[0].id);
          sareeCanvasRef.current?.resetCamera();
          poseTrackerRef.current?.resetCalibration();
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
    // Subtle showcase turn to highlight zari
    sareeCanvasRef.current?.triggerAutoSpin();
  };

  // Recalibrate handler
  const handleRecalibrate = () => {
    recordActivity();
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

  // Screen capture & QR photo generation
  const handleSnapPhoto = () => {
    recordActivity();
    if (sareeCanvasRef.current) {
      const dataUrl = sareeCanvasRef.current.captureScreenshot();
      setCapturedPhotoUrl(dataUrl);
      setIsPhotoModalOpen(true);
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

      {/* Portrait Kiosk Canvas Frame (Aspect ratio 9:16 locked or full screen) */}
      <div className="relative w-full h-full max-w-[1080px] max-h-[1920px] aspect-[9/16] bg-neutral-950 shadow-2xl flex flex-col overflow-hidden">
        {/* 3D WebGL Viewport */}
        <SareeCanvas
          ref={sareeCanvasRef}
          materialManager={materialManagerInstance}
          currentPresetId={currentPreset.id}
          scales={scales}
          isIdle={isIdle}
        />

        {/* HUD & Kiosk Touch Controls */}
        <KioskOverlay
          currentPreset={currentPreset}
          onSelectPreset={handleSelectPreset}
          onSnapPhoto={handleSnapPhoto}
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
        />

        {/* Photo Look Capture & QR Code Modal */}
        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          photoUrl={capturedPhotoUrl}
          preset={currentPreset}
          scales={scales}
        />
      </div>
    </main>
  );
}

export default App;
