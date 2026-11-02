import * as THREE from 'three';

export interface PBRTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  metalnessMap: THREE.CanvasTexture;
}

export class TextureGenerator {
  private static cache: Map<string, PBRTextureSet> = new Map();

  public static getOrCreateTextures(presetId: string): PBRTextureSet {
    if (this.cache.has(presetId)) {
      return this.cache.get(presetId)!;
    }

    const textures = this.generateTexturesForPreset(presetId);
    this.cache.set(presetId, textures);
    return textures;
  }

  private static generateTexturesForPreset(presetId: string): PBRTextureSet {
    const size = 1024;

    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = size;
    albedoCanvas.height = size;
    const albedoCtx = albedoCanvas.getContext('2d')!;

    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = size;
    normalCanvas.height = size;
    const normalCtx = normalCanvas.getContext('2d')!;

    const roughnessCanvas = document.createElement('canvas');
    roughnessCanvas.width = size;
    roughnessCanvas.height = size;
    const roughnessCtx = roughnessCanvas.getContext('2d')!;

    const metalnessCanvas = document.createElement('canvas');
    metalnessCanvas.width = size;
    metalnessCanvas.height = size;
    const metalnessCtx = metalnessCanvas.getContext('2d')!;

    // Generate patterns based on preset
    switch (presetId) {
      case 'kanjeevaram-red':
        this.drawKanjeevaramRed(albedoCtx, normalCtx, roughnessCtx, metalnessCtx, size);
        break;
      case 'royal-banarasi':
        this.drawBanarasiBlue(albedoCtx, normalCtx, roughnessCtx, metalnessCtx, size);
        break;
      case 'emerald-silk':
        this.drawEmeraldTempleSilk(albedoCtx, normalCtx, roughnessCtx, metalnessCtx, size);
        break;
      case 'pastel-georgette':
        this.drawPastelGeorgette(albedoCtx, normalCtx, roughnessCtx, metalnessCtx, size);
        break;
      case 'mustard-cotton':
        this.drawMustardCotton(albedoCtx, normalCtx, roughnessCtx, metalnessCtx, size);
        break;
      default:
        this.drawKanjeevaramRed(albedoCtx, normalCtx, roughnessCtx, metalnessCtx, size);
    }

    const map = new THREE.CanvasTexture(albedoCanvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 2);
    map.colorSpace = THREE.SRGBColorSpace;

    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(2, 2);

    const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(2, 2);

    const metalnessMap = new THREE.CanvasTexture(metalnessCanvas);
    metalnessMap.wrapS = THREE.RepeatWrapping;
    metalnessMap.wrapT = THREE.RepeatWrapping;
    metalnessMap.repeat.set(2, 2);

    return { map, normalMap, roughnessMap, metalnessMap };
  }

  // 1. Kanjeevaram Silk Red with rich gold zari borders
  private static drawKanjeevaramRed(
    albedo: CanvasRenderingContext2D,
    normal: CanvasRenderingContext2D,
    roughness: CanvasRenderingContext2D,
    metalness: CanvasRenderingContext2D,
    size: number
  ) {
    // Crimson silk base
    albedo.fillStyle = '#8B0A1A';
    albedo.fillRect(0, 0, size, size);

    // Subtle micro-weave sheen
    for (let y = 0; y < size; y += 4) {
      albedo.fillStyle = y % 8 === 0 ? 'rgba(215, 38, 56, 0.3)' : 'rgba(100, 5, 15, 0.3)';
      albedo.fillRect(0, y, size, 2);
    }

    // Normal base: flat tangent plane (128, 128, 255)
    normal.fillStyle = '#8080FF';
    normal.fillRect(0, 0, size, size);

    // Silk low roughness (~0.22)
    roughness.fillStyle = '#383838';
    roughness.fillRect(0, 0, size, size);

    // Metalness: 0 for fabric body
    metalness.fillStyle = '#000000';
    metalness.fillRect(0, 0, size, size);

    // Broad Golden Zari Border on Pallu / Hem (bottom 250px)
    const borderY = size - 260;
    const borderHeight = 260;

    // Gold zari base
    albedo.fillStyle = '#E5B83B';
    albedo.fillRect(0, borderY, size, borderHeight);

    // Gold zari metalness & low roughness
    metalness.fillStyle = '#F5F5F5';
    metalness.fillRect(0, borderY, size, borderHeight);

    roughness.fillStyle = '#202020';
    roughness.fillRect(0, borderY, size, borderHeight);

    // Intricate Indian Zari Motifs: Diamonds & Paisleys
    const diamondStep = 40;
    for (let x = 0; x < size; x += diamondStep) {
      for (let y = borderY + 20; y < size - 20; y += diamondStep) {
        // Draw diamond zari pattern
        albedo.fillStyle = '#FFF2A8';
        albedo.beginPath();
        albedo.moveTo(x + diamondStep / 2, y);
        albedo.lineTo(x + diamondStep, y + diamondStep / 2);
        albedo.lineTo(x + diamondStep / 2, y + diamondStep);
        albedo.lineTo(x, y + diamondStep / 2);
        albedo.closePath();
        albedo.fill();

        // Inner ruby dot in diamond
        albedo.fillStyle = '#8B0A1A';
        albedo.beginPath();
        albedo.arc(x + diamondStep / 2, y + diamondStep / 2, 4, 0, Math.PI * 2);
        albedo.fill();

        // Normal map stamp for embossed foil depth
        normal.fillStyle = '#9C6FDD';
        normal.fillRect(x + 2, y + 2, diamondStep - 4, diamondStep - 4);
      }
    }

    // Gold zari thin stripes at the top of border
    for (let i = 0; i < 4; i++) {
      const lineY = borderY - 15 - i * 12;
      albedo.fillStyle = '#FFD700';
      albedo.fillRect(0, lineY, size, 6);
      metalness.fillStyle = '#FFFFFF';
      metalness.fillRect(0, lineY, size, 6);
    }
  }

