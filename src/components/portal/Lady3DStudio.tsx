import { useEffect, useRef, useState, type FC } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RotateCw, RefreshCcw, Sparkles, Check } from 'lucide-react';
import type { SareeGarment } from '../../types/portal';
import { MaterialManager } from '../../engine/MaterialManager';
import { FaceProjectionEngine } from '../../engine/FaceProjectionEngine';

interface Lady3DStudioProps {
  selectedSaree: SareeGarment;
  userPhoto?: string;
  isCustomPhoto?: boolean;
  scales?: {
    shoulderScale: number;
    waistHipScale: number;
    heightScale: number;
  };
}

export const Lady3DStudio: FC<Lady3DStudioProps> = ({
  selectedSaree,
  userPhoto,
  isCustomPhoto = false,
  scales = { shoulderScale: 1.0, waistHipScale: 1.0, heightScale: 1.0 }
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const ladyModelRef = useRef<THREE.Object3D | null>(null);
  const sareeMeshRef = useRef<THREE.Mesh | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const materialManagerRef = useRef<MaterialManager>(new MaterialManager());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);
  const [activeCamAngle, setActiveCamAngle] = useState<'front' | 'back' | 'side'>('front');

  // 1. Initialize Three.js Scene, Camera, Lighting, Controls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 900;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0a0f);

    // Camera (Focal length suited for fashion portrait)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.05, 3.2);
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
    controls.minDistance = 1.5;
    controls.maxDistance = 4.5;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(0, 0.95, 0);
    controls.update();
    controlsRef.current = controls;

    // Three-Point Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.1);
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
    const rimLight = new THREE.DirectionalLight(0xffdf88, 3.2);
    rimLight.position.set(0, 3.0, -2.8);
    scene.add(rimLight);

    // Floor Shadow Receiver & Pedestal
    const groundGeo = new THREE.PlaneGeometry(8, 8);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const pedestalGeo = new THREE.CylinderGeometry(0.52, 0.56, 0.05, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x141418,
      roughness: 0.25,
      metalness: 0.7
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 0.025;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Load 3D Saree Material
    materialManagerRef.current.applyPreset(selectedSaree.id);
    const sareeMaterial = materialManagerRef.current.getMaterial();

    // 2. Load the Lady OBJ Model from web/public directory
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/models/');
    mtlLoader.load(
      'female02.mtl',
      (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('/models/');
        objLoader.load(
          'female02.obj',
          (object) => {
            // female02 is in centimeters (height ~168cm). Scale to meters (x0.01)
            const sx = 0.01 * (scales.shoulderScale || 1.0);
            const sy = 0.01 * (scales.heightScale || 1.0);
            const sz = 0.01 * (scales.waistHipScale || 1.0);
            object.scale.set(sx, sy, sz);
            object.position.set(0, 0, 0);

            // Traverse meshes and adjust materials
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                // Identify head/face mesh for texture projection
                if (mesh.name.toLowerCase().includes('head') || mesh.name.toLowerCase().includes('face')) {
                  headMeshRef.current = mesh;
                }
              }
            });

            scene.add(object);
            ladyModelRef.current = object;

            // 3. Drape 3D Saree Mesh over the Lady Model
            const sareeMesh = createDrapedSareeMesh(sareeMaterial);
            sareeMesh.scale.set(sx, sy, sz);
            scene.add(sareeMesh);
            sareeMeshRef.current = sareeMesh;

            // Project face if user photo is available
            if (userPhoto) {
              projectCustomerFace(userPhoto);
            }

            setIsLoading(false);
          },
          undefined,
          (err) => {
            console.warn('Error loading female02.obj, building procedural mannequin:', err);
            // Fallback parametric mannequin
            const fallbackGroup = createProceduralLadyModel(sareeMaterial);
            scene.add(fallbackGroup);
            ladyModelRef.current = fallbackGroup;
            setIsLoading(false);
          }
        );
      },
      undefined,
      (err) => {
        console.warn('Error loading female02.mtl:', err);
        // Fallback procedural mannequin
        const fallbackGroup = createProceduralLadyModel(sareeMaterial);
        scene.add(fallbackGroup);
        ladyModelRef.current = fallbackGroup;
        setIsLoading(false);
      }
    );

    // 4. Animation render loop
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
    if (sareeMeshRef.current) {
      sareeMeshRef.current.material = newMat;
    }
  }, [selectedSaree]);

  // Update Body Dimensions when scales change (Gemini Vision output)
  useEffect(() => {
    const sx = 0.01 * (scales.shoulderScale || 1.0);
    const sy = 0.01 * (scales.heightScale || 1.0);
    const sz = 0.01 * (scales.waistHipScale || 1.0);

    if (ladyModelRef.current) {
      ladyModelRef.current.scale.set(sx, sy, sz);
    }
    if (sareeMeshRef.current) {
      sareeMeshRef.current.scale.set(sx, sy, sz);
    }
  }, [scales]);

  // Project customer face when userPhoto changes
  useEffect(() => {
    if (userPhoto) {
      projectCustomerFace(userPhoto);
    }
  }, [userPhoto]);

  // Handle auto-spin
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoSpinning;
      controlsRef.current.autoRotateSpeed = 1.8;
    }
  }, [isAutoSpinning]);

  const projectCustomerFace = (photoUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const faceTex = FaceProjectionEngine.projectFaceFromImage(img);
      if (headMeshRef.current) {
        (headMeshRef.current.material as THREE.MeshStandardMaterial).map = faceTex;
        (headMeshRef.current.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    };
    img.src = photoUrl;
  };

  const setCameraAngle = (angle: 'front' | 'back' | 'side') => {
    setActiveCamAngle(angle);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    if (angle === 'front') {
      cam.position.set(0, 1.05, 3.2);
    } else if (angle === 'back') {
      cam.position.set(0, 1.05, -3.2);
    } else if (angle === 'side') {
      cam.position.set(2.8, 1.05, 0.4);
    }
    controlsRef.current.target.set(0, 0.95, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 3D Canvas WebGL Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn z-20">
          <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mb-3" />
          <h4 className="text-sm font-serif text-white">Loading 3D Female Lady Model...</h4>
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
            Side
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

      {/* Body Proportions & Gemini 3D Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-10 p-2.5 rounded-2xl bg-neutral-950/85 border border-amber-500/30 backdrop-blur-md shadow-2xl flex flex-col gap-1 text-[10px]">
        <div className="flex items-center gap-1.5 text-amber-300 font-serif font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>3D Female Model</span>
        </div>
        <div className="space-y-0.5 text-neutral-300 font-mono mt-0.5">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Shoulder:</span>
            <span className="text-amber-300">{(scales.shoulderScale * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Waist/Hip:</span>
            <span className="text-amber-300">{(scales.waistHipScale * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400">Height:</span>
            <span className="text-amber-300">{(scales.heightScale * 100).toFixed(0)}%</span>
          </div>
        </div>
        {isCustomPhoto && (
          <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-1 pt-1 border-t border-neutral-800">
            <Check className="w-3 h-3" />
            <span>Face Projected on Model</span>
          </div>
        )}
      </div>

      {/* Interaction Hint (Bottom) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-neutral-950/80 border border-neutral-800 backdrop-blur-md text-[10px] text-neutral-400 flex items-center gap-1.5 shadow-lg pointer-events-none">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>Drag 360° to inspect drape · Pinch or scroll to zoom</span>
      </div>
    </div>
  );
};

/**
 * Creates the high-resolution 3D Saree draped geometry (pleats, waistband, bodice wrap, and pallu)
 */
function createDrapedSareeMesh(material: THREE.Material): THREE.Mesh {
  // 1. Saree Skirt & Knife Pleats (Waist Y=0.88 down to Y=0.08)
  const skirtGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.82, 36, 12, true);
  skirtGeo.translate(0, 0.49, 0);

  // Apply subtle ripple pleats to vertices
  const pos = skirtGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Front knife pleat folding
    if (z > 0 && y < 0.82) {
      const angle = Math.atan2(z, x);
      const wave = Math.sin(angle * 14) * 0.015;
      pos.setZ(i, z + wave);
    }
  }
  skirtGeo.computeVertexNormals();

  // 2. Bodice Pallu Wrap (Diagonal curve from right waist over left shoulder)
  const bodiceCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.18, 0.86, 0.12),
    new THREE.Vector3(0.08, 1.02, 0.16),
    new THREE.Vector3(-0.06, 1.20, 0.15),
    new THREE.Vector3(-0.16, 1.34, 0.08),
    new THREE.Vector3(-0.18, 1.38, -0.06)
  ]);
  const bodiceTube = new THREE.TubeGeometry(bodiceCurve, 24, 0.09, 8, false);

  // 3. Flowing Pallu Cascade (Falling down the back from left shoulder)
  const palluCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 1.38, -0.06),
    new THREE.Vector3(-0.16, 1.15, -0.16),
    new THREE.Vector3(-0.14, 0.88, -0.19),
    new THREE.Vector3(-0.12, 0.55, -0.21)
  ]);
  const palluRibbon = new THREE.TubeGeometry(palluCurve, 28, 0.10, 8, false);

  const merged = mergeGeometries([skirtGeo, bodiceTube, palluRibbon], false) || skirtGeo;
  merged.computeVertexNormals();

  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Procedural Anatomical Female Mannequin Model
 */
function createProceduralLadyModel(sareeMaterial: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xdeb887,
    roughness: 0.38,
    metalness: 0.04
  });

  // Torso
  const torsoGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.52, 24);
  torsoGeo.translate(0, 1.18, 0);
  const torso = new THREE.Mesh(torsoGeo, skinMat);
  torso.castShadow = true;
  group.add(torso);

  // Head
  const headGeo = new THREE.SphereGeometry(0.10, 24, 24);
  headGeo.scale(0.85, 1.15, 0.95);
  headGeo.translate(0, 1.58, 0.02);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  group.add(head);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.12, 16);
  neckGeo.translate(0, 1.48, 0);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  group.add(neck);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.065, 0.05, 0.88, 16);
  const leftLeg = new THREE.Mesh(legGeo, skinMat);
  leftLeg.position.set(-0.09, 0.44, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, skinMat);
  rightLeg.position.set(0.09, 0.44, 0);
  group.add(rightLeg);

  // Drape
  const drape = createDrapedSareeMesh(sareeMaterial);
  group.add(drape);

  return group;
}
