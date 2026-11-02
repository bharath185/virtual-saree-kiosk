import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { AvatarPoseId } from '../types';
import { FaceProjectionEngine } from './FaceProjectionEngine';

export interface MannequinRig {
  group: THREE.Group;
  mannequinMesh: THREE.Mesh;
  sareeMesh: THREE.Mesh;
  blouseMesh: THREE.Mesh;
  headMesh: THREE.Mesh;
  updateMorphs: (shoulderScale: number, waistHipScale: number, heightScale: number) => void;
  updateFaceTexture: (texture: THREE.CanvasTexture) => void;
  setPose: (poseId: AvatarPoseId) => void;
  updatePoseAnimation: (delta: number) => void;
}

export class MannequinMeshGenerator {
  /**
   * Generates a realistic haute-couture parametric mannequin with customer face projection,
   * draped saree mesh, traditional ethnic jewellery, and multi-pose articulation.
   */
  public static createRig(sareeMaterial: THREE.Material): MannequinRig {
    const group = new THREE.Group();
    group.name = 'MannequinSareeRig';

    // 1. Materials
    // Body skin material (warm Indian complexion)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xE4B28E,
      roughness: 0.38,
      metalness: 0.05
    });

    // Face projection material
    const faceTexture = FaceProjectionEngine.getTexture();
    const faceMaterial = new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.35,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    // Hair material (sleek obsidian dark brown)
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x181210,
      roughness: 0.45,
      metalness: 0.1
    });

    // 24k Gold Temple Jewellery Material
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.22,
      metalness: 0.88
    });

    // Blouse Material (Royal embroidered choli)
    const blouseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0C1F4D,
      roughness: 0.3,
      metalness: 0.4
    });

    // 2. Anatomical Mannequin Body
    const bodyGeometry = this.createAnatomicalBodyGeometry();
    const mannequinMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    mannequinMesh.castShadow = true;
    mannequinMesh.receiveShadow = true;
    group.add(mannequinMesh);

    // 3. Realistic Head with Face Projection
    const headGeometry = this.createRealisticHeadGeometry();
    const headMesh = new THREE.Mesh(headGeometry, faceMaterial);
    headMesh.position.set(0, 1.62, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    // Hair Chignon / Bun at back of head
    const bunGeo = new THREE.SphereGeometry(0.065, 24, 24);
    bunGeo.scale(1.1, 0.95, 0.85);
    const bunMesh = new THREE.Mesh(bunGeo, hairMaterial);
    bunMesh.position.set(0, 1.61, -0.075);
    group.add(bunMesh);

    // 4. Traditional Ethnic Jewellery
    // Golden Maang Tikka
    const tikkaGeo = new THREE.SphereGeometry(0.008, 12, 12);
    const tikkaMesh = new THREE.Mesh(tikkaGeo, goldMaterial);
    tikkaMesh.position.set(0, 1.66, 0.08);
    group.add(tikkaMesh);

    // Golden Jhumka Drop Earrings (Left & Right)
    const jhumkaLeft = this.createJhumka(goldMaterial);
    jhumkaLeft.position.set(-0.082, 1.58, 0);
    group.add(jhumkaLeft);

    const jhumkaRight = this.createJhumka(goldMaterial);
    jhumkaRight.position.set(0.082, 1.58, 0);
    group.add(jhumkaRight);

    // Golden Choker Necklace
    const chokerGeo = new THREE.TorusGeometry(0.065, 0.008, 12, 32, Math.PI);
    chokerGeo.rotateX(Math.PI / 2);
    const chokerMesh = new THREE.Mesh(chokerGeo, goldMaterial);
    chokerMesh.position.set(0, 1.485, 0.02);
    group.add(chokerMesh);

    // 5. Articulated Left & Right Arms
    const leftArmGroup = this.createArm(bodyMaterial, goldMaterial, true);
    leftArmGroup.position.set(-0.21, 1.38, 0);
    group.add(leftArmGroup);

    const rightArmGroup = this.createArm(bodyMaterial, goldMaterial, false);
    rightArmGroup.position.set(0.21, 1.38, 0);
    group.add(rightArmGroup);

    // 6. Blouse (Choli)
    const blouseGeometry = this.createBlouseGeometry();
    const blouseMesh = new THREE.Mesh(blouseGeometry, blouseMaterial);
    blouseMesh.castShadow = true;
    group.add(blouseMesh);

    // 7. Draped Saree Mesh (Pleats + Skirt + Flowing Pallu)
    const sareeGeometry = this.createDrapedSareeGeometry();
    const sareeMesh = new THREE.Mesh(sareeGeometry, sareeMaterial);
    sareeMesh.castShadow = true;
    sareeMesh.receiveShadow = true;
    group.add(sareeMesh);

    // 8. Studio Pedestal Stand
    const standGroup = this.createStudioPedestal(goldMaterial);
    group.add(standGroup);

    // 9. Morph Target Dictionaries
    const morphDict = {
      Shoulder_Width: 0,
      Waist_Size: 1,
      Hip_Size: 2
    };

    [mannequinMesh, sareeMesh, blouseMesh].forEach((mesh) => {
      mesh.morphTargetDictionary = { ...morphDict };
      mesh.morphTargetInfluences = [0, 0, 0];
    });

    // 10. Pose State Management
    let targetRigRotationY = 0;
    let targetLeftArmRotZ = 0.15;
    let targetLeftArmRotX = 0;
    let targetRightArmRotZ = -0.15;
    let targetRightArmRotX = 0;

    const setPose = (poseId: AvatarPoseId) => {
      switch (poseId) {
        case 'front':
          targetRigRotationY = 0;
          targetLeftArmRotZ = 0.12;
          targetLeftArmRotX = 0.05;
          targetRightArmRotZ = -0.12;
          targetRightArmRotX = 0.05;
          break;
        case 'side-turn':
          targetRigRotationY = -0.45;
          targetLeftArmRotZ = 0.28;
          targetLeftArmRotX = 0.35; // Hand gently touching pallu fold
          targetRightArmRotZ = -0.12;
          targetRightArmRotX = -0.1;
          break;
        case 'namaste':
          targetRigRotationY = 0.05;
          targetLeftArmRotZ = 0.55;
          targetLeftArmRotX = 0.75;
          targetRightArmRotZ = -0.55;
          targetRightArmRotX = 0.75;
          break;
        case 'runway':
          targetRigRotationY = 0.38;
          targetLeftArmRotZ = 0.18;
          targetLeftArmRotX = -0.25;
          targetRightArmRotZ = -0.22;
          targetRightArmRotX = 0.3;
          break;
        case 'pallu-back':
          targetRigRotationY = 2.85; // Showcase back & pallu
          targetLeftArmRotZ = 0.25;
          targetLeftArmRotX = 0.1;
          targetRightArmRotZ = -0.15;
          targetRightArmRotX = 0.1;
          break;
        default:
          targetRigRotationY = 0;
      }
    };

    const updatePoseAnimation = (delta: number) => {
      const lerpSpeed = Math.min(1.0, delta * 6.0);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRigRotationY, lerpSpeed);
      leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, targetLeftArmRotZ, lerpSpeed);
      leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, targetLeftArmRotX, lerpSpeed);
      rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, targetRightArmRotZ, lerpSpeed);
      rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, targetRightArmRotX, lerpSpeed);
    };

    const updateMorphs = (shoulderScale: number, waistHipScale: number, heightScale: number) => {
      const shoulderInfluence = (shoulderScale - 1.0) / 0.25;
      const waistHipInfluence = (waistHipScale - 1.0) / 0.25;

      [mannequinMesh, sareeMesh, blouseMesh].forEach((mesh) => {
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[0] = THREE.MathUtils.clamp(shoulderInfluence, -1, 1);
          mesh.morphTargetInfluences[1] = THREE.MathUtils.clamp(waistHipInfluence * 0.8, -1, 1);
          mesh.morphTargetInfluences[2] = THREE.MathUtils.clamp(waistHipInfluence * 1.1, -1, 1);
        }
      });

      // Update arm positions according to shoulder scale
      leftArmGroup.position.x = -0.21 * shoulderScale;
      rightArmGroup.position.x = 0.21 * shoulderScale;

      group.scale.y = heightScale;
    };

    const updateFaceTexture = (texture: THREE.CanvasTexture) => {
      faceMaterial.map = texture;
      faceMaterial.needsUpdate = true;
    };

    return {
      group,
      mannequinMesh,
      sareeMesh,
      blouseMesh,
      headMesh,
      updateMorphs,
      updateFaceTexture,
      setPose,
      updatePoseAnimation
    };
  }

  /**
   * Creates an anatomical feminine head geometry with facial UV mapping
   */
  private static createRealisticHeadGeometry(): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(0.088, 32, 32);
    geo.scale(0.88, 1.12, 0.98); // Slender feminine oval shape

    // Frontal planar UV unwrap so the face texture projects cleanly onto front of head
    const pos = geo.attributes.position;
    const uvs = new Float32Array(pos.count * 2);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (z > -0.02) {
        // Front face: map planar
        const u = 0.5 + (x / 0.16);
        const v = 0.5 + (y / 0.18);
        uvs[i * 2] = THREE.MathUtils.clamp(u, 0, 1);
        uvs[i * 2 + 1] = THREE.MathUtils.clamp(v, 0, 1);
      } else {
        // Back of head (hair area)
        uvs[i * 2] = 0.05;
        uvs[i * 2 + 1] = 0.05;
      }
    }

    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Articulated Arm with Golden Bangles
   */
  private static createArm(skinMat: THREE.Material, goldMat: THREE.Material, isLeft: boolean): THREE.Group {
    const arm = new THREE.Group();

    // Upper Arm
    const upperArmGeo = new THREE.CylinderGeometry(0.042, 0.036, 0.28, 16);
    upperArmGeo.translate(0, -0.14, 0);
    const upperArm = new THREE.Mesh(upperArmGeo, skinMat);
    upperArm.castShadow = true;
    arm.add(upperArm);

    // Forearm & Hand
    const forearmGeo = new THREE.CylinderGeometry(0.035, 0.025, 0.28, 16);
    forearmGeo.translate(0, -0.40, 0.015);
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.castShadow = true;
    arm.add(forearm);

    // Golden Traditional Bangles (Chooriyan) on wrist
    for (let b = 0; b < 3; b++) {
      const bangleGeo = new THREE.TorusGeometry(0.033, 0.0035, 8, 24);
      bangleGeo.rotateX(Math.PI / 2);
      const bangle = new THREE.Mesh(bangleGeo, goldMat);
      bangle.position.set(0, -0.48 - b * 0.012, 0.015);
      arm.add(bangle);
    }

    // Default arm angle
    arm.rotation.z = isLeft ? 0.12 : -0.12;
    return arm;
  }

  /**
   * Traditional Golden Jhumka Drop Earring
   */
  private static createJhumka(goldMat: THREE.Material): THREE.Group {
    const jhumka = new THREE.Group();

    // Stud button
    const studGeo = new THREE.SphereGeometry(0.006, 12, 12);
    const stud = new THREE.Mesh(studGeo, goldMat);
    jhumka.add(stud);

    // Bell dome
    const bellGeo = new THREE.ConeGeometry(0.009, 0.012, 16, 1, true);
    const bell = new THREE.Mesh(bellGeo, goldMat);
    bell.rotation.x = Math.PI;
    bell.position.y = -0.012;
    jhumka.add(bell);

    // Tiny hanging bead
    const beadGeo = new THREE.SphereGeometry(0.003, 8, 8);
    const bead = new THREE.Mesh(beadGeo, goldMat);
    bead.position.y = -0.02;
    jhumka.add(bead);

    return jhumka;
  }

  /**
   * Anatomical Female Body Geometry (Sculpted Neck, Bust, Midriff, Hips, Legs)
   */
  private static createAnatomicalBodyGeometry(): THREE.BufferGeometry {
    const radialSegments = 36;
    const heightSegments = 50;
    const height = 1.75;
    const geometry = new THREE.CylinderGeometry(0.12, 0.14, height, radialSegments, heightSegments, true);
    geometry.translate(0, height / 2 + 0.1, 0);

    const pos = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const y = vertex.y;
      const angle = Math.atan2(vertex.z, vertex.x);
      let r = 0.14;

      if (y > 1.62) {
        // Head area handled by separate headMesh
        r = 0.04;
      } else if (y > 1.48) {
        // Slender Neck
        r = 0.052;
      } else if (y > 1.35) {
        // Collarbone and Shoulders
        const t = (1.48 - y) / 0.13;
        r = 0.052 + t * 0.14;
        vertex.x *= 1.32;
      } else if (y > 1.15) {
        // Bust contour
        const bustT = (y - 1.15) / 0.20;
        r = 0.145 + Math.sin(bustT * Math.PI) * 0.038;
        if (vertex.z > 0) vertex.z *= 1.25;
      } else if (y > 0.95) {
        // Sculpted Midriff & Waist
        const waistT = (y - 0.95) / 0.20;
        r = 0.11 + Math.sin(waistT * Math.PI) * 0.02;
        vertex.x *= 1.12;
      } else if (y > 0.70) {
        // Feminine Hips
        const hipT = (y - 0.70) / 0.25;
        r = 0.16 + Math.sin(hipT * Math.PI) * 0.04;
        vertex.x *= 1.35;
      } else {
        // Graceful Legs
        const legT = y / 0.70;
        r = 0.07 + legT * 0.08;
        vertex.x *= 1.15;
      }

      vertex.x = Math.cos(angle) * r;
      vertex.z = Math.sin(angle) * r;
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    this.attachMorphTargets(geometry);
    return geometry;
  }

  /**
   * Saree Blouse (Choli) Geometry
   */
  private static createBlouseGeometry(): THREE.BufferGeometry {
    const radialSegments = 36;
    const heightSegments = 20;
    const height = 0.38;
    const geometry = new THREE.CylinderGeometry(0.16, 0.14, height, radialSegments, heightSegments, false);
    geometry.translate(0, 1.28, 0);

    const pos = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const angle = Math.atan2(vertex.z, vertex.x);
      const y = vertex.y;

      let r = 0.16;
      if (y > 1.35) {
        r = 0.18;
        vertex.x *= 1.32;
      } else if (y > 1.18) {
        r = 0.17;
        if (vertex.z > 0) vertex.z *= 1.28;
      } else {
        r = 0.135;
      }

      vertex.x = Math.cos(angle) * r;
      vertex.z = Math.sin(angle) * r;
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    this.attachMorphTargets(geometry);
    return geometry;
  }

  /**
   * Draped Traditional Saree Geometry
   * 1. Cylindrical flared skirt from waist to ankles with undulating front pleats (niripulu).
   * 2. Diagonal Pallu sweeping from right hip, across the bust to the left shoulder and flowing down the back.
   */
  private static createDrapedSareeGeometry(): THREE.BufferGeometry {
    const radialSegments = 48;
    const heightSegments = 35;
    const skirtHeight = 0.92;
    const skirtGeo = new THREE.CylinderGeometry(0.165, 0.29, skirtHeight, radialSegments, heightSegments, false);
    skirtGeo.translate(0, skirtHeight / 2 + 0.08, 0);

    const skirtPos = skirtGeo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < skirtPos.count; i++) {
      v.fromBufferAttribute(skirtPos, i);
      const angle = Math.atan2(v.z, v.x);
      const y = v.y;

      let r = 0.165 + (1.0 - y) * 0.125;

      // Front pleats ripple effect (z > 0 and |x| < 0.12)
      if (v.z > 0.04 && Math.abs(v.x) < 0.13) {
        const pleatRipple = Math.sin(v.x * 65) * 0.022;
        v.z += pleatRipple + 0.018;
      }

      v.x = Math.cos(angle) * r * 1.18;
      v.z = Math.sin(angle) * r;
      skirtPos.setXYZ(i, v.x, v.y, v.z);
    }

    // Pallu Ribbon curve across torso to left shoulder and trailing down back
    const palluCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.16, 0.95, 0.08),    // Right hip tuck
      new THREE.Vector3(0.08, 1.15, 0.17),    // Diagonal midriff
      new THREE.Vector3(-0.06, 1.30, 0.16),   // Left bust drape
      new THREE.Vector3(-0.20, 1.42, 0.03),   // Left shoulder peak
      new THREE.Vector3(-0.22, 1.28, -0.13),  // Behind back cascade
      new THREE.Vector3(-0.24, 0.75, -0.18)   // Flowing pallu hem
    ]);

    const palluRibbon = new THREE.TubeGeometry(palluCurve, 36, 0.09, 8, false);

    const merged = mergeGeometries([skirtGeo, palluRibbon], false) || skirtGeo.clone();
    this.generateCylindricalUVs(merged);
    merged.computeVertexNormals();
    this.attachMorphTargets(merged);
    return merged;
  }

  private static generateCylindricalUVs(geometry: THREE.BufferGeometry): void {
    const pos = geometry.attributes.position;
    const uvs = new Float32Array(pos.count * 2);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const u = (Math.atan2(z, x) / Math.PI + 1) * 0.5;
      const v = Math.min(1.0, Math.max(0.0, y / 1.8));

      uvs[i * 2] = u * 2;
      uvs[i * 2 + 1] = v * 2;
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }

  private static attachMorphTargets(geometry: THREE.BufferGeometry): void {
    const pos = geometry.attributes.position;
    const count = pos.count;

    const shoulderMorph = new Float32Array(count * 3);
    const waistMorph = new Float32Array(count * 3);
    const hipMorph = new Float32Array(count * 3);

    const v = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      v.fromBufferAttribute(pos, i);
      const y = v.y;

      if (y > 1.25 && y < 1.55) {
        const factor = Math.sin(((y - 1.25) / 0.30) * Math.PI);
        shoulderMorph[i * 3] = v.x * factor * 0.45;
        shoulderMorph[i * 3 + 1] = 0;
        shoulderMorph[i * 3 + 2] = v.z * factor * 0.15;
      }

      if (y > 0.88 && y < 1.18) {
        const factor = Math.sin(((y - 0.88) / 0.30) * Math.PI);
        waistMorph[i * 3] = v.x * factor * 0.40;
        waistMorph[i * 3 + 1] = 0;
        waistMorph[i * 3 + 2] = v.z * factor * 0.40;
      }

      if (y > 0.55 && y < 0.95) {
        const factor = Math.sin(((y - 0.55) / 0.40) * Math.PI);
        hipMorph[i * 3] = v.x * factor * 0.45;
        hipMorph[i * 3 + 1] = 0;
        hipMorph[i * 3 + 2] = v.z * factor * 0.35;
      }
    }

    geometry.morphAttributes.position = [
      new THREE.BufferAttribute(shoulderMorph, 3),
      new THREE.BufferAttribute(waistMorph, 3),
      new THREE.BufferAttribute(hipMorph, 3)
    ];
  }

  private static createStudioPedestal(goldMaterial: THREE.Material): THREE.Group {
    const stand = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(0.55, 0.60, 0.08, 48);
    const podiumMaterial = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.25,
      metalness: 0.6
    });
    const baseMesh = new THREE.Mesh(baseGeo, podiumMaterial);
    baseMesh.position.y = 0.04;
    baseMesh.receiveShadow = true;
    stand.add(baseMesh);

    const rimGeo = new THREE.TorusGeometry(0.57, 0.015, 16, 64);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, goldMaterial);
    rimMesh.position.y = 0.08;
    stand.add(rimMesh);

    return stand;
  }
}
