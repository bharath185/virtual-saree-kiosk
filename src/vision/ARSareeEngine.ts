import type { LandmarkPoint, SareePreset } from '../types';

export class ARSareeEngine {
  private static animationTime: number = 0;

  /**
   * Renders the authentic Indian draped saree directly onto the customer's live body in real time.
   * Components rendered:
   * 1. Designer Blouse (Choli) with neckline and short sleeves
   * 2. Flared Saree Skirt with vertical pleats (niripulu) and heavy bottom zari border
   * 3. Diagonal Pallu sweeping from right waist over left shoulder with trailing folds
   */
  public static renderLiveSaree(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    landmarks: LandmarkPoint[],
    preset: SareePreset,
    isMirrored: boolean
  ): void {
    if (!landmarks || landmarks.length < 25) return;

    this.animationTime += 0.03;

    // MediaPipe key landmarks:
    // 11: Left Shoulder, 12: Right Shoulder
    // 23: Left Hip, 24: Right Hip
    // 25: Left Knee, 26: Right Knee
    // 27: Left Ankle, 28: Right Ankle
    const rawLSh = landmarks[11];
    const rawRSh = landmarks[12];
    const rawLHip = landmarks[23];
    const rawRHip = landmarks[24];
    const rawLKnee = landmarks[25];
    const rawRKnee = landmarks[26];
    const rawLAnk = landmarks[27];
    const rawRAnk = landmarks[28];

    if (!rawLSh || !rawRSh || !rawLHip || !rawRHip) return;

    // Helper to transform normalized coordinate to pixel space
    // Account for mirroring if video is flipped
    const toPx = (pt: LandmarkPoint) => ({
      x: isMirrored ? (1 - pt.x) * width : pt.x * width,
      y: pt.y * height
    });

    const lSh = toPx(rawLSh);
    const rSh = toPx(rawRSh);
    const lHip = toPx(rawLHip);
    const rHip = toPx(rawRHip);

    // Estimate knees & ankles if partially out of frame
    const midHipY = (lHip.y + rHip.y) / 2;
    const torsoH = Math.abs(midHipY - (lSh.y + rSh.y) / 2);

    const lKnee = rawLKnee ? toPx(rawLKnee) : { x: lHip.x, y: lHip.y + torsoH * 1.1 };
    const rKnee = rawRKnee ? toPx(rawRKnee) : { x: rHip.x, y: rHip.y + torsoH * 1.1 };
    const lAnk = rawLAnk ? toPx(rawLAnk) : { x: lHip.x * 0.95, y: Math.min(height - 10, lHip.y + torsoH * 2.2) };
    const rAnk = rawRAnk ? toPx(rawRAnk) : { x: rHip.x * 1.05, y: Math.min(height - 10, rHip.y + torsoH * 2.2) };

    const midShoulder = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
    const midHip = { x: (lHip.x + rHip.x) / 2, y: midHipY };
    const shoulderWidth = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);

    ctx.save();

    // 1. RENDER SAREE SKIRT & ACCORDION PLEATS (from waist/hips to ankles)
    this.renderSkirtAndPleats(ctx, lHip, rHip, lKnee, rKnee, lAnk, rAnk, preset);

    // 2. RENDER DESIGNER BLOUSE (CHOLI)
    this.renderBlouse(ctx, lSh, rSh, lHip, rHip, midShoulder, shoulderWidth, preset);

    // 3. RENDER DIAGONAL PALLU (Sweeping across torso to left shoulder)
    this.renderDiagonalPallu(ctx, lSh, rSh, lHip, rHip, midShoulder, midHip, shoulderWidth, preset, isMirrored);

