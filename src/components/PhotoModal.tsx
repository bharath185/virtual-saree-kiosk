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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Container styled like a luxury high-end boutique photo pass */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-neutral-800 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pt-6 pb-3 px-6 text-center border-b border-neutral-800/80">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs tracking-[0.25em] uppercase font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Divya · Virtual Atelier</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xl font-serif text-white font-normal">Your Couture Look</h2>
        </div>

        {/* Photo Viewport */}
        <div className="relative mx-6 my-4 rounded-2xl overflow-hidden border border-amber-500/30 bg-neutral-950 aspect-[9/12] flex items-center justify-center shadow-inner">
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
          <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-amber-500/20 text-left">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium leading-snug">{preset.name}</p>
                <p className="text-amber-300 text-xs">{preset.fabric}</p>
              </div>
              <span className="text-amber-400 font-semibold text-sm">{preset.price}</span>
            </div>
          </div>
        </div>

        {/* QR Code Section to save on Phone */}
        <div className="px-6 py-3 bg-neutral-950/60 border-t border-neutral-800/80 flex items-center gap-4">
          <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
            <QRCodeSVG
              value={sharePayload}
              size={76}
              level="M"
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>

          <div className="text-left text-xs">
            <p className="text-white font-medium flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              Scan with Phone Camera
            </p>
            <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
              Instant access to high-res look, drape specifications & store checkout.
            </p>
            <p className="text-[10px] text-amber-400/80 font-mono mt-1">Ref #{lookId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800/80 flex items-center gap-3">
          <button
            onClick={downloadPhoto}
            className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Save to Kiosk</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Done / Try Another</span>
          </button>
        </div>
      </div>
    </div>
  );
};
