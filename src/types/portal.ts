export type SareeFabric = 'Silk' | 'Banarasi' | 'Kanjeevaram' | 'Georgette' | 'Chanderi' | 'Cotton' | 'Organza';

export type DrapingStyleId = 'nivi' | 'gujarati' | 'bengali' | 'nauvari' | 'kerala';

export type SleeveStyle = 'sleeveless' | 'cap' | 'elbow' | 'three-quarter' | 'full' | 'puff' | 'bell';

export type JewelleryTypeId = 'temple' | 'kundan' | 'polki' | 'kasu-mala' | 'pearl' | 'oxidised';

export type SceneId = 'original' | 'mandap' | 'palace-reception' | 'temple' | 'garden' | 'studio';

export interface SareeGarment {
  id: string;
  name: string;
  fabric: SareeFabric;
  origin: string;
  price: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  zariType: string;
  frontImage: string;
  backImage: string;
  drapePresetImages?: Partial<Record<DrapingStyleId, { front: string; back: string }>>;
  recommendedJewellery: JewelleryTypeId;
  recommendedBlouseColor: string;
}

export interface DrapingStyle {
  id: DrapingStyleId;
  name: string;
  region: string;
  description: string;
  palluPlacement: string;
  pleatStyle: string;
}

export interface BlouseConfig {
  color: string;
  colorName: string;
  sleeveStyle: SleeveStyle;
  neckline?: string;
  isContrast: boolean;
}

export interface JewellerySet {
  id: JewelleryTypeId;
  name: string;
  category: string;
  description: string;
  pieces: string[];
  swatchColor: string;
  accentColor: string;
}

export interface OccasionScene {
  id: SceneId;
  name: string;
  category: string;
  description: string;
  lightingTone: string;
  previewColor: string;
  bgUrl?: string;
}

export interface TryOnResult {
  lookId: string;
  frontUrl: string;
  backUrl: string;
  originalUserPhoto: string;
  saree: SareeGarment;
  drapingStyle: DrapingStyle;
  blouse: BlouseConfig;
  jewellery: JewellerySet;
  scene: OccasionScene;
  generatedAt: string;
  isAiGenerated: boolean;
}
