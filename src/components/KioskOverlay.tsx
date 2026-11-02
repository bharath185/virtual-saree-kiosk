import { useRef, useState, type FC, type RefObject } from 'react';
import { Camera, Maximize2, Minimize2, MoveHorizontal, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import type { CalibrationState, CameraFacingMode, MorphScales, SareePreset } from '../types';
import { SAREE_CATALOG } from '../engine/MaterialManager';
import { WebcamPiP } from './WebcamPiP';

interface KioskOverlayProps {
  currentPreset: SareePreset;
  onSelectPreset: (presetId: string) => void;
  onSnapPhoto: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarks: any[];
  calibrationState: CalibrationState;
  onRecalibrate: () => void;
  scales: MorphScales;
  onManualScaleChange: (scales: MorphScales) => void;
  isSimulated?: boolean;
  switchTimeMs?: number;
  idleTimeRemaining?: number;
  facingMode: CameraFacingMode;
  onSwitchCamera: () => void;
}

export const KioskOverlay: FC<KioskOverlayProps> = ({
  currentPreset,
  onSelectPreset,
  onSnapPhoto,
  videoRef,
  landmarks,
  calibrationState,
  onRecalibrate,
  scales,
  onManualScaleChange,
  isSimulated = false,
  switchTimeMs = 12,
  idleTimeRemaining = 60,
  facingMode,
  onSwitchCamera
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 xs:p-4 sm:p-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20">
      {/* 1. TOP BAR */}
      <header className="flex items-start justify-between w-full gap-2">
        {/* Brand identity */}
        <div className="flex flex-col items-start pointer-events-auto min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-base sm:text-2xl font-serif tracking-[0.15em] sm:tracking-[0.2em] font-normal text-white uppercase flex items-center gap-1.5 sm:gap-2">
              DIVYA
              <span className="text-[9px] sm:text-xs font-sans tracking-[0.2em] sm:tracking-[0.3em] text-amber-400 font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                ATELIER
              </span>
            </h1>
          </div>
          <p className="text-[9px] sm:text-[11px] text-neutral-400 tracking-wider mt-0.5 uppercase">
            Virtual Saree Try-On
          </p>

          {/* Telemetry Pill (Compact on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[9px] sm:text-[11px] text-neutral-300 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden xs:inline">Fit:</span>
            <span className="text-amber-300 font-mono">
              S:{(scales.shoulderScale * 100).toFixed(0)}% W:{(scales.waistHipScale * 100).toFixed(0)}%
            </span>
            <span className="text-neutral-600 hidden xs:inline">|</span>
            <div className="hidden xs:flex items-center gap-1 text-[9px] sm:text-[10px] text-amber-400/90 font-mono">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
              <span>{switchTimeMs}ms</span>
            </div>
          </div>
        </div>

        {/* Top Right: Fullscreen Toggle & Live PiP Camera */}
        <div className="flex flex-col items-end gap-2 sm:gap-3 pointer-events-auto shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Toggle Fullscreen Kiosk"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>

          <WebcamPiP
            videoRef={videoRef}
            landmarks={landmarks}
            calibrationState={calibrationState}
            onRecalibrate={onRecalibrate}
            scales={scales}
            onManualScaleChange={onManualScaleChange}
            isSimulated={isSimulated}
            facingMode={facingMode}
            onSwitchCamera={onSwitchCamera}
          />
        </div>
      </header>

      {/* 2. CENTER VIEWPORT: Calibration / Interaction Guides */}
      <div className="flex-1 flex flex-col items-center justify-center relative pointer-events-none">
        {/* Aligning / Calibrating HUD guide in center if calibrating */}
        {calibrationState.status === 'calibrating' && (
          <div className="absolute top-1/4 flex flex-col items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-950/85 border border-amber-400/50 backdrop-blur-md shadow-2xl animate-pulse">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-1.5 sm:mb-2" />
            <p className="text-amber-300 font-medium text-xs sm:text-sm">Measuring Proportions...</p>
            <p className="text-neutral-400 text-[10px] sm:text-xs mt-0.5">Hold still for 2s</p>
          </div>
        )}

        {/* Swipe to Rotate Prompt */}
        <div className="absolute bottom-2 sm:bottom-6 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-md text-[10px] sm:text-xs text-neutral-400 shadow-lg">
          <MoveHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse shrink-0" />
          <span>Swipe or Drag to Rotate</span>
        </div>
      </div>

      {/* 3. BOTTOM CAROUSEL & ACTION BUTTON */}
      <footer className="w-full flex flex-col gap-2.5 sm:gap-4 pointer-events-auto">
        {/* Selected Saree Header */}
        <div className="flex items-center justify-between gap-2 px-1 sm:px-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-2xl font-serif text-white font-normal truncate">
                {currentPreset.name}
              </h2>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium shrink-0">
                {currentPreset.zariType}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-amber-300/80 mt-0.5 truncate">
              {currentPreset.fabric} · <span className="text-neutral-400">{currentPreset.origin}</span>
            </p>
          </div>

          {/* Price Tag & Snap Button */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-right">
              <span className="text-[8px] sm:text-[10px] uppercase text-neutral-400 block tracking-wider">Price</span>
              <span className="text-sm sm:text-xl font-semibold text-white font-mono">
                {currentPreset.price}
              </span>
            </div>

            <button
              onClick={onSnapPhoto}
              className="py-2.5 px-3.5 sm:py-3.5 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2.5 shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer shrink-0"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-950 stroke-[2.5]" />
              <span className="hidden xs:inline">Snap Look</span>
              <span className="xs:hidden">Snap</span>
            </button>
          </div>
        </div>

        {/* Saree Catalog Drawer Carousel */}
        <div
          ref={carouselRef}
          className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-1.5 sm:py-2 px-1 touch-pan-x"
        >
          {SAREE_CATALOG.map((saree) => {
            const isSelected = saree.id === currentPreset.id;
            return (
              <button
                key={saree.id}
                onClick={() => onSelectPreset(saree.id)}
                className={`relative flex-shrink-0 w-32 xs:w-36 sm:w-48 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-102'
                    : 'bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                {/* Active check pill */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-neutral-950" />
                  </div>
                )}

                {/* Color Swatch indicator */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: saree.primaryColor }}
                  />
                  <div
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 -ml-2.5 sm:-ml-3.5 shadow-sm"
                    style={{ backgroundColor: saree.secondaryColor }}
                  />
                  <span className="text-[8px] sm:text-[10px] text-neutral-400 font-mono ml-auto truncate max-w-[55px] sm:max-w-none">
                    {saree.zariType}
                  </span>
                </div>

                <p className="text-white text-[11px] sm:text-xs font-medium truncate">{saree.name}</p>
                <p className="text-neutral-400 text-[9px] sm:text-[10px] truncate">{saree.fabric}</p>
                <p className="text-amber-400 text-[11px] sm:text-xs font-semibold mt-1 font-mono">{saree.price}</p>
              </button>
            );
          })}
        </div>

        {/* Idle Reset Countdown Warning (if user is inactive for >45s) */}
        {idleTimeRemaining <= 15 && (
          <div className="w-full text-center text-[10px] sm:text-[11px] text-amber-400/90 bg-amber-500/10 py-1 sm:py-1.5 rounded-lg border border-amber-500/20 animate-pulse">
            Showcase mode resets in {idleTimeRemaining}s. Touch display to continue.
          </div>
        )}
      </footer>
    </div>
  );
};