  // 2. Royal Blue Banarasi Brocade with Silver & Gold Floral Jaal
  private static drawBanarasiBlue(
    albedo: CanvasRenderingContext2D,
    normal: CanvasRenderingContext2D,
    roughness: CanvasRenderingContext2D,
    metalness: CanvasRenderingContext2D,
    size: number
  ) {
    // Deep royal blue
    albedo.fillStyle = '#081D58';
    albedo.fillRect(0, 0, size, size);

    normal.fillStyle = '#8080FF';
    normal.fillRect(0, 0, size, size);

    roughness.fillStyle = '#404040';
    roughness.fillRect(0, 0, size, size);

    metalness.fillStyle = '#000000';
    metalness.fillRect(0, 0, size, size);

    // Intricate Floral Jaal across the entire saree body
    const jaalStep = 64;
    for (let x = 0; x < size; x += jaalStep) {
      for (let y = 0; y < size; y += jaalStep) {
        // Silver-gold floral buta
        albedo.fillStyle = 'rgba(230, 235, 245, 0.85)';
        albedo.beginPath();
        albedo.arc(x + 32, y + 32, 14, 0, Math.PI * 2);
        albedo.fill();

        // Petals
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const px = x + 32 + Math.cos(angle) * 22;
          const py = y + 32 + Math.sin(angle) * 22;
          albedo.fillStyle = '#E5C158'; // Gold petal edge
          albedo.beginPath();
          albedo.arc(px, py, 6, 0, Math.PI * 2);
          albedo.fill();
        }

        // Metallic for the brocade
        metalness.fillStyle = '#DCDCDC';
        metalness.fillRect(x + 14, y + 14, 36, 36);

        // Raised brocade normal
        normal.fillStyle = '#8CB3E6';
        normal.fillRect(x + 16, y + 16, 32, 32);
      }
    }

