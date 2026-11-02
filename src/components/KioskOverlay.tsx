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
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-8 z-20">
      {/* 1. TOP BAR */}
      <header className="flex items-start justify-between w-full">
        {/* Brand identity */}
        <div className="flex flex-col items-start pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-serif tracking-[0.2em] font-normal text-white uppercase flex items-center gap-2">
              DIVYA
              <span className="text-xs font-sans tracking-[0.3em] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                ATELIER
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-neutral-400 tracking-wider mt-0.5 uppercase">
            Parametric Saree Fitting · 1080×1920 Kiosk
          </p>

          {/* Telemetry Pill */}
          <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fit:</span>
            <span className="text-amber-300 font-mono">
              S:{(scales.shoulderScale * 100).toFixed(0)}% · W:{(scales.waistHipScale * 100).toFixed(0)}% · H:{(scales.heightScale * 100).toFixed(0)}%
            </span>
            <span className="text-neutral-600">|</span>
            <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-mono">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{switchTimeMs}ms swap</span>
            </div>
          </div>
        </div>

        {/* Top Right: Fullscreen Toggle & Live PiP Camera */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-white backdrop-blur-md transition-colors"
              title="Toggle Fullscreen Kiosk"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
          <div className="absolute top-1/4 flex flex-col items-center p-4 rounded-2xl bg-neutral-950/80 border border-amber-400/50 backdrop-blur-md shadow-2xl animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-2" />
            <p className="text-amber-300 font-medium text-sm">Measuring Proportions...</p>
            <p className="text-neutral-400 text-xs mt-1">Stand still for 2 seconds</p>
          </div>
        )}

        {/* Swipe to Rotate Prompt */}
        <div className="absolute bottom-6 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-md text-xs text-neutral-400 shadow-lg">
          <MoveHorizontal className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Swipe or Drag to Rotate 360°</span>
        </div>
      </div>

      {/* 3. BOTTOM CAROUSEL & ACTION BUTTON */}
      <footer className="w-full flex flex-col gap-4 pointer-events-auto">
        {/* Selected Saree Header */}
        <div className="flex items-end justify-between px-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif text-white font-normal">
                {currentPreset.name}
              </h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                {currentPreset.zariType}
              </span>
            </div>
            <p className="text-xs text-amber-300/80 mt-0.5">
              {currentPreset.fabric} · <span className="text-neutral-400">{currentPreset.origin}</span>
            </p>
          </div>

          {/* Price Tag & Snap Button */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase text-neutral-400 block tracking-wider">Price</span>
              <span className="text-lg sm:text-xl font-semibold text-white font-mono">
                {currentPreset.price}
              </span>
            </div>

            <button
              onClick={onSnapPhoto}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 font-bold text-sm tracking-wide flex items-center gap-2.5 shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-neutral-950 stroke-[2.5]" />
              <span>Snap Photo / Get Look</span>
            </button>
          </div>
        </div>

        {/* Saree Catalog Drawer Carousel */}
        <div
          ref={carouselRef}
          className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2 px-1"
        >
          {SAREE_CATALOG.map((saree) => {
            const isSelected = saree.id === currentPreset.id;
            return (
              <button
                key={saree.id}
                onClick={() => onSelectPreset(saree.id)}
                className={`relative flex-shrink-0 w-44 sm:w-48 p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-102'
                    : 'bg-neutral-950/80 border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                {/* Active check pill */}
                {isSelected && (
                  <div className="absolute top-2 right-2 text-amber-400">
                    <CheckCircle2 className="w-4 h-4 fill-amber-400 text-neutral-950" />
                  </div>
                )}

                {/* Color Swatch indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: saree.primaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 -ml-3.5 shadow-sm"
                    style={{ backgroundColor: saree.secondaryColor }}
                  />
                  <span className="text-[10px] text-neutral-400 font-mono ml-auto">
                    {saree.zariType}
                  </span>
                </div>

                <p className="text-white text-xs font-medium truncate">{saree.name}</p>
                <p className="text-neutral-400 text-[10px] truncate">{saree.fabric}</p>
                <p className="text-amber-400 text-xs font-semibold mt-1.5 font-mono">{saree.price}</p>
              </button>
            );
          })}
        </div>

        {/* Idle Reset Countdown Warning (if user is inactive for >45s) */}
        {idleTimeRemaining <= 15 && (
          <div className="w-full text-center text-[11px] text-amber-400/90 bg-amber-500/10 py-1.5 rounded-lg border border-amber-500/20 animate-pulse">
            Showcase mode resets in {idleTimeRemaining}s. Touch display to continue styling.
          </div>
        )}
      </footer>
    </div>
  );
};
