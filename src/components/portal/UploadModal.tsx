import { useState, useRef, useEffect, type FC, type ChangeEvent } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  UserCheck,
  SunMedium,
  ShieldCheck
} from 'lucide-react';
import { SAMPLE_USER_MODELS } from '../../data/portalCatalog';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoDataUrl: string) => void;
}

export const UploadModal: FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSelectPhoto
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen && cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [isOpen, cameraStream]);

  if (!isOpen) return null;

  const handleStartCamera = async () => {
    setActiveMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
    }
  };

  const handleCaptureCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          snapFrame();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const snapFrame = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 720;
    canvas.height = v.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
      setPreviewUrl(dataUrl);
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        setCameraStream(null);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onSelectPhoto(previewUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[92dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-serif text-white">Full-Length Photo Studio</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Upload or capture your photo; our AI drapes sarees realistically while preserving your face, posture, and room setting.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex p-1 rounded-xl bg-neutral-950 border border-neutral-800">
          <button
            onClick={() => setActiveMode('upload')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'upload' ? 'bg-amber-400 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            onClick={handleStartCamera}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'camera' ? 'bg-amber-400 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
        </div>

        {/* Main Viewport */}
        {activeMode === 'upload' ? (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-56 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl bg-neutral-950/70 hover:bg-neutral-950 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden relative group"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <>
                  <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-neutral-200 font-medium">Click to choose photo from device</p>
                  <p className="text-[10px] text-neutral-500">Supports JPG, PNG, WEBP (Full-length standing pose)</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full h-64 rounded-2xl bg-black border border-neutral-800 overflow-hidden flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Snapshot" className="w-full h-full object-contain" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Silhouette guide overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-32 h-48 border-2 border-amber-400/50 rounded-full border-dashed animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-amber-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                      Align Full Body
                    </span>
                  </div>
                </div>

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-5xl font-serif text-amber-400 font-bold animate-ping">
                    {countdown}
                  </div>
                )}

                {/* Snap Button */}
                <button
                  onClick={handleCaptureCountdown}
                  className="absolute bottom-3 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Look</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Framing & Lighting Guidance (Section 4.5 of doc) */}
        <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
          <div className="flex items-center gap-1.5">
            <SunMedium className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Even, soft lighting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Stand straight, face camera</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Fitted everyday clothes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Full length visible</span>
          </div>
        </div>

        {/* 1-Click Sample Test Models (Sample 01 Office Casual) */}
        <div>
          <span className="text-[11px] text-neutral-400 font-medium block mb-1.5">
            Or test instantly with reference sample:
          </span>
          <div className="flex gap-2">
            {SAMPLE_USER_MODELS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => setPreviewUrl(sample.photoUrl)}
                className="flex-1 p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/50 text-left flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700">
                  <img src={sample.photoUrl} alt={sample.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{sample.name}</p>
                  <p className="text-[10px] text-amber-300 font-mono">Sample 01 Pipeline</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!previewUrl}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-neutral-950 fill-neutral-950" />
            <span>Drape Saree on This Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
