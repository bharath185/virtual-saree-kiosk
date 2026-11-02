import { useState, useRef, type FC, type ChangeEvent } from 'react';
import { X, Upload, Image as ImageIcon, UserCheck } from 'lucide-react';

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
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSample = (samplePath: string) => {
    setPreviewUrl(samplePath);
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onSelectPhoto(previewUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn pointer-events-auto">
      <div className="relative w-full max-w-md bg-neutral-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-serif text-white">Upload Your Photo</h2>
        </div>
        <p className="text-xs text-neutral-400">
          Upload any portrait or selfie to try on sarees with 99% accuracy — no webcam permissions needed.
        </p>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Drop / Upload Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl bg-neutral-950/70 hover:bg-neutral-950 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden relative group"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Selected Preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-xs text-neutral-200 font-medium">Click to choose photo from device</p>
              <p className="text-[10px] text-neutral-500">Supports JPG, PNG, WEBP</p>
            </>
          )}
        </div>

        {/* Fast Sample Models */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-neutral-400 font-medium">Or choose a reference model:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUseSample('/sarees/teal_zardozi_reference.jpg')}
              className="flex-1 p-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/50 text-left flex items-center gap-2 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                <img src="/sarees/teal_zardozi_reference.jpg" alt="Reference Model" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-white font-medium truncate">Reference Model</p>
                <p className="text-[9px] text-amber-400 font-mono">Original Saree Fit</p>
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!previewUrl}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 text-neutral-950" />
            Set as Try-On Subject
          </button>
        </div>
      </div>
    </div>
  );
};
