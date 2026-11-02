import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { MorphScales } from '../types';
import { MaterialManager } from '../engine/MaterialManager';
import { MannequinMeshGenerator, type MannequinRig } from '../engine/MannequinMeshGenerator';

export interface SareeCanvasHandle {
  captureScreenshot: () => string;
  resetCamera: () => void;
  triggerAutoSpin: () => void;
}

interface SareeCanvasProps {
  materialManager: MaterialManager;
  currentPresetId: string;
  scales: MorphScales;
  isIdle?: boolean;
}

export const SareeCanvas = forwardRef<SareeCanvasHandle, SareeCanvasProps>(
  ({ materialManager, currentPresetId, scales, isIdle = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const rigRef = useRef<MannequinRig | null>(null);
    const glbModelRef = useRef<THREE.Object3D | null>(null);
    const animFrameId = useRef<number | null>(null);

    // Expose imperative API for taking screenshots and camera control
    useImperativeHandle(ref, () => ({
      captureScreenshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
          return '';
        }
        // Force render full quality frame
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png', 1.0);
      },
      resetCamera: () => {
        if (controlsRef.current && cameraRef.current) {
          cameraRef.current.position.set(0, 1.25, 3.4);
          controlsRef.current.target.set(0, 1.05, 0);
          controlsRef.current.update();
        }
      },
      triggerAutoSpin: () => {
        if (controlsRef.current) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 2.0;
          setTimeout(() => {
            if (controlsRef.current && !isIdle) {
              controlsRef.current.autoRotate = false;
            }
          }, 3500);
        }
      }
    }));

    // 1. Initialize Scene, Camera, 3-Point Lighting, Controls
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth || 1080;
      const height = container.clientHeight || 1920;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x06060A);

      // Camera: Portrait FOV 35° (eliminates wide-angle distortion)
      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
      camera.position.set(0, 1.22, 3.4);
      cameraRef.current = camera;

      // Renderer with high-DPI & PBR color space
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // OrbitControls: clamped pitch and horizontal yaw
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 1.8;
      controls.maxDistance = 4.8;
      controls.minPolarAngle = Math.PI / 4;       // 45 degrees
      controls.maxPolarAngle = Math.PI / 2 + 0.04; // Clamped at floor level
      controls.target.set(0, 1.05, 0);
      controls.update();
      controlsRef.current = controls;

      // 2. Three-Point Studio Lighting Rig
      // Ambient warm fill
      const ambientLight = new THREE.AmbientLight(0x221814, 1.2);
      scene.add(ambientLight);

      // Key Light: Warm white spotlight (high angle right)
      const keyLight = new THREE.DirectionalLight(0xFFF3E5, 3.0);
      keyLight.position.set(2.4, 3.8, 3.2);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      scene.add(keyLight);

      // Fill Light: Soft cool light (low angle left)
      const fillLight = new THREE.DirectionalLight(0xD6E4FF, 1.6);
      fillLight.position.set(-2.8, 2.2, 2.0);
      scene.add(fillLight);

      // Rim / Kicker Light: Rich gold accent (high rear) to highlight saree sheen & zari border
      const rimLight = new THREE.DirectionalLight(0xFFD37F, 3.8);
      rimLight.position.set(0, 3.4, -3.2);
      scene.add(rimLight);

      // Subtle ground floor grid / shadow catcher
      const groundGeo = new THREE.PlaneGeometry(10, 10);
      const groundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      scene.add(ground);

      // Soft decorative floor spotlight
      const floorGlowGeo = new THREE.RingGeometry(0.5, 1.4, 32);
      const floorGlowMat = new THREE.MeshBasicMaterial({
        color: 0x2A1C0A,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const floorGlow = new THREE.Mesh(floorGlowGeo, floorGlowMat);
      floorGlow.rotation.x = -Math.PI / 2;
      floorGlow.position.y = 0.005;
      scene.add(floorGlow);

      // 3. Load Model (GLTF or Parametric Fallback Rig)
      const sareeMaterial = materialManager.getMaterial();
      const loader = new GLTFLoader();

      loader.load(
        '/models/mannequin_saree.glb',
        (gltf) => {
          const model = gltf.scene;
          model.position.y = 0;
          glbModelRef.current = model;
          scene.add(model);
        },
        undefined,
        () => {
          // GLB not found, use procedural parametric rig with full morph targets
          const rig = MannequinMeshGenerator.createRig(sareeMaterial);
          rigRef.current = rig;
          scene.add(rig.group);
          rig.updateMorphs(scales.shoulderScale, scales.waistHipScale, scales.heightScale);
        }
      );

      // 4. Animation render loop
      const animate = () => {
        animFrameId.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // 5. Responsive Resize Handler
      const handleResize = () => {
        if (!containerRef.current || !renderer || !camera) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animFrameId.current !== null) {
          cancelAnimationFrame(animFrameId.current);
        }
        controls.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }, []);

    // Update Morph Influences when scales change
    useEffect(() => {
      if (rigRef.current) {
        rigRef.current.updateMorphs(scales.shoulderScale, scales.waistHipScale, scales.heightScale);
      }

      if (glbModelRef.current) {
        // Wire to GLTF morph targets if present
        glbModelRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
            const mesh = child as THREE.Mesh;
            const dict = mesh.morphTargetDictionary;
            if (dict) {
              if (dict['Shoulder_Width'] !== undefined) {
                mesh.morphTargetInfluences![dict['Shoulder_Width']] = (scales.shoulderScale - 1.0) / 0.25;
              }
              if (dict['Waist_Size'] !== undefined) {
                mesh.morphTargetInfluences![dict['Waist_Size']] = (scales.waistHipScale - 1.0) / 0.25;
              }
              if (dict['Hip_Size'] !== undefined) {
                mesh.morphTargetInfluences![dict['Hip_Size']] = (scales.waistHipScale - 1.0) / 0.25;
              }
            }
          }
        });
      }
    }, [scales]);

    // Handle Idle Mode (slow elegant rotation)
    useEffect(() => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isIdle;
        controlsRef.current.autoRotateSpeed = 1.0;
      }
    }, [isIdle]);

    // Material Swap notification update
    useEffect(() => {
      if (rigRef.current) {
        rigRef.current.sareeMesh.material = materialManager.getMaterial();
      }
    }, [currentPresetId, materialManager]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing select-none touch-none"
      />
    );
  }
);

SareeCanvas.displayName = 'SareeCanvas';
