export interface GeminiBodyAnalysis {
  shoulderScale: number;
  waistHipScale: number;
  heightScale: number;
  bodyType: string;
  estimatedShoulderCm: number;
  estimatedWaistCm: number;
  estimatedHeightCm: number;
  skinUndertone: string;
  bestSareePresetId: string;
  bestSareeName: string;
  stylingAdvice: string;
}

export class GeminiStylistService {
  private static readonly STORAGE_KEY = 'divya_gemini_token';

  public static getStoredKey(): string {
    return localStorage.getItem(this.STORAGE_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  }

  public static setStoredKey(key: string): void {
    if (key) {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Downscales base64 image if larger than maxDim to ensure sub-second Gemini network upload
   */
  public static async downscaleImage(photoBase64: string, maxDim: number = 720): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve) => {
      let mimeType = 'image/jpeg';
      let clean = photoBase64;
      if (photoBase64.includes(';base64,')) {
        const parts = photoBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'image/jpeg';
        clean = parts[1];
      }

      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve({ base64: clean, mimeType });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (w <= maxDim && h <= maxDim) {
          resolve({ base64: clean, mimeType });
          return;
        }

        const scale = Math.min(maxDim / w, maxDim / h);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: clean, mimeType });
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg'
        });
      };
      img.onerror = () => resolve({ base64: clean, mimeType });
      img.src = photoBase64;
    });
  }

  /**
   * Analyzes customer photo using Gemini Vision to extract
   * 1. Exact body frame measurements for 3D mannequin morphing
   * 2. Skin tone undertone and couture colorway recommendations
   */
  public static async analyzeBodyAndStyle(
    photoBase64: string,
    apiKey?: string
  ): Promise<GeminiBodyAnalysis | null> {
    const key = apiKey || this.getStoredKey();
    if (!key) return null;

    const { base64: cleanBase64, mimeType } = await this.downscaleImage(photoBase64);

    const promptText = `
You are a master haute-couture fashion tailor and computer vision expert analyzing this customer photo for a 3D Virtual Saree Try-On Kiosk.

Analyze the person's visible physical build, posture, and facial undertones.
Return ONLY valid JSON with this exact schema:
{
  "shoulderScale": <number between 0.85 and 1.25, where 1.0 is standard>,
  "waistHipScale": <number between 0.80 and 1.30, where 1.0 is standard>,
  "heightScale": <number between 0.90 and 1.15, where 1.0 is standard>,
  "bodyType": "<Short label e.g. Petite Hourglass, Slender Tall, Athletic, Curvy>",
  "estimatedShoulderCm": <number e.g. 38.5>,
  "estimatedWaistCm": <number e.g. 70.0>,
  "estimatedHeightCm": <number e.g. 165.0>,
  "skinUndertone": "<e.g. Warm Golden, Cool Olive, Fair Peach, Deep Bronze>",
  "bestSareePresetId": "<must be one of: 'kanjeevaram-red', 'royal-banarasi', 'navy-zardozi', 'emerald-silk', 'mustard-cotton', 'pastel-georgette'>",
  "bestSareeName": "<e.g. Royal Banarasi Silk Blue>",
  "stylingAdvice": "<2 short sentences with personalized draping & jewelry recommendations>"
}
`;

    // Try available Gemini vision models in priority order
    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];

    for (const model of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptText },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: cleanBase64
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2
              }
            })
          }
        );

        if (!res.ok) {
          console.warn(`Gemini model ${model} returned status ${res.status}`);
          continue;
        }

        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) continue;

        const parsed: GeminiBodyAnalysis = JSON.parse(rawJson);
        // Clamp scales within 3D mesh safety limits
        parsed.shoulderScale = Math.min(1.30, Math.max(0.80, Number(parsed.shoulderScale) || 1.0));
        parsed.waistHipScale = Math.min(1.35, Math.max(0.75, Number(parsed.waistHipScale) || 1.0));
        parsed.heightScale = Math.min(1.20, Math.max(0.85, Number(parsed.heightScale) || 1.0));

        // Sanitize preset ID to match available catalog
        const validPresets = [
          'kanjeevaram-red',
          'royal-banarasi',
          'navy-zardozi',
          'emerald-silk',
          'mustard-cotton',
          'pastel-georgette'
        ];
        if (!validPresets.includes(parsed.bestSareePresetId)) {
          const matched = validPresets.find((p) => parsed.bestSareePresetId?.includes(p) || p.includes(parsed.bestSareePresetId));
          parsed.bestSareePresetId = matched || 'navy-zardozi';
        }

        return parsed;
      } catch (err) {
        console.warn(`Error trying Gemini model ${model}:`, err);
      }
    }

    return null;
  }
}
