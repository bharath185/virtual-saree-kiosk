import { useEffect, useRef, useImperativeHandle, forwardRef, type RefObject } from 'react';
import type { CameraFacingMode, LandmarkPoint, SareePreset } from '../types';
import { ARSareeEngine } from '../vision/ARSareeEngine';

export interface ARLiveMirrorHandle {
  captureScreenshot: () => string;
}

interface ARLiveMirrorProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarks: LandmarkPoint[];
  currentPreset: SareePreset;
  facingMode: CameraFacingMode;
  isFrozen: boolean;
}

export const ARLiveMirror = forwardRef<ARLiveMirrorHandle, ARLiveMirrorProps>(
  ({ videoRef, landmarks, currentPreset, facingMode, isFrozen }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameId = useRef<number | null>(null);
    const frozenFrameRef = useRef<HTMLCanvasElement | null>(null);
    const demoRefImg = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
      const img = new Image();
      img.src = '/sarees/teal_zardozi_reference.jpg';
      demoRefImg.current = img;
    }, []);

    useImperativeHandle(ref, () => ({
      captureScreenshot: () => {
        if (!canvasRef.current) return '';
        return canvasRef.current.toDataURL('image/png', 1.0);
      }
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const isMirrored = facingMode === 'user';

      const render = () => {
        const video = videoRef.current;
        const w = canvas.width;
        const h = canvas.height;

        if (isFrozen && frozenFrameRef.current) {
          // Render frozen captured frame
          ctx.drawImage(frozenFrameRef.current, 0, 0, w, h);
          // Still allow re-rendering saree if user swaps presets while frozen!
          ARSareeEngine.renderLiveSaree(ctx, w, h, landmarks, currentPreset, isMirrored);
          animFrameId.current = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, w, h);

        if (video && video.readyState >= 2) {
          // Draw full-screen live video feed (preserving aspect ratio)
          const vw = video.videoWidth || 640;
          const vh = video.videoHeight || 480;
          const videoAspect = vw / vh;
          const canvasAspect = w / h;

          let sx = 0, sy = 0, sw = vw, sh = vh;
          if (videoAspect > canvasAspect) {
            sw = vh * canvasAspect;
            sx = (vw - sw) / 2;
          } else {
            sh = vw / canvasAspect;
            sy = (vh - sh) / 2;
          }

          ctx.save();
          if (isMirrored) {
            ctx.scale(-1, 1);
            ctx.drawImage(video, sx, sy, sw, sh, -w, 0, w, h);
          } else {
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
          }
          ctx.restore();

          // Save current clean frame for potential freezing
          if (!frozenFrameRef.current) {
            frozenFrameRef.current = document.createElement('canvas');
          }
          frozenFrameRef.current.width = w;
          frozenFrameRef.current.height = h;
          const fCtx = frozenFrameRef.current.getContext('2d');
          if (fCtx) {
            fCtx.drawImage(canvas, 0, 0);
          }
        } else {
          // If webcam is not ready, draw the high-fashion studio reference model from your photo
          if (demoRefImg.current && demoRefImg.current.complete) {
            const img = demoRefImg.current;
            const imgAspect = img.width / img.height;
            const canvasAspect = w / h;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;
            if (imgAspect > canvasAspect) {
              sw = img.height * canvasAspect;
              sx = (img.width - sw) / 2;
            } else {
              sh = img.width / canvasAspect;
              sy = (img.height - sh) / 2;
            }
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
          } else {
            const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
            bgGrad.addColorStop(0, '#0F1018');
            bgGrad.addColorStop(0.5, '#171822');
            bgGrad.addColorStop(1, '#09090E');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);
          }
        }

        // 2. Render Draped Saree directly on top of the live customer's body!
        if (landmarks && landmarks.length >= 25) {
          ARSareeEngine.renderLiveSaree(ctx, w, h, landmarks, currentPreset, isMirrored);
        }

        animFrameId.current = requestAnimationFrame(render);
      };

      // Set canvas internal resolution to client resolution
      const handleResize = () => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      animFrameId.current = requestAnimationFrame(render);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameId.current !== null) {
          cancelAnimationFrame(animFrameId.current);
        }
      };
    }, [videoRef, landmarks, currentPreset, facingMode, isFrozen]);

    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>
    );
  }
);

ARLiveMirror.displayName = 'ARLiveMirror';
