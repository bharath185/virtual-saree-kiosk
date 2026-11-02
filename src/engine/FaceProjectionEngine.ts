import * as THREE from 'three';
import type { LandmarkPoint } from '../types';

export class FaceProjectionEngine {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;
  private static texture: THREE.CanvasTexture | null = null;

  public static initialize(): THREE.CanvasTexture {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 512;
      this.canvas.height = 512;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.texture.generateMipmaps = true;
      this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    }

    this.drawRealisticCoutureFace();
    return this.texture!;
  }

  public static getTexture(): THREE.CanvasTexture {
    if (!this.texture) {
      return this.initialize();
    }
    return this.texture;
  }

  /**
   * Projects the customer's live face from video into the 3D face texture
   */
  public static projectCustomerFace(
    video: HTMLVideoElement,
    landmarks: LandmarkPoint[]
  ): THREE.CanvasTexture {
    if (!this.canvas || !this.ctx || !this.texture) {
      this.initialize();
    }

    const ctx = this.ctx!;
    const size = 512;

    // First draw base realistic skin & hairline
    this.drawRealisticCoutureFace();

    if (!video || video.readyState < 2) {
      return this.texture!;
    }

    try {
      // Find face bounds from landmarks
      // Landmark 0: Nose
      // Landmark 11, 12: Shoulders
      const nose = landmarks && landmarks[0];
      const leftShoulder = landmarks && landmarks[11];
      const rightShoulder = landmarks && landmarks[12];

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      let faceX = vw * 0.5;
      let faceY = vh * 0.28;
      let faceRadius = vh * 0.16;

      if (nose && leftShoulder && rightShoulder) {
        faceX = nose.x * vw;
        faceY = (nose.y - 0.03) * vh;
        const shoulderDist = Math.hypot(
          (leftShoulder.x - rightShoulder.x) * vw,
          (leftShoulder.y - rightShoulder.y) * vh
        );
        faceRadius = Math.max(40, shoulderDist * 0.42);
      }

      // Create a temporary canvas to extract face circle with soft feathered border
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = size;
      tempCanvas.height = size;
      const tCtx = tempCanvas.getContext('2d')!;

      // Source rectangle
      const sx = Math.max(0, faceX - faceRadius);
      const sy = Math.max(0, faceY - faceRadius * 1.15);
      const sw = Math.min(vw - sx, faceRadius * 2);
      const sh = Math.min(vh - sy, faceRadius * 2.3);

      // Draw clipped face oval
      tCtx.save();
      tCtx.beginPath();
      tCtx.ellipse(size / 2, size * 0.48, size * 0.34, size * 0.42, 0, 0, Math.PI * 2);
      tCtx.clip();

      // Draw customer video frame
      tCtx.drawImage(video, sx, sy, sw, sh, size * 0.12, size * 0.08, size * 0.76, size * 0.82);
      tCtx.restore();

      // Soft feathering blur mask
      const gradient = ctx.createRadialGradient(
        size / 2,
        size * 0.48,
        size * 0.25,
        size / 2,
        size * 0.48,
        size * 0.42
      );
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.85, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      // Blend onto main canvas
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();

      // Draw ornamental bindi and subtle hairline accents on top
      this.drawEthnicAccents(ctx, size);

      this.texture!.needsUpdate = true;
    } catch (err) {
      console.warn('Face projection warning, using default couture face:', err);
    }

    return this.texture!;
  }

  /**
   * Projects a static customer photo / selfie onto the 3D head texture
   */
  public static projectFaceFromImage(
    img: HTMLImageElement | HTMLCanvasElement,
    landmarks?: LandmarkPoint[]
  ): THREE.CanvasTexture {
    if (!this.canvas || !this.ctx || !this.texture) {
      this.initialize();
    }

    const ctx = this.ctx!;
    const size = 512;

    this.drawRealisticCoutureFace();

    try {
      const iw = (img as HTMLImageElement).naturalWidth || img.width || 512;
      const ih = (img as HTMLImageElement).naturalHeight || img.height || 512;

      let faceX = iw * 0.5;
      let faceY = ih * 0.22;
      let faceRadius = Math.min(iw, ih) * 0.22;

      if (landmarks && landmarks.length > 12) {
        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        if (nose && leftShoulder && rightShoulder) {
          faceX = nose.x * iw;
          faceY = (nose.y - 0.02) * ih;
          const shoulderDist = Math.hypot(
            (leftShoulder.x - rightShoulder.x) * iw,
            (leftShoulder.y - rightShoulder.y) * ih
          );
          faceRadius = Math.max(40, shoulderDist * 0.44);
        }
      }

      const sx = Math.max(0, faceX - faceRadius);
      const sy = Math.max(0, faceY - faceRadius * 1.1);
      const sw = Math.min(iw - sx, faceRadius * 2);
      const sh = Math.min(ih - sy, faceRadius * 2.3);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = size;
      tempCanvas.height = size;
      const tCtx = tempCanvas.getContext('2d')!;

      tCtx.save();
      tCtx.beginPath();
      tCtx.ellipse(size / 2, size * 0.48, size * 0.34, size * 0.42, 0, 0, Math.PI * 2);
      tCtx.clip();
      tCtx.drawImage(img, sx, sy, sw, sh, size * 0.12, size * 0.08, size * 0.76, size * 0.82);
      tCtx.restore();

      // Soft feathering radial gradient blur mask
      const gradient = ctx.createRadialGradient(
        size / 2,
        size * 0.48,
        size * 0.25,
        size / 2,
        size * 0.48,
        size * 0.42
      );
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(0.85, 'rgba(0,0,0,0.85)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();

      this.drawEthnicAccents(ctx, size);
      this.texture!.needsUpdate = true;
    } catch (e) {
      console.warn('Face projection from image warning:', e);
    }

    return this.texture!;
  }

  /**
   * Generates a high-fashion, realistic Indian couture face texture
   */
  public static drawRealisticCoutureFace(): void {
    if (!this.canvas || !this.ctx || !this.texture) return;
    const ctx = this.ctx;
    const size = 512;

    // 1. Warm Indian bridal complexion tone (#E8B896 to #D29A72)
    const skinGrad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.45,
      size * 0.05,
      size * 0.5,
      size * 0.5,
      size * 0.45
    );
    skinGrad.addColorStop(0, '#F5CBB0');
    skinGrad.addColorStop(0.5, '#E4B28E');
    skinGrad.addColorStop(0.85, '#D09871');
    skinGrad.addColorStop(1, '#B97C52');

    ctx.fillStyle = skinGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Realistic Sleek Center-Parted Hair (Juda/Chignon)
    ctx.fillStyle = '#181210';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.lineTo(size, size * 0.32);
    // Hairline curves
    ctx.bezierCurveTo(size * 0.8, size * 0.28, size * 0.65, size * 0.22, size * 0.5, size * 0.26);
    ctx.bezierCurveTo(size * 0.35, size * 0.22, size * 0.2, size * 0.28, 0, size * 0.32);
    ctx.closePath();
    ctx.fill();

    // Side hair volume
    ctx.beginPath();
    ctx.ellipse(size * 0.08, size * 0.45, size * 0.12, size * 0.25, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.92, size * 0.45, size * 0.12, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Elegant arched eyebrows
    ctx.strokeStyle = '#2A1B14';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Left eyebrow
    ctx.beginPath();
    ctx.moveTo(size * 0.30, size * 0.40);
    ctx.quadraticCurveTo(size * 0.38, size * 0.36, size * 0.45, size * 0.39);
    ctx.stroke();

    // Right eyebrow
    ctx.beginPath();
    ctx.moveTo(size * 0.55, size * 0.39);
    ctx.quadraticCurveTo(size * 0.62, size * 0.36, size * 0.70, size * 0.40);
    ctx.stroke();

    // 4. Expressive Almond Kohl Eyes (Indian Kajal aesthetic)
    this.drawKajalEye(ctx, size * 0.37, size * 0.45, size * 0.08, false);
    this.drawKajalEye(ctx, size * 0.63, size * 0.45, size * 0.08, true);

    // 5. Soft Sculpted Nose & Highlights
    ctx.fillStyle = 'rgba(180, 110, 70, 0.25)';
    ctx.beginPath();
    ctx.moveTo(size * 0.49, size * 0.42);
    ctx.lineTo(size * 0.48, size * 0.56);
    ctx.lineTo(size * 0.44, size * 0.60);
    ctx.quadraticCurveTo(size * 0.50, size * 0.62, size * 0.56, size * 0.60);
    ctx.lineTo(size * 0.52, size * 0.56);
    ctx.closePath();
    ctx.fill();

    // Nose bridge highlight
    ctx.fillStyle = 'rgba(255, 245, 235, 0.28)';
    ctx.beginPath();
    ctx.ellipse(size * 0.50, size * 0.52, 3, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Natural Rose Lip Color
    const lipGrad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.72,
      2,
      size * 0.5,
      size * 0.72,
      28
    );
    lipGrad.addColorStop(0, '#C24D5B');
    lipGrad.addColorStop(0.7, '#A83242');
    lipGrad.addColorStop(1, 'rgba(150, 40, 50, 0.2)');

    ctx.fillStyle = lipGrad;
    // Upper lip
    ctx.beginPath();
    ctx.moveTo(size * 0.42, size * 0.71);
    ctx.quadraticCurveTo(size * 0.46, size * 0.69, size * 0.50, size * 0.70);
    ctx.quadraticCurveTo(size * 0.54, size * 0.69, size * 0.58, size * 0.71);
    ctx.quadraticCurveTo(size * 0.50, size * 0.73, size * 0.42, size * 0.71);
    ctx.fill();

    // Lower lip
    ctx.beginPath();
    ctx.moveTo(size * 0.42, size * 0.71);
    ctx.quadraticCurveTo(size * 0.50, size * 0.76, size * 0.58, size * 0.71);
    ctx.quadraticCurveTo(size * 0.50, size * 0.72, size * 0.42, size * 0.71);
    ctx.fill();

    // 7. Ethnic Accents (Bindi, Maang Tikka, Jhumka reflections)
    this.drawEthnicAccents(ctx, size);

    this.texture.needsUpdate = true;
  }

  private static drawKajalEye(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    isRight: boolean
  ): void {
    ctx.save();
    // Eye white
    ctx.fillStyle = '#FCF8F5';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, w * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deep warm brown iris
    ctx.fillStyle = '#26140D';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Black pupil
    ctx.fillStyle = '#050302';
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Light reflection spark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx - w * 0.12, cy - w * 0.12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Kohl / Kajal eyeliner outline
    ctx.strokeStyle = '#0F0906';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Upper lid
    ctx.moveTo(cx - w, cy);
    ctx.quadraticCurveTo(cx, cy - w * 0.55, cx + w, cy);
    // Subtle winged outer flick
    if (isRight) {
      ctx.lineTo(cx + w + 5, cy - 3);
    } else {
      ctx.lineTo(cx - w - 5, cy - 3);
    }
    ctx.stroke();

    // Lower lash line
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - w, cy);
    ctx.quadraticCurveTo(cx, cy + w * 0.45, cx + w, cy);
    ctx.stroke();

    ctx.restore();
  }

  private static drawEthnicAccents(ctx: CanvasRenderingContext2D, size: number): void {
    // Traditional Crimson Red Bindi between brows
    ctx.fillStyle = '#8B0A1A';
    ctx.beginPath();
    ctx.arc(size * 0.50, size * 0.36, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Tiny gold bead at center of bindi
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(size * 0.50, size * 0.36, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Golden Maang Tikka chain in hair parting
    ctx.strokeStyle = '#E5B83B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.50, 0);
    ctx.lineTo(size * 0.50, size * 0.25);
    ctx.stroke();

    // Maang tikka pendant
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(size * 0.50, size * 0.27, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pearl drop
    ctx.fillStyle = '#FFF8E7';
    ctx.beginPath();
    ctx.arc(size * 0.50, size * 0.295, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
