import * as THREE from 'three';
import type { SareePreset } from '../types';
import { TextureGenerator } from './TextureGenerator';

export const SAREE_CATALOG: SareePreset[] = [
  {
    id: 'kanjeevaram-red',
    name: 'Kanjeevaram Bridal Crimson',
    fabric: 'Pure Mulberry Silk',
    origin: 'Kanchipuram, Tamil Nadu',
    price: '₹ 48,500',
    primaryColor: '#8B0A1A',
    secondaryColor: '#E5B83B',
    accentColor: '#FFD700',
    description: 'Heavy silk woven with 24k gold electroplated zari border and grand pallu.',
    zariType: 'Gold Foil',
    roughness: 0.22,
    metalness: 0.85,
    sheen: 0.9
  },
  {
    id: 'royal-banarasi',
    name: 'Banarasi Royal Neelam',
    fabric: 'Katan Silk Brocade',
    origin: 'Varanasi, Uttar Pradesh',
    price: '₹ 56,000',
    primaryColor: '#081D58',
    secondaryColor: '#D6DDE5',
    accentColor: '#E5C158',
    description: 'Midnight royal blue jacquard with intricately hand-spun silver & gold floral jaal.',
    zariType: 'Silver Brocade',
    roughness: 0.32,
    metalness: 0.75,
    sheen: 0.7
  },
  {
    id: 'emerald-silk',
    name: 'Mayilkan Emerald Silk',
    fabric: 'Soft Satin Pattu',
    origin: 'Dharmavaram, Andhra Pradesh',
    price: '₹ 38,900',
    primaryColor: '#064E3B',
    secondaryColor: '#C5A028',
    accentColor: '#D4AF37',
    description: 'Deep forest emerald drape adorned with auspicious architectural temple spire borders.',
    zariType: 'Temple Zari',
    roughness: 0.25,
    metalness: 0.65,
    sheen: 0.85
  },
  {
    id: 'pastel-georgette',
    name: 'Gulabi Chiffon Georgette',
    fabric: 'Translucent Crêpe Georgette',
    origin: 'Surat, Gujarat',
    price: '₹ 24,500',
    primaryColor: '#F4A7B9',
    secondaryColor: '#FFF0F5',
    accentColor: '#DC8296',
    description: 'Feather-light powder pink drape with fluid silhouette and delicate scalloped hem.',
    zariType: 'Sheer Matte',
    roughness: 0.65,
    metalness: 0.05,
    transmission: 0.15
  },
  {
    id: 'mustard-cotton',
    name: 'Pithambari Handloom Khadi',
    fabric: 'Organic Cotton Handloom',
    origin: 'Mangalagiri, Andhra Pradesh',
    price: '₹ 14,200',
    primaryColor: '#E5A912',
    secondaryColor: '#671418',
    accentColor: '#B47805',
    description: 'Crisp sunlit yellow woven on traditional pit looms with artisanal maroon Nizam borders.',
    zariType: 'Thread Work',
    roughness: 0.85,
    metalness: 0.0
  }
];

export class MaterialManager {
  private sareeMaterial: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
  private currentPresetId: string = 'kanjeevaram-red';

  constructor() {
    // Single shared material instance to guarantee sub-100ms updates
    this.sareeMaterial = new THREE.MeshPhysicalMaterial({
      roughness: 0.22,
      metalness: 0.85,
      clearcoat: 0.1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });

    // Warm up the initial texture
    this.applyPreset('kanjeevaram-red');
  }

  public getMaterial(): THREE.Material {
    return this.sareeMaterial;
  }

  public getCurrentPreset(): SareePreset {
    return SAREE_CATALOG.find((p) => p.id === this.currentPresetId) || SAREE_CATALOG[0];
  }

  /**
   * High-speed PBR material swapping (<100ms)
   * Updates only texture pointers and shader uniforms in-place without geometry recomputation.
   */
  public applyPreset(presetId: string): { switchTimeMs: number; preset: SareePreset } {
    const t0 = performance.now();
    const preset = SAREE_CATALOG.find((p) => p.id === presetId);
    if (!preset) return { switchTimeMs: 0, preset: SAREE_CATALOG[0] };

    const textures = TextureGenerator.getOrCreateTextures(preset.id);

    // Update material properties in place
    this.sareeMaterial.map = textures.map;
    this.sareeMaterial.normalMap = textures.normalMap;
    this.sareeMaterial.roughnessMap = textures.roughnessMap;
    this.sareeMaterial.metalnessMap = textures.metalnessMap;

    this.sareeMaterial.roughness = preset.roughness;
    this.sareeMaterial.metalness = preset.metalness;

    if (preset.transmission !== undefined && 'transmission' in this.sareeMaterial) {
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).transmission = preset.transmission;
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).transparent = true;
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).opacity = 0.95;
    } else {
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).transmission = 0;
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).transparent = false;
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).opacity = 1.0;
    }

    if (preset.sheen !== undefined && 'sheen' in this.sareeMaterial) {
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).sheen = preset.sheen;
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).sheenRoughness = 0.3;
      (this.sareeMaterial as THREE.MeshPhysicalMaterial).sheenColor = new THREE.Color(preset.accentColor);
    }

    this.sareeMaterial.needsUpdate = true;
    this.currentPresetId = presetId;

    const switchTimeMs = Number((performance.now() - t0).toFixed(2));
    return { switchTimeMs, preset };
  }
}
