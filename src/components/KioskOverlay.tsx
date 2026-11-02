import { useRef, useState, type FC, type RefObject } from 'react';
import { Camera, Maximize2, Minimize2, CheckCircle2, ShieldCheck, Sparkles, SwitchCamera, RefreshCw, Box, Upload, Settings } from 'lucide-react';
import type { AppViewMode, AvatarPoseId, CalibrationState, CameraFacingMode, MorphScales, SareePreset } from '../types';
import { SAREE_CATALOG } from '../engine/MaterialManager';
import { WebcamPiP } from './WebcamPiP';
import { PoseSelector } from './PoseSelector';

interface KioskOverlayProps {
  currentPreset: SareePreset;
  onSelectPreset: (presetId: string) => void;
  onSnapPhoto: () => void;
  onAITryOn: () => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  selectedEngine: 'replicate' | 'local';
  hasCustomPhoto: boolean;
  onClearCustomPhoto: () => void;
  isAiLoading: boolean;
  isAiOnline: boolean;
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
  currentPoseId: AvatarPoseId;
  onSelectPose: (poseId: AvatarPoseId) => void;
  isCameraFrozen: boolean;
  onToggleFreezeCamera: () => void;
  viewMode: AppViewMode;
  onToggleViewMode: (mode: AppViewMode) => void;
  onGenerate3DFromCamera?: () => void;
}

