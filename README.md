# Divya Atelier · Virtual Saree Try-On Kiosk

A standalone, local **Virtual Saree Try-On Kiosk** running in portrait mode (9:16 aspect ratio, 1080x1920) designed for vertical TV displays and retail showroom digital kiosks.

---

## 🏛️ System Architecture: Hybrid Edge-CV + 3D WebGL Engine

1. **Frontend / Engine**:
   - WebGL powered by **Three.js** with ACES Filmic tone mapping and studio lighting.
   - 35° Field-of-View camera to eliminate wide-angle fish-eye distortion in portrait 9:16 orientation.
   - Studio Three-Point Lighting Rig: Warm White Key Light, Soft Cool Fill Light, and Golden Rim Light for zari sheen.
   - Clamped OrbitControls (360° horizontal yaw, clamped pitch to prevent camera flipping underneath the floor).

2. **Vision / Edge-AI**:
   - Real-time webcam processing via `@mediapipe/tasks-vision` (client-side WebAssembly/GPU Pose Landmarker).
   - Detects shoulder width (Landmarks 11 & 12), body height (0 & 27/28), and hip ratio (23 & 24).
   - Exponential Moving Average (EMA, $\alpha = 0.15$) jitter filter.
   - 2-second guide frame calibration locking:
     - `shoulderScale`: mapped between `0.85` and `1.25`.
     - `waistHipScale`: mapped between `0.80` and `1.30`.
     - `heightScale`: mapped between `0.90` and `1.15`.
   - Built-in simulation fallback mode with interactive fine-tune sliders for devices without webcams.

3. **Parametric 3D Garment System**:
   - Parametric mannequin and draped saree mesh with real Three.js Morph Targets:
     - `Shoulder_Width`
     - `Waist_Size`
     - `Hip_Size`
   - Dynamically conforms the draped saree to customer body proportions in real time.
   - Supports external GLTF loading from `/public/models/mannequin_saree.glb` with procedural parametric fallback.

4. **Saree Material & Texture Swapping Engine (<100ms)**:
   - 5 Distinct PBR presets:
     1. **Kanjeevaram Bridal Crimson**: 24k gold foil metallic normal map, rich silk sheen.
     2. **Banarasi Royal Neelam**: Midnight royal blue jacquard, silver/gold floral brocade.
     3. **Mayilkan Emerald Silk**: Satin-smooth roughness (~0.25), crisp gopuram temple zari border.
     4. **Gulabi Chiffon Georgette**: Translucent, high roughness (~0.65), matte finish, delicate sheer flow.
     5. **Pithambari Handloom Khadi**: Pure cotton, 0.0 metalness, handloom woven thread bump map.
   - Re-uses a single `MeshPhysicalMaterial` instance and swaps GPU canvas texture pointers in-place, achieving **<15ms swap times**.

5. **Kiosk User Interface**:
   - Minimalist luxury branding (*Divya · Atelier*).
   - Toggleable Picture-in-Picture (PiP) webcam feed with skeleton joints and calibration badge.
   - 60-second idle timeout returning to showcase auto-spin mode.
   - **Snap Photo / Get Look** action with Polaroid-style look card and mobile QR code generation (`qrcode.react`) with celebratory golden confetti.

---

## 🚀 Running the Application

### Browser Mode (Responsive / Fullscreen)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Click the fullscreen button in the top right for borderless portrait experience.

### Electron Kiosk Mode (1080x1920 Borderless Window)
```bash
npm run kiosk
```
This automatically starts Vite and launches Electron frameless at 1080x1920 with pre-approved webcam access.

Press **F11** to toggle fullscreen or **F12** for developer tools.
