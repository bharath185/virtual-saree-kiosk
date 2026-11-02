import type { AvatarPose, AvatarPoseId } from '../types';

export const AVATAR_POSES: AvatarPose[] = [
  {
    id: 'front',
    name: 'Regal Front',
    label: 'Front View',
    description: 'Classic upright bridal posture showcasing front pleats and diagonal pallu sweep.',
    cameraPosition: { x: 0, y: 1.22, z: 3.4 },
    rigRotationY: 0
  },
  {
    id: 'side-turn',
    name: '3/4 Grace',
    label: '3/4 Turn',
    description: 'S-curve contour highlighting the hip drape and cascading left shoulder drape.',
    cameraPosition: { x: 1.2, y: 1.25, z: 3.0 },
    rigRotationY: -0.45
  },
  {
    id: 'namaste',
    name: 'Anjali Mudra',
    label: 'Namaste',
    description: 'Traditional welcoming posture with hands held gracefully in front of chest.',
    cameraPosition: { x: 0, y: 1.25, z: 3.0 },
    rigRotationY: 0.1
  },
  {
    id: 'runway',
    name: 'Runway Stride',
    label: 'Catwalk Stride',
    description: 'Dynamic flared motion demonstrating fabric fluid movement and embroidered hem border.',
    cameraPosition: { x: -1.1, y: 1.15, z: 3.1 },
    rigRotationY: 0.38
  },
  {
    id: 'pallu-back',
    name: 'Pallu Showcase',
    label: 'Back & Pallu',
    description: 'Over-the-shoulder glance displaying the master zari work on the back pallu.',
    cameraPosition: { x: 0.8, y: 1.28, z: -3.2 },
    rigRotationY: 2.85
  }
];

export class PoseAnimationEngine {
  public static getPose(id: AvatarPoseId): AvatarPose {
    return AVATAR_POSES.find((p) => p.id === id) || AVATAR_POSES[0];
  }
}
