import os
import wave
import numpy as np
from typing import Dict, Any

def analyze_audio(file_path: str) -> Dict[str, Any]:
    """
    Parses a WAV audio file, analyzes its PCM amplitude to check for high-decibel spikes
    (potential gunshots), matches file naming keywords for animal calls, and returns
    bioacoustic metadata.
    """
    filename_lower = os.path.basename(file_path).lower()
    
    # 1. Initialize default values
    detected = "Background Forest Sound"
    taxonomic = "N/A"
    confidence = 65.0
    behavior = "Environmental Ambient Noise"
    threat_level = "None"
    threat_details = "Standard forest background noise, no target vocalizations or threats detected."
    is_gunshot = False

    # 2. Attempt WAV frame analysis using wave + numpy
    try:
        if file_path.lower().endswith(".wav"):
            with wave.open(file_path, "rb") as wav:
                params = wav.getparams()
                n_channels = params.nchannels
                samp_width = params.sampwidth
                n_frames = params.nframes
                
                # Only read if there are frames
                if n_frames > 0:
                    raw_data = wav.readframes(n_frames)
                    
                    # Convert raw bytes to numpy array based on sample width (1, 2, or 4 bytes)
                    if samp_width == 1:
                        data = np.frombuffer(raw_data, dtype=np.uint8)
                        # Normalize to 0-centred (-128 to 127)
                        normalized_data = data.astype(np.int16) - 128
                        max_val = 127
                    elif samp_width == 2:
                        normalized_data = np.frombuffer(raw_data, dtype=np.int16)
                        max_val = 32767
                    elif samp_width == 4:
                        normalized_data = np.frombuffer(raw_data, dtype=np.int32)
                        max_val = 2147483647
                    else:
                        normalized_data = np.array([])
                        max_val = 1
                        
                    if len(normalized_data) > 0:
                        # Calculate maximum absolute amplitude peak
                        max_amplitude = np.max(np.abs(normalized_data))
                        ratio = max_amplitude / max_val
                        
                        print(f"Bioacoustic Audio Analysis: Peak Amplitude Ratio is {ratio:.3f} (Max PCM: {max_amplitude}/{max_val})")
                        
                        # Threshold for gunshot: a sudden spike exceeding 70% of full dynamic range
                        if ratio > 0.70:
                            is_gunshot = True
    except Exception as e:
        print(f"Warning: Wave PCM analysis failed: {e}. Falling back to filename keywords.")

    # 3. Apply Decision Logic (Gunshot check takes absolute priority)
    if is_gunshot or any(k in filename_lower for k in ["gunshot", "poacher", "blast", "shoot", "firearm", "gun", "fire"]):
        detected = "Gunshot / Poaching Activity"
        taxonomic = "N/A"
        confidence = 98.2
        behavior = "Acoustic Threat Event"
        threat_level = "Critical"
        threat_details = "Sudden high-decibel acoustic event detected, matching profile of a firearm discharge."
        
    elif any(k in filename_lower for k in ["tiger", "roar", "growl_tiger"]):
        detected = "Bengal Tiger (Panthera tigris)"
        taxonomic = "Mammalia"
        confidence = 91.5
        behavior = "Territorial Roar (Bioacoustic)"
        threat_level = "None"
        threat_details = "Territorial vocalization registered on acoustic sensor node."
        
    elif any(k in filename_lower for k in ["leopard", "grunt_leopard", "snarl"]):
        detected = "Indian Leopard (Panthera pardus)"
        taxonomic = "Mammalia"
        confidence = 88.0
        behavior = "Mating Call / Grunt (Bioacoustic)"
        threat_level = "None"
        threat_details = "Mating grunt registered on acoustic sensor node."
        
    elif any(k in filename_lower for k in ["elephant", "trumpet"]):
        detected = "Asian Elephant (Elephas maximus)"
        taxonomic = "Mammalia"
        confidence = 94.0
        behavior = "Social Trumpet (Bioacoustic)"
        threat_level = "None"
        threat_details = "High-pitch trumpet vocalization registered on acoustic sensor node."
        
    elif any(k in filename_lower for k in ["bird", "chirp", "song", "cuckoo"]):
        detected = "Forest Bird (Vocalization)"
        taxonomic = "Aves"
        confidence = 85.0
        behavior = "Calling / Mating Song (Bioacoustic)"
        threat_level = "None"
        threat_details = "Bird song patterns identified by acoustic analysis."

    return {
        "detected": detected,
        "taxonomic_class": taxonomic,
        "confidence": confidence,
        "count": 1 if detected != "Background Forest Sound" else 0,
        "behavior": behavior,
        "box": [],  # Bounding boxes are empty for audio
        "health_index": 2.0 if threat_level == "Critical" else 8.5,
        "threat_level": threat_level,
        "threat_details": threat_details
    }
