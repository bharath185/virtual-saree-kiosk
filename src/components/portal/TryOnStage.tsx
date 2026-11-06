import { useState, useRef, type FC } from 'react';
import {
  Sparkles,
  Download,
  Share2,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  Eye,
  Layers,
  Check,
  Split,
  Box,
  RefreshCw,
  Wand2
} from 'lucide-react';
import type { TryOnResult } from '../../types/portal';
import { Lady3DStudio } from './Lady3DStudio';
import type { GeminiBodyAnalysis } from '../../services/GeminiStylistService';

interface TryOnStageProps {
  currentLook: TryOnResult;
  isGenerating: boolean;
  onSaveToWishlist: (look: TryOnResult) => void;
  isSavedInWishlist: boolean;
  onRequestInStore: () => void;
  onRegenerate?: () => void;
  onRunFashn?: () => void;
  scales?: {
    shoulderScale: number;
    waistHipScale: number;
    heightScale: number;
  };
  onScalesChange?: (newScales: { shoulderScale: number; waistHipScale: number; heightScale: number }) => void;
  geminiAdvice?: GeminiBodyAnalysis | null;
}

export type StageViewMode = 'front' | 'back' | 'dual' | 'compare' | '3d';

export const TryOnStage: FC<TryOnStageProps> = ({
  currentLook,
  isGenerating,
  onSaveToWishlist,
  isSavedInWishlist,
  onRequestInStore,
  onRegenerate,
  onRunFashn,
  scales = { shoulderScale: 1.0, waistHipScale: 1.0, heightScale: 1.0 },
  onScalesChange,
  geminiAdvice
}) => {
  // Default to photorealistic AI image view (ChatGPT style)
  const [viewMode, setViewMode] = useState<StageViewMode>('front');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage for compare slider
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = viewMode === 'back' ? currentLook.backUrl : currentLook.frontUrl;
    link.download = `Divya-Atelier-${currentLook.saree.id}-${viewMode}.jpg`;
    link.click();
  };

  const handleShare = async () => {
    const shareText = `Virtual Saree Drape: ${currentLook.saree.name} in ${currentLook.drapingStyle.name} at Divya Atelier`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Divya Virtual Atelier',
          text: shareText,
          url: window.location.href
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-5 overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* 1. TOP VIEW MODE CONTROLS & CHATGPT EDIT INDICATOR */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Dual View Selector Pill */}
        <div className="p-1 rounded-full bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-md flex items-center gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setViewMode('front')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'front'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>AI Photo</span>
          </button>

          <button
            onClick={() => setViewMode('back')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'back'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pallu Fall</span>
          </button>

          <button
            onClick={() => setViewMode('compare')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'compare'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Before / After</span>
          </button>

          <button
            onClick={() => setViewMode('dual')}
            className={`hidden sm:flex px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'dual'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Dual</span>
          </button>

          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === '3d'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Studio</span>
          </button>
        </div>

        {/* ChatGPT Edit / Regenerate & FASHN Actions */}
        <div className="flex items-center gap-2">
          {onRunFashn && (
            <button
              onClick={onRunFashn}
              disabled={isGenerating}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/40 text-purple-200 text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Run FASHN VTON 1.5 MMDiT model on your photo"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>FASHN AI</span>
            </button>
          )}

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Generate new photorealistic AI variation of this saree look"
            >
              <RefreshCw className={`w-3 h-3 text-amber-400 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Studio</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400">
            <Wand2 className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-amber-300/90 hidden md:inline">ChatGPT Mode</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN STAGE VIEWPORT */}
      <div className="relative flex-1 w-full max-w-2xl my-2 sm:my-3 rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-neutral-950 shadow-2xl overflow-hidden flex items-center justify-center">
        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-serif text-white mb-1">
              AI Editing Image with {currentLook.saree.name}...
            </h3>
            <p className="text-xs text-amber-300 font-mono">Draping Saree & Preserving Customer Face</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-xs">
              Matching {currentLook.saree.fabric} pleats, gold zari borders, and {currentLook.blouse.sleeveStyle} blouse.
            </p>
          </div>
        )}

        {/* VIEW MODE 1: Single Front View (Photorealistic AI Generated Image) */}
        {viewMode === 'front' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentLook.frontUrl}
              alt={currentLook.saree.name}
              className="w-full h-full object-contain select-none transition-all duration-300"
            />
            {/* Front Label watermark */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-neutral-800 text-[10px] text-amber-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI Photo · Front Drape</span>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: Single Back View (Pallu Fall) */}
        {viewMode === 'back' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentLook.backUrl}
              alt="Back Saree Drape"
              className="w-full h-full object-contain select-none transition-all duration-300"
            />
            {/* Back Label watermark */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-neutral-800 text-[10px] text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Pallu Fall View</span>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: Dual View (Front and Back Side-by-Side) */}
        {viewMode === 'dual' && (
          <div className="grid grid-cols-2 w-full h-full divide-x divide-neutral-800">
            <div className="relative h-full flex items-center justify-center p-1">
              <img
                src={currentLook.frontUrl}
                alt="Front Drape"
                className="w-full h-full object-contain select-none"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-neutral-300">
                Front
              </span>
            </div>
            <div className="relative h-full flex items-center justify-center p-1">
              <img
                src={currentLook.backUrl}
                alt="Back Drape"
                className="w-full h-full object-contain select-none"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[9px] font-mono text-amber-300">
                Back Pallu
              </span>
            </div>
          </div>
        )}

        {/* VIEW MODE 4: Interactive Before / After Split Slider */}
        {viewMode === 'compare' && (
          <div
            ref={containerRef}
            onMouseMove={handleSliderMove}
            onTouchMove={handleSliderMove}
            className="relative w-full h-full overflow-hidden cursor-ew-resize select-none"
          >
            {/* Draped Look (Full width underlying) */}
            <img
              src={currentLook.frontUrl}
              alt="Virtual Drape"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Original Photo (Clipped overlay) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={currentLook.originalUserPhoto || '/sarees/teal_zardozi_reference.jpg'}
                alt="Original Photo"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
                style={{ width: containerRef.current?.clientWidth || '100%' }}
              />
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute inset-y-0 w-0.5 bg-amber-400 shadow-lg pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-xl border-2 border-white">
                <SlidersHorizontal className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Labels */}
            <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/70 text-[10px] text-white font-medium">
              Uploaded Photo
            </span>
            <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-amber-500/80 text-[10px] text-neutral-950 font-bold">
              AI Saree Edit
            </span>
          </div>
        )}

        {/* VIEW MODE 5: 3D Female Lady Model (Interactive 360°) */}
        {viewMode === '3d' && (
          <Lady3DStudio
            selectedSaree={currentLook.saree}
            userPhoto={currentLook.originalUserPhoto}
            isCustomPhoto={currentLook.isAiGenerated}
            scales={scales}
            onScalesChange={onScalesChange}
            geminiAdvice={geminiAdvice}
          />
        )}

        {/* Active Style Badges (Bottom Overlay) */}
        <div className="absolute bottom-3 left-3 right-3 z-10 hidden sm:flex items-center justify-between p-2 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-neutral-800 text-[11px]">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="font-semibold text-white">{currentLook.saree.name}</span>
            <span className="text-neutral-500">·</span>
            <span className="text-amber-300">{currentLook.drapingStyle.name}</span>
            <span className="text-neutral-500">·</span>
            <span className="capitalize">{currentLook.blouse.sleeveStyle} Sleeve</span>
          </div>
          <span className="font-mono font-bold text-amber-400">{currentLook.saree.price}</span>
        </div>
      </div>

      {/* 3. BOTTOM COUTURE ACTIONS */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2">
          {/* Wishlist Button */}
          <button
            onClick={() => onSaveToWishlist(currentLook)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              isSavedInWishlist
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isSavedInWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden xs:inline">{isSavedInWishlist ? 'Saved' : 'Wishlist'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isCopied ? 'Link Copied!' : 'Share'}</span>
          </button>

          {/* Download Look */}
          <button
            onClick={handleDownload}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Download</span>
          </button>
        </div>

        {/* E-Commerce Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRequestInStore}
            className="px-3 sm:px-4 py-2 rounded-xl bg-neutral-900 border border-amber-500/40 hover:bg-neutral-800 text-amber-300 text-xs font-semibold tracking-wide transition-all cursor-pointer"
          >
            Request in Store
          </button>

          <button
            onClick={onRequestInStore}
            className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-400/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
