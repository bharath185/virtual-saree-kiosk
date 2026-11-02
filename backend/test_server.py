import cv2
import os
import time
from server import (
    extract_body_and_skin,
    perform_photorealistic_vton,
    get_saree_rgba,
    SAREE_ASSETS
)

def test_vton_pipeline():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_img_path = os.path.join(project_root, "reference_saree.jpg")
    
    print(f"Reading test model image: {test_img_path}")
    person_bgr = cv2.imread(test_img_path)
    if person_bgr is None:
        print("Error: Could not load reference_saree.jpg")
        return

    # Let's test with Royal Banarasi Blue and Crimson Red presets!
    for preset in ["royal-banarasi", "kanjeevaram-red", "emerald-silk"]:
        print(f"\n--- Testing preset: {preset} ---")
        t0 = time.time()
        saree_rgba = get_saree_rgba(preset)
        
        # 1. Vision extraction
        keypoints, person_mask, skin_mask = extract_body_and_skin(person_bgr)
        print(f"Keypoints detected: {list(keypoints.keys())}")
        
        # 2. VTON synthesis
        result_bgr = perform_photorealistic_vton(
            person_bgr=person_bgr,
            saree_rgba=saree_rgba,
            keypoints=keypoints,
            person_mask=person_mask,
            skin_mask=skin_mask,
            is_mirrored=False
        )
        
        out_path = os.path.join(os.path.dirname(__file__), f"test_output_{preset}.jpg")
        cv2.imwrite(out_path, result_bgr)
        elapsed = (time.time() - t0) * 1000
        print(f"✅ Generated {out_path} in {elapsed:.1f}ms")

if __name__ == "__main__":
    test_vton_pipeline()
