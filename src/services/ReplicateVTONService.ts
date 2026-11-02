export interface VTONResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  executionTimeSec?: number;
}

const IDM_VTON_VERSION = 'c871bb9b046616b680442285f002e8bcbec190f9d3d499b82b3380f90c14d9f4';

export class ReplicateVTONService {
  private static readonly STORAGE_KEY = 'divya_replicate_token';

  public static getStoredToken(): string {
    return localStorage.getItem(this.STORAGE_KEY) || '';
  }

  public static setStoredToken(token: string): void {
    if (token) {
      localStorage.setItem(this.STORAGE_KEY, token.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Runs IDM-VTON model on Replicate to generate a 99%+ photorealistic garment try-on
   */
  public static async tryOnWithReplicate(
    humanImageBase64: string,
    garmentImageUrl: string,
    garmentDescription: string = 'Indian Silk Saree with Gold Embroidery',
    apiToken?: string
  ): Promise<VTONResult> {
    const token = apiToken || this.getStoredToken();
    if (!token) {
      return {
        success: false,
        error: 'Replicate API Token is required. Please enter your free Replicate API key in Settings.'
      };
    }

    const t0 = performance.now();

    try {
      // 1. Create prediction
      const createRes = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait=5'
        },
        body: JSON.stringify({
          version: IDM_VTON_VERSION,
          input: {
            human_img: humanImageBase64,
            garm_img: garmentImageUrl,
            garment_des: garmentDescription,
            category: 'dresses',
            crop: false,
            steps: 30
          }
        })
      });

      if (!createRes.ok) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson.detail || `Replicate API error: ${createRes.status} ${createRes.statusText}`);
      }

      let prediction = await createRes.json();

      // 2. Poll until completed if not already finished
      const maxAttempts = 35;
      let attempts = 0;

      while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
        attempts++;
        if (attempts > maxAttempts) {
          throw new Error('Try-on processing timed out. Please try again.');
        }

        await new Promise((r) => setTimeout(r, 2000));

        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!pollRes.ok) {
          throw new Error('Failed to check prediction status.');
        }

        prediction = await pollRes.json();
      }

      if (prediction.status === 'succeeded' && prediction.output) {
        const outUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        const elapsed = (performance.now() - t0) / 1000;
        return {
          success: true,
          imageUrl: outUrl,
          executionTimeSec: Number(elapsed.toFixed(1))
        };
      } else {
        throw new Error(prediction.error || 'VTON model generation failed.');
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Error communicating with Replicate VTON service.'
      };
    }
  }
}
