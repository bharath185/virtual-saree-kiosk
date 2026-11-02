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
   * Analyzes customer photo using Gemini 1.5 Flash Vision to extract
   * 1. Exact body frame measurements for 3D mannequin morphing
   * 2. Skin tone undertone and couture colorway recommendations
   */
  public static async analyzeBodyAndStyle(
    photoBase64: string,
    apiKey?: string
  ): Promise<GeminiBodyAnalysis | null> {
    const key = apiKey || this.getStoredKey();
    if (!key) return null;

    // Clean base64 data URL
    let cleanBase64 = photoBase64;
    let mimeType = 'image/jpeg';
    if (photoBase64.includes(';base64,')) {
      const parts = photoBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      cleanBase64 = parts[1];
    }

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
  "bestSareePresetId": "<one of: 'kanjeevaram-red', 'royal-banarasi', 'navy-zardozi', 'emerald-silk', 'mustard-cotton', 'pastel-georgette'>",
  "bestSareeName": "<e.g. Royal Banarasi Silk Blue>",
  "stylingAdvice": "<2 short sentences with personalized draping & jewelry recommendations>"
}
`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
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
        console.warn('Gemini API call failed with status:', res.status);
        return null;
      }

      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) return null;

      const parsed: GeminiBodyAnalysis = JSON.parse(rawJson);
      // Clamp scales within 3D mesh safety limits
      parsed.shoulderScale = Math.min(1.30, Math.max(0.80, Number(parsed.shoulderScale) || 1.0));
      parsed.waistHipScale = Math.min(1.35, Math.max(0.75, Number(parsed.waistHipScale) || 1.0));
      parsed.heightScale = Math.min(1.20, Math.max(0.85, Number(parsed.heightScale) || 1.0));

      return parsed;
    } catch (err) {
      console.warn('Gemini analysis error:', err);
      return null;
    }
  }
}
