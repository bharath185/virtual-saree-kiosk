import { useState, type FC } from 'react';
import { X, ExternalLink, Sparkles, Check, Bot } from 'lucide-react';
import { TryOnSynthesisService } from '../../services/TryOnSynthesisService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [geminiKey, setGeminiKey] = useState<string>(TryOnSynthesisService.getStoredKey());
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    TryOnSynthesisService.setStoredKey(geminiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-serif text-white">Virtual Atelier Engine Settings</h2>
        </div>
        <p className="text-xs text-neutral-400">
          Powered by Google Gemini 2.5 Flash Vision for photorealistic Indian saree virtual try-on and drape analysis.
        </p>

        {/* Gemini Key Input */}
        <div className="flex flex-col gap-2 p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
          <div className="flex items-center justify-between">
            <label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              Google Gemini API Key
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
            >
              Get Free Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <input
            type="password"
            placeholder="AIzaSy..."
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-amber-400"
          />

          <p className="text-[10px] text-neutral-400 leading-relaxed">
            Your key powers generative synthesis, ensuring the saree draping strictly preserves the customer's face, identity, posture, and room environment.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-neutral-950" />
                <span>Saved!</span>
              </>
            ) : (
              'Save & Apply'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
