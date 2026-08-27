# AI Wildlife System - Custom YOLOv8 Model Swap Guide
# This file serves as a utility script and guide to swap the default model.

import os
import sys

def guide():
    print("=" * 60)
    # Highlight how to download and swap weights
    print("Guide: How to Load your Custom Retrained Wildlife Model")
    print("=" * 60)
    print("\nStep 1: Save your custom ONNX file")
    print("   Save your custom-trained YOLOv8 ONNX weights file as 'yolov8_custom.onnx'")
    print("   in the backend root directory (c:/Users/dhara/Ai_Wildlife/backend).")
    
    print("\nStep 2: Update the backend configurations")
    print("   Open 'app/core/inference.py' and modify:")
    print("   - MODEL_PATH = 'yolov8_custom.onnx'")
    print("   - COCO_CLASSES = [ ...your custom list of labels in order... ]")
    print("   - CLASS_MAPPINGS = { ...your custom display mappings... }")
    
    print("\nStep 3: Run the check")
    print("   Execute your validation script to make sure the custom model")
    print("   is loaded and runs successfully.")
    print("=" * 60)

if __name__ == "__main__":
    guide()
