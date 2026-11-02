import { useEffect, type FC } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Download, Check, Share2 } from 'lucide-react';
import type { SareePreset, MorphScales } from '../types';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  preset: SareePreset;
  scales: MorphScales;
}

export const PhotoModal: FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  preset,
  scales
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire luxury golden confetti shower
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FFDF73', '#FFFFFF', '#E5B83B', '#8B0A1A']
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate lookup URL or payload for customer mobile phone
  const lookId = `SAREE-${Date.now().toString(36).toUpperCase()}`;
  const sharePayload = JSON.stringify({
    lookId,
    saree: preset.name,
    fabric: preset.fabric,
    price: preset.price,
    bodyFit: `S:${(scales.shoulderScale * 100).toFixed(0)}% W:${(scales.waistHipScale * 100).toFixed(0)}%`,
    date: new Date().toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  });

  const downloadPhoto = () => {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `Divya-Atelier-${preset.id}-${lookId}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Container styled like a luxury high-end boutique photo pass */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-black/60 hover:bg-neutral-800 text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header */}
        <div className="pt-4 pb-2 px-4 sm:pt-6 sm:pb-3 sm:px-6 text-center border-b border-neutral-800/80">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase font-semibold mb-0.5 sm:mb-1">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Divya · Virtual Atelier</span>
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <h2 className="text-lg sm:text-xl font-serif text-white font-normal">Your Couture Look</h2>
        </div>

        {/* Photo Viewport */}
        <div className="relative mx-3 sm:mx-6 my-2 sm:my-4 rounded-xl sm:rounded-2xl overflow-hidden border border-amber-500/30 bg-neutral-950 aspect-[9/11] sm:aspect-[9/12] flex items-center justify-center shadow-inner">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Virtual Saree Try-On"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-neutral-500 text-sm">Rendering look...</div>
          )}

          {/* Saree Badge overlay */}
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-950/85 backdrop-blur-md border border-amber-500/20 text-left">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-white text-xs sm:text-sm font-medium leading-snug truncate">{preset.name}</p>
                <p className="text-amber-300 text-[10px] sm:text-xs truncate">{preset.fabric}</p>
              </div>
              <span className="text-amber-400 font-semibold text-xs sm:text-sm shrink-0">{preset.price}</span>
            </div>
          </div>
        </div>

        {/* QR Code Section to save on Phone */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-neutral-950/60 border-t border-neutral-800/80 flex items-center gap-3 sm:gap-4">
          <div className="p-1.5 sm:p-2 bg-white rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
            <QRCodeSVG
              value={sharePayload}
              size={56}
              className="w-14 h-14 sm:w-18 sm:h-18"
              level="M"
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>

          <div className="text-left text-xs min-w-0">
            <p className="text-white font-medium flex items-center gap-1 text-[11px] sm:text-xs">
              <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              Scan with Phone Camera
            </p>
            <p className="text-neutral-400 text-[10px] sm:text-[11px] mt-0.5 leading-relaxed truncate xs:whitespace-normal">
              Instant access to high-res look & boutique checkout.
            </p>
            <p className="text-[9px] sm:text-[10px] text-amber-400/80 font-mono mt-0.5">Ref #{lookId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 sm:p-4 bg-neutral-900 border-t border-neutral-800/80 flex items-center gap-2 sm:gap-3">
          <button
            onClick={downloadPhoto}
            className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Download</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