    // Heavy Banarasi Silver zari border
    const borderY = size - 220;
    albedo.fillStyle = '#D6DDE5';
    albedo.fillRect(0, borderY, size, 220);
    metalness.fillStyle = '#EEEEEE';
    metalness.fillRect(0, borderY, size, 220);
    roughness.fillStyle = '#1A1A1A';
    roughness.fillRect(0, borderY, size, 220);
  }

  // 3. Emerald Green Silk with Temple Zari Border
  private static drawEmeraldTempleSilk(
    albedo: CanvasRenderingContext2D,
    normal: CanvasRenderingContext2D,
    roughness: CanvasRenderingContext2D,
    metalness: CanvasRenderingContext2D,
    size: number
  ) {
    // Rich emerald green
    albedo.fillStyle = '#064E3B';
    albedo.fillRect(0, 0, size, size);

    // Satin-smooth silk roughness (~0.25)
    roughness.fillStyle = '#3F3F3F';
    roughness.fillRect(0, 0, size, size);

    normal.fillStyle = '#8080FF';
    normal.fillRect(0, 0, size, size);

    metalness.fillStyle = '#000000';
    metalness.fillRect(0, 0, size, size);

    // Temple Border: Sacred geometric Gopuram / Triangles
    const borderY = size - 240;
    const triangleWidth = 48;
    const triangleHeight = 60;

    // Temple triangle row
    for (let x = 0; x < size; x += triangleWidth) {
      albedo.fillStyle = '#D4AF37'; // Antique temple gold
      albedo.beginPath();
      albedo.moveTo(x, borderY);
      albedo.lineTo(x + triangleWidth / 2, borderY - triangleHeight);
      albedo.lineTo(x + triangleWidth, borderY);
      albedo.closePath();
      albedo.fill();

      // Metalness & normal map for temple spikes
      metalness.fillStyle = '#FFFFFF';
      metalness.beginPath();
      metalness.moveTo(x, borderY);
      metalness.lineTo(x + triangleWidth / 2, borderY - triangleHeight);
      metalness.lineTo(x + triangleWidth, borderY);
      metalness.closePath();
      metalness.fill();
    }

    // Solid antique gold zari base below temples
    albedo.fillStyle = '#C5A028';
    albedo.fillRect(0, borderY, size, 240);
    metalness.fillStyle = '#F0F0F0';
    metalness.fillRect(0, borderY, size, 240);
    roughness.fillStyle = '#2A2A2A';
    roughness.fillRect(0, borderY, size, 240);
  }

  // 4. Pastel Georgette Pink - Translucent, High Roughness (~0.65), Matte Finish
  private static drawPastelGeorgette(
    albedo: CanvasRenderingContext2D,
    normal: CanvasRenderingContext2D,
    roughness: CanvasRenderingContext2D,
    metalness: CanvasRenderingContext2D,
    size: number
  ) {
    // Soft romantic blush pink
    albedo.fillStyle = '#F4A7B9';
    albedo.fillRect(0, 0, size, size);

    // Subtle crepe weave noise
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      albedo.fillStyle = Math.random() > 0.5 ? 'rgba(255, 235, 240, 0.4)' : 'rgba(220, 130, 150, 0.3)';
      albedo.fillRect(rx, ry, 3, 3);
    }

    // Matte finish (roughness ~0.65)
    roughness.fillStyle = '#A6A6A6';
    roughness.fillRect(0, 0, size, size);

    // Zero metalness
    metalness.fillStyle = '#000000';
    metalness.fillRect(0, 0, size, size);

    // Fine crepe thread bump normal
    normal.fillStyle = '#8080FF';
    normal.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 8) {
      normal.fillStyle = '#8A82F0';
      normal.fillRect(0, y, size, 2);
    }

    // Delicate scalloped lace hem border
    const borderY = size - 120;
    albedo.fillStyle = '#FFF0F5';
    albedo.fillRect(0, borderY, size, 120);

    for (let x = 0; x < size; x += 30) {
      albedo.beginPath();
      albedo.arc(x + 15, borderY, 15, 0, Math.PI);
      albedo.fillStyle = '#FFF0F5';
      albedo.fill();
    }
  }

  // 5. Mustard Yellow Cotton - Zero Metallic, Handloom Woven Khadi Thread Bump
  private static drawMustardCotton(
    albedo: CanvasRenderingContext2D,
    normal: CanvasRenderingContext2D,
    roughness: CanvasRenderingContext2D,
    metalness: CanvasRenderingContext2D,
    size: number
  ) {
    // Rich handloom mustard yellow
    albedo.fillStyle = '#E5A912';
    albedo.fillRect(0, 0, size, size);

    // Cross-weave slub cotton texture
    for (let x = 0; x < size; x += 6) {
      albedo.fillStyle = 'rgba(180, 120, 5, 0.15)';
      albedo.fillRect(x, 0, 2, size);
    }
    for (let y = 0; y < size; y += 6) {
      albedo.fillStyle = 'rgba(255, 220, 100, 0.2)';
      albedo.fillRect(0, y, size, 2);
    }

    // Cotton high roughness (~0.85)
    roughness.fillStyle = '#D9D9D9';
    roughness.fillRect(0, 0, size, size);

    // Pure cotton: absolutely 0 metalness
    metalness.fillStyle = '#000000';
    metalness.fillRect(0, 0, size, size);

    // Woven thread bump normal map
    normal.fillStyle = '#8080FF';
    normal.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += 12) {
      normal.fillStyle = '#7888F5';
      normal.fillRect(x, 0, 3, size);
    }

    // Contrast maroon handloom thread border
    const borderY = size - 160;
    albedo.fillStyle = '#671418';
    albedo.fillRect(0, borderY, size, 160);

    // Traditional Ikkat arrow geometric lines
    albedo.fillStyle = '#E5A912';
    for (let x = 0; x < size; x += 24) {
      albedo.fillRect(x + 4, borderY + 20, 8, 120);
    }
  }
}
