import type { FC } from 'react';
import { Pause, Play, Sparkles } from 'lucide-react';
import type { AvatarPoseId } from '../types';
import { AVATAR_POSES } from '../engine/PoseAnimationEngine';

interface PoseSelectorProps {
  currentPoseId: AvatarPoseId;
  onSelectPose: (poseId: AvatarPoseId) => void;
  isCameraFrozen: boolean;
  onToggleFreezeCamera: () => void;
}

export const PoseSelector: FC<PoseSelectorProps> = ({
  currentPoseId,
  onSelectPose,
  isCameraFrozen,
  onToggleFreezeCamera
}) => {
  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-auto z-20">
      {/* Freeze / Live Camera Action Pill */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFreezeCamera}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer ${
            isCameraFrozen
              ? 'bg-amber-500 text-neutral-950 shadow-amber-500/30 ring-2 ring-amber-400'
              : 'bg-neutral-900/90 text-white border border-amber-500/40 hover:bg-neutral-800'
          }`}
        >
          {isCameraFrozen ? (
            <>
              <Play className="w-3.5 h-3.5 fill-neutral-950" />
              <span>Resume Live Camera</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span className="flex items-center gap-1">
                <span>Freeze Look & Try Poses</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
            </>
          )}
        </button>
      </div>

      {/* 5 Poses Stills Pill Selector */}
      <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-neutral-950/85 border border-neutral-800/90 backdrop-blur-md shadow-xl overflow-x-auto no-scrollbar max-w-full">
        {AVATAR_POSES.map((pose) => {
          const isActive = pose.id === currentPoseId;
          return (
            <button
              key={pose.id}
              onClick={() => onSelectPose(pose.id)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-neutral-950 font-bold shadow-md shadow-amber-500/25'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <span>{pose.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
