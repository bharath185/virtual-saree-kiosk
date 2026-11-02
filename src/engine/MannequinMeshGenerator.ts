import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface MannequinRig {
  group: THREE.Group;
  mannequinMesh: THREE.Mesh;
  sareeMesh: THREE.Mesh;
  blouseMesh: THREE.Mesh;
  updateMorphs: (shoulderScale: number, waistHipScale: number, heightScale: number) => void;
}

export class MannequinMeshGenerator {
  /**
   * Generates a realistic haute-couture parametric mannequin and draped saree mesh
   * complete with real Three.js Morph Targets (Shape Keys):
   * - Shoulder_Width
   * - Waist_Size
   * - Hip_Size
   */
  public static createRig(sareeMaterial: THREE.Material): MannequinRig {
    const group = new THREE.Group();
    group.name = 'MannequinSareeRig';

    // 1. Mannequin Body Material: Luxury matte porcelain/champagne studio mannequin
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8DFD5,
      roughness: 0.35,
      metalness: 0.1,
      bumpScale: 0.02
    });

    // Gold jewelry & hardware accent material
    const goldAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.2,
      metalness: 0.9
    });

    // Blouse material (deep maroon silk brocade)
    const blouseMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C0612,
      roughness: 0.3,
      metalness: 0.4
    });

    // 2. Generate Mannequin Body Geometry with blendable vertices
    const bodyGeometry = this.createAnatomicalBodyGeometry();
    const mannequinMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    mannequinMesh.castShadow = true;
    mannequinMesh.receiveShadow = true;
    group.add(mannequinMesh);

    // 3. Generate Blouse (Choli) Mesh with matching morph targets
    const blouseGeometry = this.createBlouseGeometry();
    const blouseMesh = new THREE.Mesh(blouseGeometry, blouseMaterial);
    blouseMesh.castShadow = true;
    group.add(blouseMesh);

    // 4. Generate Saree Draped Mesh (Pleats + Skirt + Diagonal Pallu) with matching morph targets
    const sareeGeometry = this.createDrapedSareeGeometry();
    const sareeMesh = new THREE.Mesh(sareeGeometry, sareeMaterial);
    sareeMesh.castShadow = true;
    sareeMesh.receiveShadow = true;
    group.add(sareeMesh);

    // 5. Add Studio Pedestal Stand with golden rim
    const standGroup = this.createStudioPedestal(goldAccentMaterial);
    group.add(standGroup);

    // 6. Setup Morph Target Dictionaries
    const morphDict = {
      Shoulder_Width: 0,
      Waist_Size: 1,
      Hip_Size: 2
    };

    mannequinMesh.morphTargetDictionary = { ...morphDict };
    mannequinMesh.morphTargetInfluences = [0, 0, 0];

    sareeMesh.morphTargetDictionary = { ...morphDict };
    sareeMesh.morphTargetInfluences = [0, 0, 0];

    blouseMesh.morphTargetDictionary = { ...morphDict };
    blouseMesh.morphTargetInfluences = [0, 0, 0];

    // Morph Updater function
    const updateMorphs = (shoulderScale: number, waistHipScale: number, heightScale: number) => {
      // Map scale (e.g. 0.85 - 1.25 where 1.0 is neutral) to morph influence (-1.0 to +1.0)
      const shoulderInfluence = (shoulderScale - 1.0) / 0.25;
      const waistHipInfluence = (waistHipScale - 1.0) / 0.25;

      // Apply to all rig components
      [mannequinMesh, sareeMesh, blouseMesh].forEach((mesh) => {
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[0] = THREE.MathUtils.clamp(shoulderInfluence, -1, 1);
          mesh.morphTargetInfluences[1] = THREE.MathUtils.clamp(waistHipInfluence * 0.8, -1, 1);
          mesh.morphTargetInfluences[2] = THREE.MathUtils.clamp(waistHipInfluence * 1.1, -1, 1);
        }
      });

      // Overall height scaling
      group.scale.y = heightScale;
    };

    return {
      group,
      mannequinMesh,
      sareeMesh,
      blouseMesh,
      updateMorphs
    };
  }

  /**
   * Anatomical Female Mannequin Geometry
   */
  private static createAnatomicalBodyGeometry(): THREE.BufferGeometry {
    // Generate an articulated cylinder-based torso mesh with high vertex density
    const radialSegments = 36;
    const heightSegments = 50;
    const height = 1.75;
    const geometry = new THREE.CylinderGeometry(0.12, 0.14, height, radialSegments, heightSegments, true);
    geometry.translate(0, height / 2 + 0.1, 0); // Position feet on ground

    const pos = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    // Sculpt natural contours for female mannequin (head, neck, shoulders, bust, waist, hips, legs)
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const y = vertex.y;
      const angle = Math.atan2(vertex.z, vertex.x);
      let r = 0.14;

      if (y > 1.62) {
        // Head / Face silhouette
        const headT = (y - 1.62) / 0.18;
        r = 0.09 * Math.sin(headT * Math.PI) + 0.04;
      } else if (y > 1.50) {
        // Slender Neck
        r = 0.055;
      } else if (y > 1.35) {
        // Shoulders / Upper Chest
        const shoulderT = (1.50 - y) / 0.15;
        r = 0.055 + shoulderT * 0.14;
        // Widen horizontally in X
        vertex.x *= 1.35;
      } else if (y > 1.15) {
        // Bust contour
        const bustT = (y - 1.15) / 0.20;
        r = 0.15 + Math.sin(bustT * Math.PI) * 0.04;
        if (vertex.z > 0) vertex.z *= 1.25; // Forward projection
      } else if (y > 0.95) {
        // Tapered Waist
        const waistT = (y - 0.95) / 0.20;
        r = 0.11 + Math.sin(waistT * Math.PI) * 0.02;
        vertex.x *= 1.1;
      } else if (y > 0.70) {
        // Flared Hips
        const hipT = (y - 0.70) / 0.25;
        r = 0.16 + Math.sin(hipT * Math.PI) * 0.04;
        vertex.x *= 1.35;
      } else {
        // Thighs / Legs tapering to ankles
        const legT = y / 0.70;
        r = 0.07 + legT * 0.08;
        vertex.x *= 1.15;
      }

      vertex.x = Math.cos(angle) * r * (vertex.x > 0 ? 1 : 1);
      vertex.z = Math.sin(angle) * r;
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();

    // Attach Morph Target Attributes
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
   * Features:
   * 1. Cylindrical flared skirt from waist (1.0m) to ankles (0.1m) with accordion pleats (niripulu).
   * 2. Diagonal Pallu sweeping from right hip, across the bust to the left shoulder and flowing gracefully down the back.
   */
  private static createDrapedSareeGeometry(): THREE.BufferGeometry {
    // Part A: Skirt & Front Pleats
    const radialSegments = 48;
    const heightSegments = 35;
    const skirtHeight = 0.92;
    const skirtGeo = new THREE.CylinderGeometry(0.16, 0.28, skirtHeight, radialSegments, heightSegments, false);
    skirtGeo.translate(0, skirtHeight / 2 + 0.08, 0);

    const skirtPos = skirtGeo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < skirtPos.count; i++) {
      v.fromBufferAttribute(skirtPos, i);
      const angle = Math.atan2(v.z, v.x);
      const y = v.y;

      // Realistic hips to flare
      let r = 0.16 + (1.0 - y) * 0.12;

      // Front pleats ripple effect (z > 0 and |x| < 0.1)
      if (v.z > 0.05 && Math.abs(v.x) < 0.14) {
        const pleatRipple = Math.sin(v.x * 60) * 0.018;
        v.z += pleatRipple + 0.015;
      }

      v.x = Math.cos(angle) * r * 1.18;
      v.z = Math.sin(angle) * r;
      skirtPos.setXYZ(i, v.x, v.y, v.z);
    }

    // Part B: Pallu / Diagonal Drape across chest to left shoulder
    const palluCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.15, 0.95, 0.08),   // Right waist
      new THREE.Vector3(0.08, 1.15, 0.16),   // Across midriff
      new THREE.Vector3(-0.06, 1.30, 0.15),  // Left breast
      new THREE.Vector3(-0.20, 1.42, 0.02),  // Left shoulder peak
      new THREE.Vector3(-0.22, 1.30, -0.12), // Down behind back
      new THREE.Vector3(-0.24, 0.85, -0.16)  // Flowing trailing pallu edge
    ]);

    // Extrude a drape along pallu curve
    const palluRibbon = new THREE.TubeGeometry(palluCurve, 32, 0.08, 8, false);

    // Merge skirt and pallu
    const merged = mergeGeometries([skirtGeo, palluRibbon], false) || skirtGeo.clone();
    // Flatten UVs properly for UV repeating PBR textures
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

  /**
   * Attaches Morph Targets (Shape Keys) directly onto the BufferGeometry:
   * Target 0: Shoulder_Width
   * Target 1: Waist_Size
   * Target 2: Hip_Size
   */
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

      // 1. Shoulder morph: impacts Y between 1.25 and 1.55
      if (y > 1.25 && y < 1.55) {
        const factor = Math.sin(((y - 1.25) / 0.30) * Math.PI);
        shoulderMorph[i * 3] = v.x * factor * 0.45; // Expand/contract shoulders along X
        shoulderMorph[i * 3 + 1] = 0;
        shoulderMorph[i * 3 + 2] = v.z * factor * 0.15;
      }

      // 2. Waist morph: impacts Y between 0.90 and 1.15
      if (y > 0.88 && y < 1.18) {
        const factor = Math.sin(((y - 0.88) / 0.30) * Math.PI);
        waistMorph[i * 3] = v.x * factor * 0.40;
        waistMorph[i * 3 + 1] = 0;
        waistMorph[i * 3 + 2] = v.z * factor * 0.40;
      }

      // 3. Hip morph: impacts Y between 0.60 and 0.95
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

  /**
   * Studio Pedestal Stand
   */
  private static createStudioPedestal(goldMaterial: THREE.Material): THREE.Group {
    const stand = new THREE.Group();

    // Base podium cylinder
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

    // Glowing golden bevel rim
    const rimGeo = new THREE.TorusGeometry(0.57, 0.015, 16, 64);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, goldMaterial);
    rimMesh.position.y = 0.08;
    stand.add(rimMesh);

    return stand;
  }
}
