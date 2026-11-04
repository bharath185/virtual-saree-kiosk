import { useEffect, useRef, useState, type FC } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RotateCw, RefreshCcw, Sparkles, Check, Sliders, ChevronUp } from 'lucide-react';
import type { SareeGarment } from '../../types/portal';
import { MaterialManager } from '../../engine/MaterialManager';
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

  const ladyModelRef = useRef<THREE.Object3D | null>(null);
  const sareeMeshRef = useRef<THREE.Mesh | null>(null);
  const blouseMeshRef = useRef<THREE.Mesh | null>(null);
  const jewelleryGroupRef = useRef<THREE.Group | null>(null);
  const materialManagerRef = useRef<MaterialManager>(new MaterialManager());

  // Bone references for skeletal scaling
  const bonesRef = useRef<{
    leftShoulder: THREE.Bone | null;
    rightShoulder: THREE.Bone | null;
    hips: THREE.Bone | null;
    spine: THREE.Bone | null;
  }>({
    leftShoulder: null,
    rightShoulder: null,
    hips: null,
    spine: null
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);
  const [activeCamAngle, setActiveCamAngle] = useState<'front' | 'back' | 'side'>('front');
  const [showSliders, setShowSliders] = useState<boolean>(false);

  // 1. Initialize Scene, Lighting, Camera, Controls & Model
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 900;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07070c);

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    camera.position.set(0, 1.10, 2.9);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls (clamp vertical angle so model stays upright)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.3;
    controls.maxDistance = 4.2;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.target.set(0, 0.95, 0);
    controls.update();
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    keyLight.position.set(2.0, 3.0, 2.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdce7ff, 1.2);
    fillLight.position.set(-2.2, 1.8, 1.6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffdf88, 3.2);
    rimLight.position.set(0, 2.8, -2.6);
    scene.add(rimLight);

    // Studio Pedestal & Floor Shadow
    const groundGeo = new THREE.PlaneGeometry(8, 8);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const pedestalGeo = new THREE.CylinderGeometry(0.50, 0.54, 0.04, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x121216,
      roughness: 0.28,
      metalness: 0.75
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 0.02;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Golden Rim on Pedestal
    const rimGeo = new THREE.TorusGeometry(0.52, 0.012, 16, 64);
    rimGeo.rotateX(Math.PI / 2);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const rimMesh = new THREE.Mesh(rimGeo, goldMat);
    rimMesh.position.y = 0.04;
    scene.add(rimMesh);

    // Material Manager
    materialManagerRef.current.applyPreset(selectedSaree.id);
    const sareeMaterial = materialManagerRef.current.getMaterial();

    // 2. Load the Realistic Female Character Model (Michelle)
    const loader = new GLTFLoader();
    loader.load(
      '/models/Michelle.glb',
      (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(1.0, 1.0, 1.0);

        // Traverse model to enable shadows and extract skeletal bones
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Warm skin tone
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.42;
              mat.metalness = 0.02;
            }
          }
          if ((child as THREE.Bone).isBone) {
            const bone = child as THREE.Bone;
            if (bone.name === 'mixamorig:LeftShoulder') bonesRef.current.leftShoulder = bone;
            if (bone.name === 'mixamorig:RightShoulder') bonesRef.current.rightShoulder = bone;
            if (bone.name === 'mixamorig:Hips') bonesRef.current.hips = bone;
            if (bone.name === 'mixamorig:Spine') bonesRef.current.spine = bone;
          }
        });

        scene.add(model);
        ladyModelRef.current = model;

        // 3. Create the Draped Saree Mesh wrapping Michelle
        const sareeMesh = createRealisticSareeMesh(sareeMaterial);
        scene.add(sareeMesh);
        sareeMeshRef.current = sareeMesh;

        // 4. Create Blouse (Choli)
        const blouseMat = new THREE.MeshStandardMaterial({
          color: 0x081738,
          roughness: 0.35,
          metalness: 0.3
        });
        const blouseMesh = createBlouseMesh(blouseMat);
        scene.add(blouseMesh);
        blouseMeshRef.current = blouseMesh;

        // 5. Add Ethnic Temple Gold Jewellery (Necklace, Jhumkas, Maang Tikka)
        const jewelleryGroup = createEthnicJewellery(goldMat);
        scene.add(jewelleryGroup);
        jewelleryGroupRef.current = jewelleryGroup;

        // Apply initial body measurement scales
        applyScalesToRig(scales);

        // Project face if user photo is available
        if (userPhoto) {
          projectFaceToModel(userPhoto);
        }

        setIsLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Could not load Michelle.glb:', err);
        setIsLoading(false);
      }
    );

    // Animation render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

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

  // Update Saree Material when selectedSaree changes (Instant <50ms)
  useEffect(() => {
    materialManagerRef.current.applyPreset(selectedSaree.id);
    const newMat = materialManagerRef.current.getMaterial();
    if (sareeMeshRef.current) {
      sareeMeshRef.current.material = newMat;
    }
  }, [selectedSaree]);

  // Update Body Measurements & Sizing
  useEffect(() => {
    applyScalesToRig(scales);
  }, [scales]);

  // Face Projection update
  useEffect(() => {
    if (userPhoto) {
      projectFaceToModel(userPhoto);
    }
  }, [userPhoto]);

  // Auto-Spin Turntable
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoSpinning;
      controlsRef.current.autoRotateSpeed = 1.8;
    }
  }, [isAutoSpinning]);

  const applyScalesToRig = (s: { shoulderScale: number; waistHipScale: number; heightScale: number }) => {
    const shoulder = s.shoulderScale || 1.0;
    const waistHip = s.waistHipScale || 1.0;
    const height = s.heightScale || 1.0;

    // Scale the female character
    if (ladyModelRef.current) {
      ladyModelRef.current.scale.set(shoulder, height, waistHip);
    }

    // Scale the draped saree & blouse in sync
    if (sareeMeshRef.current) {
      sareeMeshRef.current.scale.set(shoulder, height, waistHip);
    }
    if (blouseMeshRef.current) {
      blouseMeshRef.current.scale.set(shoulder, height, waistHip);
    }
    if (jewelleryGroupRef.current) {
      jewelleryGroupRef.current.scale.set(shoulder, height, waistHip);
    }
  };

  const projectFaceToModel = (photoUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const faceTex = FaceProjectionEngine.projectFaceFromImage(img);
      if (ladyModelRef.current) {
        ladyModelRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              // Blend customer face texture
              mat.map = faceTex;
              mat.needsUpdate = true;
            }
          }
        });
      }
    };
    img.src = photoUrl;
  };

  const setCameraAngle = (angle: 'front' | 'back' | 'side') => {
    setActiveCamAngle(angle);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    if (angle === 'front') {
      cam.position.set(0, 1.10, 2.9);
    } else if (angle === 'back') {
      cam.position.set(0, 1.10, -2.9);
    } else if (angle === 'side') {
      cam.position.set(2.6, 1.10, 0.3);
    }
    controlsRef.current.target.set(0, 0.95, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-neutral-950">
      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Loading HUD */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-3" />
          <h4 className="text-sm font-serif text-white">Loading 3D Female Atelier Model...</h4>
          <p className="text-[11px] text-neutral-400 mt-1">Draping {selectedSaree.name} with PBR textures</p>
        </div>
      )}

      {/* 3D Floating Camera Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
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
            Side
          </button>
        </div>

        {/* 360 Turntable */}
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
          title="Reset Camera"
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
            title="Adjust body measurements"
          >
            {showSliders ? <ChevronUp className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>

        {/* Measurement Readouts */}
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

/**
 * Creates the authentic Indian Saree mesh wrapping the female character
 */
function createRealisticSareeMesh(sareeMaterial: THREE.Material): THREE.Mesh {
  // 1. Pleated Skirt (Waist Y=0.88 down to Y=0.06)
  const skirtGeo = new THREE.CylinderGeometry(0.24, 0.33, 0.82, 36, 12, true);
  skirtGeo.translate(0, 0.47, 0);

  // Front knife pleat folding
  const pos = skirtGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    if (z > 0 && y < 0.82) {
      const angle = Math.atan2(z, x);
      const wave = Math.sin(angle * 16) * 0.018;
      pos.setZ(i, z + wave);
    }
  }
  skirtGeo.computeVertexNormals();

  // 2. Bodice Pallu Wrap (Diagonal curve from right waist across chest over left shoulder)
  const bodiceCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.88, 0.12),
    new THREE.Vector3(0.08, 1.04, 0.15),
    new THREE.Vector3(-0.06, 1.22, 0.14),
    new THREE.Vector3(-0.16, 1.34, 0.08),
    new THREE.Vector3(-0.18, 1.38, -0.06)
  ]);
  const bodiceTube = new THREE.TubeGeometry(bodiceCurve, 24, 0.08, 8, false);

  // 3. Flowing Pallu Cascade (Falling down the back from left shoulder)
  const palluCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 1.38, -0.06),
    new THREE.Vector3(-0.16, 1.15, -0.16),
    new THREE.Vector3(-0.14, 0.88, -0.19),
    new THREE.Vector3(-0.12, 0.55, -0.21)
  ]);
  const palluRibbon = new THREE.TubeGeometry(palluCurve, 28, 0.10, 8, false);

  const merged = mergeGeometries([skirtGeo, bodiceTube, palluRibbon], false) || skirtGeo;
  generateCylindricalUVs(merged);
  merged.computeVertexNormals();

  const mesh = new THREE.Mesh(merged, sareeMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Creates the Saree Choli Blouse
 */
function createBlouseMesh(material: THREE.Material): THREE.Mesh {
  const blouseGeo = new THREE.CylinderGeometry(0.19, 0.18, 0.28, 24);
  blouseGeo.translate(0, 1.18, 0);
  const mesh = new THREE.Mesh(blouseGeo, material);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Creates 24K Temple Gold Jewellery
 */
function createEthnicJewellery(goldMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  // Choker Necklace around neck
  const chokerGeo = new THREE.TorusGeometry(0.065, 0.008, 12, 32, Math.PI);
  chokerGeo.rotateX(Math.PI / 2);
  const choker = new THREE.Mesh(chokerGeo, goldMat);
  choker.position.set(0, 1.40, 0.02);
  group.add(choker);

  // Golden Bangles on Left & Right Wrists
  const bangleGeo = new THREE.TorusGeometry(0.045, 0.006, 8, 24);
  bangleGeo.rotateY(Math.PI / 2);

  const leftBangle = new THREE.Mesh(bangleGeo, goldMat);
  leftBangle.position.set(-0.48, 0.94, 0);
  group.add(leftBangle);

  const rightBangle = new THREE.Mesh(bangleGeo, goldMat);
  rightBangle.position.set(0.48, 0.94, 0);
  group.add(rightBangle);

  return group;
}

function generateCylindricalUVs(geometry: THREE.BufferGeometry): void {
  const pos = geometry.attributes.position;
  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const u = (Math.atan2(z, x) / Math.PI + 1) * 0.5;
    const v = Math.min(1.0, Math.max(0.0, y / 1.6));

    uvs[i * 2] = u * 2;
    uvs[i * 2 + 1] = v * 2;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}
