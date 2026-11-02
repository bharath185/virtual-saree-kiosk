import { useState, type FC } from 'react';
import { X, Key, ExternalLink, Sparkles, Cpu, Check, Shield, Bot } from 'lucide-react';
import { ReplicateVTONService } from '../services/ReplicateVTONService';
import { GeminiStylistService } from '../services/GeminiStylistService';

interface VTONSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEngine: 'replicate' | 'local';
  onSelectEngine: (engine: 'replicate' | 'local') => void;
}

export const VTONSettingsModal: FC<VTONSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedEngine,
  onSelectEngine
}) => {
  const [token, setToken] = useState<string>(ReplicateVTONService.getStoredToken());
  const [geminiKey, setGeminiKey] = useState<string>(GeminiStylistService.getStoredKey());
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    ReplicateVTONService.setStoredToken(token);
    GeminiStylistService.setStoredKey(geminiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn pointer-events-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-left">
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
          <h2 className="text-lg sm:text-xl font-serif text-white">AI Try-On Engine Settings</h2>
        </div>
        <p className="text-xs text-neutral-400">
          Choose your AI rendering engine for 99%+ photorealistic saree drapery.
        </p>

        {/* Engine Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Replicate IDM-VTON */}
          <button
            onClick={() => onSelectEngine('replicate')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
              selectedEngine === 'replicate'
                ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Cloud IDM-VTON
              </span>
              {selectedEngine === 'replicate' && (
                <Check className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <p className="text-[11px] text-neutral-300 font-medium">99.9% Photorealistic Diffusion</p>
            <p className="text-[10px] text-neutral-400">
              Vogue-grade silk folds & zardozi bullion lace. Costs ~$0.015/try-on with free trial credits.
            </p>
          </button>

          {/* Option 2: Local RTX 5060 Ti Engine */}
          <button
            onClick={() => onSelectEngine('local')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
              selectedEngine === 'local'
                ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                Local RTX 5060 Ti
              </span>
              {selectedEngine === 'local' && (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-neutral-300 font-medium">100% Free & Unlimited</p>
            <p className="text-[10px] text-neutral-400">
              Sub-200ms latency, runs offline on your GPU with YOLOv8 body segmentation.
            </p>
          </button>
        </div>

        {/* Replicate Token Input (if Replicate is selected) */}
        {selectedEngine === 'replicate' && (
          <div className="flex flex-col gap-2 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Replicate API Token
              </label>
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                Get Free Token <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder="r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-amber-400"
            />

            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
              <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Token is stored securely in your browser's localStorage only.</span>
            </div>
          </div>
        )}

        {/* Google Gemini API Key Section */}
        <div className="flex flex-col gap-2 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800">
          <div className="flex items-center justify-between">
            <label className="text-xs text-neutral-300 font-medium flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              Google Gemini API Key (3D Measurement & Stylist)
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
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-blue-400"
          />

          <p className="text-[10px] text-neutral-400">
            Used by Gemini 1.5 Flash to automatically measure body shoulders, waist, and height from your photo and morph the 3D model!
          </p>
        </div>

        {/* Save / Apply Button */}
        <div className="flex justify-end gap-2 mt-2">
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
                Saved!
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
