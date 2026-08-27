import json
import urllib.request
import urllib.parse
from typing import Dict, Any

class TaxonomicLookupService:
    # Local fallback directory for standard wildlife keywords
    LOCAL_FALLBACKS = {
        "tiger": {
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Felidae",
            "genus": "Panthera",
            "scientificName": "Panthera tigris",
            "iucn_code": "EN",
            "iucn_category": "Endangered"
        },
        "panthera tigris": {
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Felidae",
            "genus": "Panthera",
            "scientificName": "Panthera tigris",
            "iucn_code": "EN",
            "iucn_category": "Endangered"
        },
        "elephant": {
            "class": "Mammalia",
            "order": "Proboscidea",
            "family": "Elephantidae",
            "genus": "Elephas",
            "scientificName": "Elephas maximus",
            "iucn_code": "EN",
            "iucn_category": "Endangered"
        },
        "elephas maximus": {
            "class": "Mammalia",
            "order": "Proboscidea",
            "family": "Elephantidae",
            "genus": "Elephas",
            "scientificName": "Elephas maximus",
            "iucn_code": "EN",
            "iucn_category": "Endangered"
        },
        "leopard": {
            "class": "Mammalia",
            "order": "Carnivora",
            "family": "Felidae",
            "genus": "Panthera",
            "scientificName": "Panthera pardus",
            "iucn_code": "VU",
            "iucn_category": "Vulnerable"
        },
        "human": {
            "class": "Mammalia",
            "order": "Primates",
            "family": "Hominidae",
            "genus": "Homo",
            "scientificName": "Homo sapiens",
            "iucn_code": "LC",
            "iucn_category": "Least Concern"
        },
        "person": {
            "class": "Mammalia",
            "order": "Primates",
            "family": "Hominidae",
            "genus": "Homo",
            "scientificName": "Homo sapiens",
            "iucn_code": "LC",
            "iucn_category": "Least Concern"
        },
        "bird": {
            "class": "Aves",
            "order": "Passeriformes",
            "family": "Corvidae",
            "genus": "Corvus",
            "scientificName": "Corvus splendens",
            "iucn_code": "LC",
            "iucn_category": "Least Concern"
        },
        "gunshot": {
            "class": "Acoustic Threat",
            "order": "Security Event",
            "family": "Ballistics",
            "genus": "Weapon",
            "scientificName": "Poaching Incident",
            "iucn_code": "CR",
            "iucn_category": "Critical Alert"
        }
    }

    @classmethod
    def get_fallback(cls, name: str) -> Dict[str, str]:
        """Resolves local baseline fallback for standard reserve wildlife."""
        name_lower = name.lower()
        for key, value in cls.LOCAL_FALLBACKS.items():
            if key in name_lower:
                return value
        return {
            "class": "Unknown Class",
            "order": "Unknown Order",
            "family": "Unknown Family",
            "genus": "Unknown Genus",
            "scientificName": name.capitalize(),
            "iucn_code": "DD",
            "iucn_category": "Data Deficient"
        }

    @classmethod
    async def fetch_details(cls, species_name: str) -> Dict[str, str]:
        """
        Fetches official scientific taxonomy classification from the public GBIF API
        and maps conservation status using IUCN Red List standards.
        """
        # 1. Clean query name
        query_name = species_name.split("(")[0].strip()
        
        # Get baseline local fallback first
        fallback = cls.get_fallback(query_name)
        
        # 2. Try fetching from GBIF API (Global Biodiversity Information Facility)
        encoded_name = urllib.parse.quote(query_name)
        gbif_url = f"https://api.gbif.org/v1/species/match?name={encoded_name}"
        
        try:
            # Run quick HTTP GET call with 2.5-second timeout
            req = urllib.request.Request(gbif_url, headers={'User-Agent': 'FastAPI-Wildlife-Lineage'})
            with urllib.request.urlopen(req, timeout=2.5) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                # Check if we got a valid taxonomic match
                if data.get("matchType") != "NONE" and "class" in data:
                    class_val = data.get("class", fallback["class"])
                    order_val = data.get("order", fallback["order"])
                    family_val = data.get("family", fallback["family"])
                    genus_val = data.get("genus", fallback["genus"])
                    sci_name = data.get("scientificName", fallback["scientificName"])
                    
                    lineage = f"{class_val} > {order_val} > {family_val}"
                    print(f"GBIF taxonomic lookup success for '{query_name}': {lineage}")
                    
                    return {
                        "class": class_val,
                        "order": order_val,
                        "family": family_val,
                        "genus": genus_val,
                        "scientific_name": sci_name,
                        "lineage": lineage,
                        "iucn_code": fallback["iucn_code"],
                        "iucn_category": fallback["iucn_category"]
                    }
        except Exception as e:
            print(f"Warning: GBIF taxonomic API call failed: {e}. Falling back to local data.")

        # 3. Fallback Return
        lineage = f"{fallback['class']} > {fallback['order']} > {fallback['family']}"
        return {
            "class": fallback["class"],
            "order": fallback["order"],
            "family": fallback["family"],
            "genus": fallback["genus"],
            "scientific_name": fallback["scientificName"],
            "lineage": lineage,
            "iucn_code": fallback["iucn_code"],
            "iucn_category": fallback["iucn_category"]
        }
