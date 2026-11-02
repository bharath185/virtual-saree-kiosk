export interface BodyMeasurements {
  shoulderWidth: number; // raw normalized distance between shoulders (approx 0.18 - 0.35)
  torsoHeight: number;   // raw normalized distance from nose/shoulder to hips/ankles
  hipWidth: number;       // raw normalized hip width
  torsoToHipRatio: number;
}

export interface MorphScales {
  shoulderScale: number; // 0.85 to 1.25 (default 1.0)
  waistHipScale: number; // 0.80 to 1.30 (default 1.0)
  heightScale: number;   // 0.90 to 1.15 (default 1.0)
}

export type CalibrationStatus = 'idle' | 'searching' | 'aligning' | 'calibrating' | 'calibrated' | 'error';

export interface CalibrationState {
  status: CalibrationStatus;
  progress: number; // 0 to 100%
  message: string;
  isInsideGuide: boolean;
  lockedScales: MorphScales | null;
}

export interface SareePreset {
  id: string;
  name: string;
  fabric: string;
  origin: string;
  price: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
  zariType: 'Gold Foil' | 'Silver Brocade' | 'Temple Zari' | 'Sheer Matte' | 'Thread Work';
  roughness: number;
  metalness: number;
  sheen?: number;
  transmission?: number;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
