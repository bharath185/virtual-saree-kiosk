import { useEffect, useRef, useState, type FC } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RefreshCcw, Sparkles, Check, Sliders, ChevronUp } from 'lucide-react';
import type { SareeGarment } from '../../types/portal';
import { MaterialManager } from '../../engine/MaterialManager';
import { MannequinMeshGenerator, type MannequinRig } from '../../engine/MannequinMeshGenerator';
import { FaceProjectionEngine } from '../../engine/FaceProjectionEngine';
import type { GeminiBodyAnalysis } from '../../services/GeminiStylistService';

interface Lady3DStudioProps {
  selectedSaree: SareeGarment;
  userPhoto?: string;
  isCustomPhoto?: boolean;
  scales: {
    shoulderScale: number;
    waistHipScale: number;
    heightScale: number;
  };
  onScalesChange?: (newScales: { shoulderScale: number; waistHipScale: number; heightScale: number }) => void;
  geminiAdvice?: GeminiBodyAnalysis | null;
}

export const Lady3DStudio: FC<Lady3DStudioProps> = ({
  selectedSaree,
  userPhoto,
  isCustomPhoto = false,
  scales,
  onScalesChange,
  geminiAdvice
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rigRef = useRef<MannequinRig | null>(null);
  const materialManagerRef = useRef<MaterialManager>(new MaterialManager());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);
  const [activeCamAngle, setActiveCamAngle] = useState<'front' | 'back' | 'side'>('front');
  const [showSliders, setShowSliders] = useState<boolean>(false);

  // 1. Initialize Three.js Scene, Camera, Lighting, Controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 900;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x06060a);

    // Camera (Focal length suited for fashion portrait)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.15, 3.2);
    cameraRef.current = camera;

    // Renderer with ACESFilmic tone mapping & PBR soft shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.4;
    controls.maxDistance = 4.5;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.target.set(0, 0.98, 0);
    controls.update();
    controlsRef.current = controls;

    // Three-Point Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.2);
    scene.add(ambientLight);

    // Key Light (Warm soft fashion spotlight)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.8);
    keyLight.position.set(2.2, 3.2, 2.6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill Light (Cool lavender fill to soften shadows)
    const fillLight = new THREE.DirectionalLight(0xdce7ff, 1.4);
    fillLight.position.set(-2.4, 2.0, 1.8);
    scene.add(fillLight);

    // Rim Light (Metallic gold edge highlight for zari pop)
    const rimLight = new THREE.DirectionalLight(0xffdf88, 3.4);
    rimLight.position.set(0, 3.0, -2.8);
    scene.add(rimLight);

    // Floor Shadow Receiver
    const groundGeo = new THREE.PlaneGeometry(8, 8);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Load 3D Saree Material & Procedural Couture Rig
    materialManagerRef.current.applyPreset(selectedSaree.id);
    const sareeMaterial = materialManagerRef.current.getMaterial();

    const rig = MannequinMeshGenerator.createRig(sareeMaterial);
    rigRef.current = rig;
    scene.add(rig.group);
    rig.updateMorphs(scales.shoulderScale, scales.waistHipScale, scales.heightScale);
    rig.setPose('front');

    // Project face if user photo is present
    if (userPhoto) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const faceTex = FaceProjectionEngine.projectFaceFromImage(img);
        rig.updateFaceTexture(faceTex);
      };
      img.src = userPhoto;
    }

    setIsLoading(false);

    // 3. Animation render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Saree Material when selectedSaree changes
  useEffect(() => {
    materialManagerRef.current.applyPreset(selectedSaree.id);
    const newMat = materialManagerRef.current.getMaterial();
    if (rigRef.current) {
      rigRef.current.sareeMesh.material = newMat;
    }
  }, [selectedSaree]);

  // Update Body Dimensions when scales change (Gemini Vision or manual sliders)
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.updateMorphs(scales.shoulderScale, scales.waistHipScale, scales.heightScale);
    }
  }, [scales]);

  // Project customer face when userPhoto changes
  useEffect(() => {
    if (userPhoto && rigRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const faceTex = FaceProjectionEngine.projectFaceFromImage(img);
        rigRef.current?.updateFaceTexture(faceTex);
      };
      img.src = userPhoto;
    }
  }, [userPhoto]);

  // Handle auto-spin
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoSpinning;
      controlsRef.current.autoRotateSpeed = 1.8;
    }
  }, [isAutoSpinning]);

  const setCameraAngle = (angle: 'front' | 'back' | 'side') => {
    setActiveCamAngle(angle);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    if (angle === 'front') {
      cam.position.set(0, 1.15, 3.2);
    } else if (angle === 'back') {
      cam.position.set(0, 1.15, -3.2);
    } else if (angle === 'side') {
      cam.position.set(2.8, 1.15, 0.4);
    }
    controlsRef.current.target.set(0, 0.98, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-neutral-950">
      {/* 3D Canvas WebGL Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-3" />
          <h4 className="text-sm font-serif text-white">Loading 3D Couture Model...</h4>
          <p className="text-[11px] text-neutral-400 mt-1">Applying {selectedSaree.name} PBR drape & textures</p>
        </div>
      )}

      {/* 3D Floating Controls Overlay (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        {/* Camera Angle Presets */}
        <div className="p-1 rounded-full bg-neutral-900/90 border border-neutral-800 backdrop-blur-md shadow-xl flex items-center gap-1">
          <button
            onClick={() => setCameraAngle('front')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
              activeCamAngle === 'front'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setCameraAngle('back')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
              activeCamAngle === 'back'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Back Pallu
          </button>
          <button
            onClick={() => setCameraAngle('side')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
              activeCamAngle === 'side'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Side Profile
          </button>
        </div>

        {/* 360 Turntable Auto-Spin */}
        <button
          onClick={() => setIsAutoSpinning(!isAutoSpinning)}
          className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all cursor-pointer ${
            isAutoSpinning
              ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400'
              : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:text-white'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoSpinning ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-mono">360° Turntable</span>
        </button>

        {/* Reset Camera */}
        <button
          onClick={() => setCameraAngle('front')}
          title="Reset Camera View"
          className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Measurements & Sizing Panel (Top Left) */}
      <div className="absolute top-3 left-3 z-10 p-3 rounded-2xl bg-neutral-950/90 border border-amber-500/40 backdrop-blur-md shadow-2xl flex flex-col gap-1.5 text-[11px] max-w-[240px]">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-1.5">
          <div className="flex items-center gap-1.5 text-amber-300 font-serif font-bold uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>3D Body Measurements</span>
          </div>
          <button
            onClick={() => setShowSliders(!showSliders)}
            className="text-neutral-400 hover:text-white p-0.5 rounded cursor-pointer"
            title="Toggle measurement adjustments"
          >
            {showSliders ? <ChevronUp className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>

        {/* Readouts */}
        <div className="space-y-1 text-neutral-300 font-mono text-[10px]">
          {geminiAdvice && (
            <div className="flex justify-between items-center text-amber-300 font-serif font-semibold pb-1 border-b border-neutral-900">
              <span className="text-neutral-400">Body Type:</span>
              <span>{geminiAdvice.bodyType}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-400">Shoulders:</span>
            <span className="text-amber-200">
              {geminiAdvice?.estimatedShoulderCm ? `${geminiAdvice.estimatedShoulderCm}cm` : `${(scales.shoulderScale * 100).toFixed(0)}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Waist / Hips:</span>
            <span className="text-amber-200">
              {geminiAdvice?.estimatedWaistCm ? `${geminiAdvice.estimatedWaistCm}cm` : `${(scales.waistHipScale * 100).toFixed(0)}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Height:</span>
            <span className="text-amber-200">
              {geminiAdvice?.estimatedHeightCm ? `${geminiAdvice.estimatedHeightCm}cm` : `${(scales.heightScale * 100).toFixed(0)}%`}
            </span>
          </div>
        </div>

        {/* Interactive Sliders (When expanded) */}
        {showSliders && onScalesChange && (
          <div className="mt-2 pt-2 border-t border-neutral-800/80 space-y-2">
            <div>
              <div className="flex justify-between text-[9px] text-neutral-400">
                <span>Shoulder Span</span>
                <span>{(scales.shoulderScale * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.25"
                step="0.01"
                value={scales.shoulderScale}
                onChange={(e) =>
                  onScalesChange({ ...scales, shoulderScale: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-neutral-400">
                <span>Waist & Hips</span>
                <span>{(scales.waistHipScale * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.80"
                max="1.30"
                step="0.01"
                value={scales.waistHipScale}
                onChange={(e) =>
                  onScalesChange({ ...scales, waistHipScale: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-neutral-400">
                <span>Height</span>
                <span>{(scales.heightScale * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.90"
                max="1.15"
                step="0.01"
                value={scales.heightScale}
                onChange={(e) =>
                  onScalesChange({ ...scales, heightScale: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {isCustomPhoto && (
          <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-1 pt-1 border-t border-neutral-800">
            <Check className="w-3 h-3" />
            <span>Face Mapped onto 3D Model</span>
          </div>
        )}
      </div>

      {/* Interaction Hint (Bottom) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-neutral-950/80 border border-neutral-800 backdrop-blur-md text-[10px] text-neutral-400 flex items-center gap-1.5 shadow-lg pointer-events-none">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Drag 360° to view drape · Pinch or scroll to zoom</span>
      </div>
    </div>
  );
};
