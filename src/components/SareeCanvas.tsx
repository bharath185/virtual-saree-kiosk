import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { AvatarPoseId, LandmarkPoint, MorphScales } from '../types';
import { MaterialManager } from '../engine/MaterialManager';
import { MannequinMeshGenerator, type MannequinRig } from '../engine/MannequinMeshGenerator';
import { FaceProjectionEngine } from '../engine/FaceProjectionEngine';
import { PoseAnimationEngine } from '../engine/PoseAnimationEngine';

export interface SareeCanvasHandle {
  captureScreenshot: () => string;
  resetCamera: () => void;
  triggerAutoSpin: () => void;
  projectFace: (video: HTMLVideoElement, landmarks: LandmarkPoint[]) => void;
  projectFaceFromImage: (img: HTMLImageElement | HTMLCanvasElement) => void;
  setPose: (poseId: AvatarPoseId) => void;
}

interface SareeCanvasProps {
  materialManager: MaterialManager;
  currentPresetId: string;
  scales: MorphScales;
  poseId: AvatarPoseId;
  isIdle?: boolean;
  customPersonImage?: string | null;
}

export const SareeCanvas = forwardRef<SareeCanvasHandle, SareeCanvasProps>(
  ({ materialManager, currentPresetId, scales, poseId, isIdle = false, customPersonImage = null }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const rigRef = useRef<MannequinRig | null>(null);
    const glbModelRef = useRef<THREE.Object3D | null>(null);
    const animFrameId = useRef<number | null>(null);
    const clockRef = useRef<THREE.Clock>(new THREE.Clock());

    // Target camera position for pose transition
    const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.22, 3.4));

    // Expose imperative API for taking screenshots, camera control, and face projection
    useImperativeHandle(ref, () => ({
      captureScreenshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) {
          return '';
        }
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png', 1.0);
      },
      resetCamera: () => {
        if (controlsRef.current && cameraRef.current) {
          targetCamPos.current.set(0, 1.22, 3.4);
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
      },
      projectFace: (video: HTMLVideoElement, landmarks: LandmarkPoint[]) => {
        const tex = FaceProjectionEngine.projectCustomerFace(video, landmarks);
        if (rigRef.current) {
          rigRef.current.updateFaceTexture(tex);
        }
      },
      projectFaceFromImage: (img: HTMLImageElement | HTMLCanvasElement) => {
        const tex = FaceProjectionEngine.projectFaceFromImage(img);
        if (rigRef.current) {
          rigRef.current.updateFaceTexture(tex);
        }
      },
      setPose: (newPoseId: AvatarPoseId) => {
        if (rigRef.current) {
          rigRef.current.setPose(newPoseId);
          const pose = PoseAnimationEngine.getPose(newPoseId);
          targetCamPos.current.set(pose.cameraPosition.x, pose.cameraPosition.y, pose.cameraPosition.z);
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

      // Camera: Portrait FOV 35°
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
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 2 + 0.04;
      controls.target.set(0, 1.05, 0);
      controls.update();
      controlsRef.current = controls;

      // 2. Three-Point Studio Lighting Rig
      const ambientLight = new THREE.AmbientLight(0x221814, 1.2);
      scene.add(ambientLight);

      // Warm white Key Light
      const keyLight = new THREE.DirectionalLight(0xFFF3E5, 3.0);
      keyLight.position.set(2.4, 3.8, 3.2);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      scene.add(keyLight);

      // Soft cool Fill Light
      const fillLight = new THREE.DirectionalLight(0xD6E4FF, 1.6);
      fillLight.position.set(-2.8, 2.2, 2.0);
      scene.add(fillLight);

      // Rich gold Rim Light for metallic zari pop
      const rimLight = new THREE.DirectionalLight(0xFFD37F, 3.8);
      rimLight.position.set(0, 3.4, -3.2);
      scene.add(rimLight);

      // Ground floor shadow catcher
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
          const rig = MannequinMeshGenerator.createRig(sareeMaterial);
          rigRef.current = rig;
          scene.add(rig.group);
          rig.updateMorphs(scales.shoulderScale, scales.waistHipScale, scales.heightScale);
          rig.setPose(poseId);

          if (customPersonImage) {
            const img = new Image();
            img.src = customPersonImage;
            img.onload = () => {
              const tex = FaceProjectionEngine.projectFaceFromImage(img);
              rig.updateFaceTexture(tex);
            };
          }
        }
      );

      // 4. Animation render loop
      const animate = () => {
        animFrameId.current = requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();

        // Smooth camera transition towards pose target
        if (camera && targetCamPos.current) {
          camera.position.lerp(targetCamPos.current, Math.min(1.0, delta * 3.5));
        }

        if (rigRef.current) {
          rigRef.current.updatePoseAnimation(delta);
        }

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

    // Update Pose when poseId changes
    useEffect(() => {
      if (rigRef.current) {
        rigRef.current.setPose(poseId);
        const pose = PoseAnimationEngine.getPose(poseId);
        targetCamPos.current.set(pose.cameraPosition.x, pose.cameraPosition.y, pose.cameraPosition.z);
      }
    }, [poseId]);

    // Handle Idle Mode
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

    // Project face texture whenever customPersonImage changes
    useEffect(() => {
      if (!customPersonImage || !rigRef.current) return;
      const img = new Image();
      img.src = customPersonImage;
      img.onload = () => {
        const tex = FaceProjectionEngine.projectFaceFromImage(img);
        rigRef.current?.updateFaceTexture(tex);
      };
    }, [customPersonImage]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing select-none touch-none"
      />
    );
  }
);

SareeCanvas.displayName = 'SareeCanvas';
