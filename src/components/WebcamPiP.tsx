import { useEffect, useRef, useState, type FC, type RefObject } from 'react';
import { CheckCircle2, RefreshCw, Eye, EyeOff, Sliders, SwitchCamera } from 'lucide-react';
import type { CalibrationState, CameraFacingMode, LandmarkPoint, MorphScales } from '../types';

interface WebcamPiPProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarks: LandmarkPoint[];
  calibrationState: CalibrationState;
  onRecalibrate: () => void;
  scales: MorphScales;
  onManualScaleChange?: (scales: MorphScales) => void;
  isSimulated?: boolean;
  facingMode: CameraFacingMode;
  onSwitchCamera: () => void;
}

export const WebcamPiP: FC<WebcamPiPProps> = ({
  videoRef,
  landmarks,
  calibrationState,
  onRecalibrate,
  scales,
  onManualScaleChange,
  isSimulated = false,
  facingMode,
  onSwitchCamera
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [showSliders, setShowSliders] = useState<boolean>(false);

  // Draw skeleton overlay on top of video feed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    // Draw guide box
    ctx.strokeStyle = calibrationState.status === 'calibrated'
      ? 'rgba(52, 211, 153, 0.7)'
      : calibrationState.status === 'calibrating'
      ? 'rgba(251, 191, 36, 0.9)'
      : 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    const gx = canvas.width * 0.28;
    const gy = canvas.height * 0.12;
    const gw = canvas.width * 0.44;
    const gh = canvas.height * 0.50;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.setLineDash([]);

    // Draw body connection bones
    const connections: [number, number][] = [
      [11, 12], // Shoulders
      [11, 23], [12, 24], // Torso sides
      [23, 24], // Hips
      [11, 13], [13, 15], // Left Arm
      [12, 14], [14, 16], // Right Arm
      [23, 25], [25, 27], // Left Leg
      [24, 26], [26, 28]  // Right Leg
    ];

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;

    connections.forEach(([p1, p2]) => {
      const pt1 = landmarks[p1];
      const pt2 = landmarks[p2];
      if (pt1 && pt2) {
        ctx.beginPath();
        ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
        ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw landmark joints
    landmarks.forEach((pt: LandmarkPoint, idx: number) => {
      if (idx === 0 || (idx >= 11 && idx <= 28)) {
        ctx.fillStyle = idx === 11 || idx === 12 ? '#F59E0B' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [landmarks, isOpen, calibrationState]);

  // Mirror feed only for front (selfie) camera, normal for back camera
  const mirrorClass = facingMode === 'user' ? '-scale-x-100' : 'scale-x-100';

  return (
    <div className="flex flex-col items-end gap-2 pointer-events-auto">
      {/* PiP Window */}
      {isOpen && (
        <div className="relative w-48 sm:w-56 h-72 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-neutral-950/90 backdrop-blur-md transition-all duration-300">
          {/* Live Video */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transform transition-transform duration-300 ${mirrorClass}`}
          />

          {/* Skeleton Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={240}
            height={320}
            className={`absolute inset-0 w-full h-full object-cover transform pointer-events-none transition-transform duration-300 ${mirrorClass}`}
          />

          {/* Status Badge overlay */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider flex items-center gap-1 backdrop-blur-md shadow-md ${
                calibrationState.status === 'calibrated'
                  ? 'bg-emerald-500/90 text-white'
                  : calibrationState.status === 'calibrating'
                  ? 'bg-amber-500/90 text-neutral-950 animate-pulse'
                  : 'bg-neutral-900/80 text-amber-300 border border-amber-500/30'
              }`}
            >
              {calibrationState.status === 'calibrated' ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>CALIBRATED</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>{isSimulated ? 'TEST POSE' : 'EDGE CV'}</span>
                </>
              )}
            </div>

            {/* Camera facing indicator pill */}
            <div className="text-[10px] text-amber-200/90 font-mono bg-black/60 px-1.5 py-0.5 rounded border border-amber-500/30">
              {facingMode === 'user' ? 'FRONT' : 'BACK'}
            </div>
          </div>

          {/* Calibration Progress Bar */}
          {calibrationState.status === 'calibrating' && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-150"
                style={{ width: `${calibrationState.progress}%` }}
              />
            </div>
          )}

          {/* Bottom Info & Recalibrate / Camera Switch */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-neutral-300">
            <span className="truncate max-w-[100px] opacity-80">{calibrationState.message}</span>

            <div className="flex items-center gap-1">
              <button
                onClick={onSwitchCamera}
                title={`Switch Camera (Currently: ${facingMode === 'user' ? 'Front' : 'Back'})`}
                className="p-1 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black text-amber-300 transition-colors"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onRecalibrate}
                title="Recalibrate Body Scale"
                className="p-1 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Sliders Drawer */}
      {showSliders && isOpen && onManualScaleChange && (
        <div className="w-56 p-3 bg-neutral-950/95 border border-amber-500/30 rounded-2xl shadow-xl backdrop-blur-md text-xs space-y-2">
          <div className="flex justify-between items-center text-amber-300 font-medium pb-1 border-b border-neutral-800">
            <span>Fine-Tune Fit</span>
            <span className="text-[10px] text-neutral-400 font-mono">Parametric</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-300">
              <span>Shoulders:</span>
              <span className="font-mono">{scales.shoulderScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.85"
              max="1.25"
              step="0.01"
              value={scales.shoulderScale}
              onChange={(e) =>
                onManualScaleChange({
                  ...scales,
                  shoulderScale: parseFloat(e.target.value)
                })
              }
              className="w-full accent-amber-500 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-300">
              <span>Waist / Hips:</span>
              <span className="font-mono">{scales.waistHipScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.30"
              step="0.01"
              value={scales.waistHipScale}
              onChange={(e) =>
                onManualScaleChange({
                  ...scales,
                  waistHipScale: parseFloat(e.target.value)
                })
              }
              className="w-full accent-amber-500 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-300">
              <span>Height Ratio:</span>
              <span className="font-mono">{scales.heightScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.90"
              max="1.15"
              step="0.01"
              value={scales.heightScale}
              onChange={(e) =>
                onManualScaleChange({
                  ...scales,
                  heightScale: parseFloat(e.target.value)
                })
              }
              className="w-full accent-amber-500 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Control Pills */}
      <div className="flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-neutral-800 shadow-lg">
        {/* Quick Camera Switch Button */}
        <button
          onClick={onSwitchCamera}
          title={`Switch Camera (Currently: ${facingMode === 'user' ? 'Front' : 'Back'})`}
          className="p-1.5 rounded-full text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors flex items-center gap-1"
        >
          <SwitchCamera className="w-4 h-4" />
          <span className="text-[10px] font-mono font-medium">{facingMode === 'user' ? 'Front' : 'Back'}</span>
        </button>

        <button
          onClick={() => setShowSliders(!showSliders)}
          title="Toggle Manual Proportions"
          className={`p-1.5 rounded-full transition-colors ${
            showSliders ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? 'Hide Live Camera' : 'Show Live Camera'}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors"
        >
          {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