    ctx.restore();
  }

  /**
   * Saree Skirt & Front Pleats
   */
  private static renderSkirtAndPleats(
    ctx: CanvasRenderingContext2D,
    lHip: { x: number; y: number },
    rHip: { x: number; y: number },
    _lKnee: { x: number; y: number },
    _rKnee: { x: number; y: number },
    lAnk: { x: number; y: number },
    rAnk: { x: number; y: number },
    preset: SareePreset
  ): void {
    ctx.save();

    const minAnkleY = Math.max(lAnk.y, rAnk.y);
    const flareLeft = Math.min(lHip.x, lAnk.x) - 35;
    const flareRight = Math.max(rHip.x, rAnk.x) + 35;

    // Draw main skirt path
    ctx.beginPath();
    ctx.moveTo(lHip.x - 15, lHip.y);
    ctx.quadraticCurveTo(lHip.x - 25, (lHip.y + minAnkleY) / 2, flareLeft, minAnkleY);
    // Scalloped / curving bottom hem
    ctx.quadraticCurveTo((flareLeft + flareRight) / 2, minAnkleY + 15, flareRight, minAnkleY);
    ctx.quadraticCurveTo(rHip.x + 25, (rHip.y + minAnkleY) / 2, rHip.x + 15, rHip.y);
    // Waist contour
    ctx.quadraticCurveTo((lHip.x + rHip.x) / 2, (lHip.y + rHip.y) / 2 + 10, lHip.x - 15, lHip.y);
    ctx.closePath();

    // Skirt Fabric Gradient (Rich silk sheen)
    const skirtGrad = ctx.createLinearGradient(
      lHip.x,
      lHip.y,
      rHip.x,
      minAnkleY
    );
    skirtGrad.addColorStop(0, preset.primaryColor);
    skirtGrad.addColorStop(0.35, this.adjustBrightness(preset.primaryColor, 18));
    skirtGrad.addColorStop(0.7, preset.primaryColor);
    skirtGrad.addColorStop(1, this.adjustBrightness(preset.primaryColor, -25));

    ctx.fillStyle = skirtGrad;
    ctx.fill();

    // Render Undulating Front Accordion Pleats (Niripulu)
    const midWaistX = (lHip.x + rHip.x) / 2;
    const midWaistY = (lHip.y + rHip.y) / 2 + 5;
    const pleatCount = 7;
    const pleatSpan = (flareRight - flareLeft) * 0.45;

    for (let i = 0; i < pleatCount; i++) {
      const t = (i / (pleatCount - 1)) - 0.5; // -0.5 to +0.5
      const pxTop = midWaistX + t * 25;
      const pxBottom = midWaistX + t * pleatSpan;

      // Shadow crease
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(pxTop, midWaistY);
      ctx.quadraticCurveTo(
        midWaistX + t * (pleatSpan * 0.6) + Math.sin(this.animationTime + i) * 3,
        (midWaistY + minAnkleY) / 2,
        pxBottom,
        minAnkleY
      );
      ctx.stroke();

      // Highlight crease
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pxTop + 2, midWaistY);
      ctx.quadraticCurveTo(
        midWaistX + t * (pleatSpan * 0.6) + 2,
        (midWaistY + minAnkleY) / 2,
        pxBottom + 3,
        minAnkleY
      );
      ctx.stroke();
    }

    // Heavy Royal Golden Zari Border on Hem (bottom 45px)
    const borderH = 42;
    ctx.save();
    ctx.clip(); // Clip inside skirt shape

    // Gold zari fill
    const zariGrad = ctx.createLinearGradient(flareLeft, minAnkleY - borderH, flareRight, minAnkleY);
    zariGrad.addColorStop(0, '#D4AF37');
    zariGrad.addColorStop(0.25, '#FFF2A8');
    zariGrad.addColorStop(0.5, '#D4AF37');
    zariGrad.addColorStop(0.75, '#FFE58F');
    zariGrad.addColorStop(1, '#996515');

    ctx.fillStyle = zariGrad;
    ctx.fillRect(flareLeft - 20, minAnkleY - borderH, (flareRight - flareLeft) + 40, borderH + 20);

    // Intricate geometric Indian brocade patterns on zari border
    ctx.strokeStyle = 'rgba(139, 10, 26, 0.55)'; // Maroon thread accent
    ctx.lineWidth = 1.5;
    for (let bx = flareLeft - 20; bx < flareRight + 40; bx += 18) {
      ctx.beginPath();
      ctx.moveTo(bx, minAnkleY - borderH + 4);
      ctx.lineTo(bx + 9, minAnkleY - 8);
      ctx.lineTo(bx + 18, minAnkleY - borderH + 4);
      ctx.stroke();
    }

    // Top gold piping line
    ctx.strokeStyle = '#FFE87C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(flareLeft - 20, minAnkleY - borderH);
    ctx.lineTo(flareRight + 40, minAnkleY - borderH);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  /**
   * Designer Blouse (Choli)
   */
  private static renderBlouse(
    ctx: CanvasRenderingContext2D,
    lSh: { x: number; y: number },
    rSh: { x: number; y: number },
    lHip: { x: number; y: number },
    rHip: { x: number; y: number },
    midShoulder: { x: number; y: number },
    shoulderWidth: number,
    preset: SareePreset
  ): void {
    ctx.save();

    // Blouse waist sits at ~55% of torso height
    const blouseBottomY = (midShoulder.y + (lHip.y + rHip.y) / 2) / 2 + 15;
    const neckDepth = shoulderWidth * 0.38;
    const neckWidth = shoulderWidth * 0.28;

    // Blouse path
    ctx.beginPath();
    // Left shoulder seam
    ctx.moveTo(lSh.x - 12, lSh.y - 5);
    // Neckline (Sweetheart / U-shape)
    ctx.quadraticCurveTo(
      midShoulder.x - neckWidth * 0.5,
      midShoulder.y + 5,
      midShoulder.x,
      midShoulder.y + neckDepth
    );
    ctx.quadraticCurveTo(
      midShoulder.x + neckWidth * 0.5,
      midShoulder.y + 5,
      rSh.x + 12,
      rSh.y - 5
    );
    // Right armhole & sleeve
    ctx.lineTo(rSh.x + 28, rSh.y + 35);
    ctx.lineTo(rSh.x + 10, rSh.y + 50);
    // Right waist side
    ctx.lineTo(rHip.x + 8, blouseBottomY);
    // Waist hem curve
    ctx.quadraticCurveTo(midShoulder.x, blouseBottomY + 10, lHip.x - 8, blouseBottomY);
    // Left waist side
    ctx.lineTo(lSh.x - 10, lSh.y + 50);
    // Left sleeve
    ctx.lineTo(lSh.x - 28, lSh.y + 35);
    ctx.closePath();

    // Blouse fabric (matching saree secondary/accent tone with silk luster)
    const blouseGrad = ctx.createLinearGradient(lSh.x, lSh.y, rHip.x, blouseBottomY);
    blouseGrad.addColorStop(0, this.adjustBrightness(preset.primaryColor, -15));
    blouseGrad.addColorStop(0.5, preset.primaryColor);
    blouseGrad.addColorStop(1, this.adjustBrightness(preset.primaryColor, -25));

    ctx.fillStyle = blouseGrad;
    ctx.fill();

    // Golden Zari Piping along Neckline
    ctx.strokeStyle = '#E5C158';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(lSh.x + neckWidth * 0.5, lSh.y + 2);
    ctx.quadraticCurveTo(
      midShoulder.x - neckWidth * 0.5,
      midShoulder.y + 5,
      midShoulder.x,
      midShoulder.y + neckDepth
    );
    ctx.quadraticCurveTo(
      midShoulder.x + neckWidth * 0.5,
      midShoulder.y + 5,
      rSh.x - neckWidth * 0.5,
      rSh.y + 2
    );
    ctx.stroke();

    // Golden trim on sleeve cuffs
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lSh.x - 28, lSh.y + 35);
    ctx.lineTo(lSh.x - 10, lSh.y + 50);
    ctx.moveTo(rSh.x + 28, rSh.y + 35);
    ctx.lineTo(rSh.x + 10, rSh.y + 50);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Diagonal Draped Saree Pallu (Sweeping across torso to shoulder)
   */
  private static renderDiagonalPallu(
    ctx: CanvasRenderingContext2D,
    lSh: { x: number; y: number },
    rSh: { x: number; y: number },
    lHip: { x: number; y: number },
    rHip: { x: number; y: number },
    midShoulder: { x: number; y: number },
    midHip: { x: number; y: number },
    shoulderWidth: number,
    preset: SareePreset,
    isMirrored: boolean
  ): void {
    ctx.save();

    // In Indian draping (Nivi style):
    // Pallu sweeps from right waist across bust over left shoulder and flows down the back
    // If mirrored, left and right in screen space are inverted accordingly
    const anchorHip = isMirrored ? lHip : rHip;
    const targetShoulder = isMirrored ? rSh : lSh;

    const palluWidth = shoulderWidth * 0.58;

    // Main Pallu Diagonal Path
    ctx.beginPath();
    // Start at right waist tuck
    ctx.moveTo(anchorHip.x - 10, anchorHip.y + 5);
    // Sweep diagonally across midriff
    ctx.quadraticCurveTo(
      midHip.x + (isMirrored ? -25 : 25),
      (midHip.y + midShoulder.y) / 2 + 10,
      targetShoulder.x + (isMirrored ? 10 : -10),
      targetShoulder.y - 15
    );
    // Over shoulder peak
    ctx.lineTo(targetShoulder.x + (isMirrored ? -palluWidth * 0.7 : palluWidth * 0.7), targetShoulder.y - 12);
    // Trailing edge flowing down the side/back
    const trailY = targetShoulder.y + (lHip.y - targetShoulder.y) * 1.35;
    const trailX = targetShoulder.x + (isMirrored ? -palluWidth * 0.9 : palluWidth * 0.9);
    ctx.quadraticCurveTo(
      targetShoulder.x + (isMirrored ? -palluWidth : palluWidth),
      (targetShoulder.y + trailY) / 2,
      trailX,
      trailY
    );
    // Pallu bottom width
    ctx.lineTo(trailX + (isMirrored ? 45 : -45), trailY - 15);
    // Inner contour across chest
    ctx.quadraticCurveTo(
      midShoulder.x,
      (midShoulder.y + midHip.y) / 2,
      anchorHip.x + (isMirrored ? -15 : 15),
      anchorHip.y + 40
    );
    ctx.closePath();

    // Pallu Fabric Shading with deep luxurious silk gradient
    const palluGrad = ctx.createLinearGradient(anchorHip.x, anchorHip.y, targetShoulder.x, targetShoulder.y);
    palluGrad.addColorStop(0, this.adjustBrightness(preset.primaryColor, -10));
    palluGrad.addColorStop(0.45, this.adjustBrightness(preset.primaryColor, 15));
    palluGrad.addColorStop(0.85, preset.primaryColor);
    palluGrad.addColorStop(1, this.adjustBrightness(preset.primaryColor, -20));

    ctx.fillStyle = palluGrad;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Heavy Golden Embroidered Zari Border along the leading edge of the Pallu
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(anchorHip.x - 10, anchorHip.y + 5);
    ctx.quadraticCurveTo(
      midHip.x + (isMirrored ? -25 : 25),
      (midHip.y + midShoulder.y) / 2 + 10,
      targetShoulder.x + (isMirrored ? 10 : -10),
      targetShoulder.y - 15
    );
    ctx.lineTo(trailX, trailY);
    ctx.stroke();

    // Golden micro piping & foil sheen
    ctx.strokeStyle = '#FFE58F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(anchorHip.x - 10, anchorHip.y + 5);
    ctx.quadraticCurveTo(
      midHip.x + (isMirrored ? -25 : 25),
      (midHip.y + midShoulder.y) / 2 + 10,
      targetShoulder.x + (isMirrored ? 10 : -10),
      targetShoulder.y - 15
    );
    ctx.lineTo(trailX, trailY);
    ctx.stroke();

    // Natural drape crease shadows
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2.5;
    for (let c = 1; c <= 3; c++) {
      ctx.beginPath();
      ctx.moveTo(anchorHip.x + (isMirrored ? -c * 8 : c * 8), anchorHip.y + 15);
      ctx.quadraticCurveTo(
        midHip.x + (isMirrored ? -15 + c * 6 : 15 - c * 6),
        (midHip.y + midShoulder.y) / 2 + 5,
        targetShoulder.x + (isMirrored ? -c * 10 : c * 10),
        targetShoulder.y - 5
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  private static adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return `#${(
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)}`;
  }
}
