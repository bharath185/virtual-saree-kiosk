import type { FC } from 'react';
import { Sparkles, Camera, RotateCcw, Settings, Maximize2, Minimize2 } from 'lucide-react';

interface PortalHeaderProps {
  onOpenUpload: () => void;
  onResetLook: () => void;
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isAiGenerating: boolean;
  hasCustomPhoto: boolean;
}

export const PortalHeader: FC<PortalHeaderProps> = ({
  onOpenUpload,
  onResetLook,
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
  isAiGenerating,
  hasCustomPhoto
}) => {
  return (
    <header className="w-full bg-neutral-950/90 border-b border-neutral-800/80 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-30 sticky top-0 shadow-lg">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
          <h1 className="text-lg sm:text-2xl font-serif tracking-[0.18em] uppercase text-white font-normal flex items-center gap-2">
            DIVYA
            <span className="text-[9px] sm:text-[10px] font-sans font-semibold tracking-[0.25em] text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              VIRTUAL ATELIER
            </span>
          </h1>
        </div>
        <span className="hidden md:inline-block text-[11px] text-neutral-400 border-l border-neutral-800 pl-3">
          Front & Back Virtual Saree Draping Portal
        </span>
      </div>

      {/* Center Status Pill */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-neutral-300 font-mono text-[11px]">
          {isAiGenerating ? 'Synthesizing Photorealistic Drape...' : (hasCustomPhoto ? 'Customer Photo Active · Face & Pose Preserved' : 'Sample 01 Pipeline Ready')}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Upload / Camera Button */}
        <button
          onClick={onOpenUpload}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Try on My Photo</span>
          <span className="xs:hidden">Try Photo</span>
        </button>

        {/* Reset */}
        <button
          onClick={onResetLook}
          title="Reset to Default Drape"
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="AI Engine & Gemini Settings"
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-amber-400" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen"
          className="hidden sm:flex p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