export const KioskOverlay: FC<KioskOverlayProps> = ({
  currentPreset,
  onSelectPreset,
  onSnapPhoto,
  onAITryOn,
  onOpenUpload,
  onOpenSettings,
  selectedEngine,
  hasCustomPhoto,
  onClearCustomPhoto,
  isAiLoading,
  isAiOnline,
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
  onSwitchCamera,
  currentPoseId,
  onSelectPose,
  isCameraFrozen,
  onToggleFreezeCamera,
  viewMode,
  onToggleViewMode,
  onGenerate3DFromCamera
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
            {viewMode === 'ar-live' ? 'Live AR Mirror · Drapes Directly On You' : '3D Atelier · Multi-Pose Fitting'}
          </p>

          {/* Mode Switcher Pill */}
          <div className="flex items-center gap-1 mt-1.5 p-0.5 rounded-full bg-neutral-900/90 border border-neutral-800 backdrop-blur-md shadow-md">
            <button
              onClick={() => onToggleViewMode('ar-live')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'ar-live'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>LIVE MIRROR</span>
            </button>
            <button
              onClick={() => onToggleViewMode('3d-atelier')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === '3d-atelier'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D ATELIER</span>
            </button>
          </div>

          {/* Telemetry Pill (Compact on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[9px] sm:text-[11px] text-neutral-300 backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden xs:inline">Fit:</span>
            <span className="text-amber-300 font-mono">
              S:{(scales.shoulderScale * 100).toFixed(0)}% W:{(scales.waistHipScale * 100).toFixed(0)}%
            </span>
            <span className="text-neutral-600 hidden xs:inline">|</span>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-amber-400/90 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${selectedEngine === 'replicate' ? 'bg-amber-400 animate-pulse' : (isAiOnline ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500')}`} />
              <span>{selectedEngine === 'replicate' ? 'Cloud IDM-VTON' : (isAiOnline ? 'RTX 5060 Ti AI' : `${switchTimeMs}ms`)}</span>
            </div>
          </div>

          {/* Custom photo indicator */}
          {hasCustomPhoto && (
            <div className="flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] text-amber-300">
              <span>Photo Subject Active</span>
              <button
                onClick={onClearCustomPhoto}
                className="underline hover:text-white cursor-pointer ml-1"
              >
                Reset to Live Camera
              </button>
            </div>
          )}
        </div>

        {/* Top Right Controls */}
        <div className="flex flex-col items-end gap-2 sm:gap-3 pointer-events-auto shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Upload Photo Button (Works on all devices without webcam permissions) */}
            <button
              onClick={onOpenUpload}
              title="Upload photo or choose selfie"
              className="p-1.5 sm:p-2.5 rounded-full bg-neutral-900/80 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] font-mono hidden sm:inline">Upload Photo</span>
            </button>

            {/* AI Settings Button */}
            <button
              onClick={onOpenSettings}
              title="AI Engine Settings (Replicate / Local RTX)"
              className="p-1.5 sm:p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Quick Switch Camera Button in AR mode */}
            {viewMode === 'ar-live' && (
              <button
                onClick={onSwitchCamera}
                title={`Switch Camera (Currently: ${facingMode === 'user' ? 'Front' : 'Back'})`}
                className="p-1.5 sm:p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 text-amber-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1"
              >
                <SwitchCamera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] font-mono hidden xs:inline">{facingMode === 'user' ? 'Front' : 'Back'}</span>
              </button>
            )}

            {/* Recalibrate button in AR mode */}
            {viewMode === 'ar-live' && (
              <button
                onClick={onRecalibrate}
                title="Reset Saree Alignment"
                className="p-1.5 sm:p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Toggle Fullscreen Kiosk"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>

          {/* Render PiP only in 3D Atelier mode (not redundant in full-screen AR mode) */}
          {viewMode === '3d-atelier' && (
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
          )}
        </div>
      </header>

      {/* 2. CENTER VIEWPORT: Calibration / Pose Stills / Interaction Guides */}
      <div className="flex-1 flex flex-col items-center justify-between relative py-2 pointer-events-none">
        {/* Aligning / Calibrating HUD guide in center if calibrating */}
        {calibrationState.status === 'calibrating' && !isCameraFrozen && (
          <div className="my-auto flex flex-col items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-950/85 border border-amber-400/50 backdrop-blur-md shadow-2xl animate-pulse">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-1.5 sm:mb-2" />
            <p className="text-amber-300 font-medium text-xs sm:text-sm">
              {viewMode === 'ar-live' ? 'Fitting Saree on Live Body...' : 'Matching Face & Body...'}
            </p>
            <p className="text-neutral-400 text-[10px] sm:text-xs mt-0.5">Stand in frame</p>
          </div>
        )}

        <div className="flex-1" />

        {/* Pose Selection & Freeze Look Controller */}
        <div className="w-full flex justify-center mb-2">
          <PoseSelector
            currentPoseId={currentPoseId}
            onSelectPose={onSelectPose}
            isCameraFrozen={isCameraFrozen}
            onToggleFreezeCamera={onToggleFreezeCamera}
          />
        </div>

        {/* Live Status Hint */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-md text-[10px] sm:text-xs text-neutral-400 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse shrink-0" />
          <span>{viewMode === 'ar-live' ? 'Real-time Live Saree Tracking' : 'Drag 360° to view drape'}</span>
        </div>
      </div>

      {/* 3. BOTTOM CAROUSEL & ACTION BUTTON */}
      <footer className="w-full flex flex-col gap-2 sm:gap-3 pointer-events-auto">
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

          {/* Price Tag & Action Buttons */}
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[8px] sm:text-[10px] uppercase text-neutral-400 block tracking-wider">Price</span>
              <span className="text-sm sm:text-xl font-semibold text-white font-mono">
                {currentPreset.price}
              </span>
            </div>

            {/* AI Photorealistic Try-On Button */}
            <button
              onClick={onAITryOn}
              disabled={isAiLoading}
              title="Instant AI Photorealistic Cloth Drape (RTX 5060 Ti Local Engine)"
              className="py-2.5 px-3 sm:py-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-neutral-950 font-bold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-xl shadow-amber-400/30 transition-all transform active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
            >
              {isAiLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-950 fill-neutral-950" />
              )}
              <span className="hidden xs:inline">{isAiLoading ? 'Synthesizing...' : 'AI Try-On'}</span>
              <span className="xs:hidden">{isAiLoading ? 'AI...' : 'AI'}</span>
            </button>

            {/* Snap Camera Look Button */}
            <button
              onClick={onSnapPhoto}
              className="py-2.5 px-3 sm:py-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-neutral-900 border border-amber-500/40 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer shrink-0"
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 stroke-[2]" />
              <span className="hidden xs:inline">Snap</span>
            </button>

            {/* Generate 3D Avatar with Face & Body */}
            {viewMode === 'ar-live' && onGenerate3DFromCamera && (
              <button
                onClick={onGenerate3DFromCamera}
                title="Create 3D Avatar with your face & body using Gemini Vision"
                className="py-2.5 px-3 sm:py-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/80 hover:bg-amber-400/30 text-amber-300 hover:text-white font-semibold text-xs sm:text-sm tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer shrink-0"
              >
                <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 stroke-[2]" />
                <span className="hidden xs:inline">3D Avatar</span>
              </button>
            )}
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
