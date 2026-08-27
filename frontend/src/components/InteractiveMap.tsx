"use client";

import React, { useEffect, useRef, useState } from "react";
import { Volume2, MapPin } from "lucide-react";

interface Device {
  id: string;
  name: string;
  device_type: string;
  status: string;
  battery_level: number;
  latitude: number;
  longitude: number;
}

interface Site {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location_name: string;
  description: string;
}

interface InteractiveMapProps {
  sites: Site[];
  selectedSiteId: string;
  devices: Device[];
  theme: "dark" | "light";
}

export default function InteractiveMap({ sites, selectedSiteId, devices, theme }: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  
  // Dynamic Map Layer Type
  const [mapLayer, setMapLayer] = useState<"dark" | "light" | "satellite" | "terrain">("dark");

  // Sync map layer when parent theme changes
  useEffect(() => {
    if (theme === "light" && mapLayer === "dark") {
      setMapLayer("light");
    } else if (theme === "dark" && mapLayer === "light") {
      setMapLayer("dark");
    }
  }, [theme]);

  // Find currently selected site
  const currentSite = sites.find(s => s.id === selectedSiteId);

  useEffect(() => {
    // If window is not defined (SSR), or leaflet is not loaded, do nothing
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    
    // Ensure Leaflet is loaded from CDN
    const L = (window as any).L;
    if (!L) {
      console.warn("Leaflet library L is not defined on window. Retrying load...");
      return;
    }

    // Default center coords
    const centerLat = currentSite ? currentSite.latitude : 11.5623;
    const centerLng = currentSite ? currentSite.longitude : 76.5345;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([centerLat, centerLng], 13);

      // Initialize with active layer
      const initialUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      const baseLayer = L.tileLayer(initialUrl, {
        maxZoom: 20,
      }).addTo(map);
      tileLayerRef.current = baseLayer;

      // Add custom zoom control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer dynamically when layer selection changes
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !tileLayerRef.current) return;

    // Remove active tile layer
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = "";
    if (mapLayer === "dark") {
      url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    } else if (mapLayer === "light") {
      url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    } else if (mapLayer === "satellite") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    } else if (mapLayer === "terrain") {
      url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
    }

    const newLayer = L.tileLayer(url, { maxZoom: 20 });
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapLayer]);

  // Update map view when selected site changes
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !currentSite) return;

    mapInstanceRef.current.setView([currentSite.latitude, currentSite.longitude], 13);
  }, [selectedSiteId, currentSite]);

  // Update markers when devices change
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current || !markerGroupRef.current) return;

    // Clear old markers
    markerGroupRef.current.clearLayers();

    // Custom marker icon configurations
    const createCustomIcon = (deviceType: string, status: string) => {
      const color = status === "Active" ? "#10b981" : "#f59e0b"; // Emerald green vs Amber orange
      const iconHtml = `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #0f172a;
          box-shadow: 0 0 10px ${color}80;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          font-weight: bold;
          font-size: 11px;
        ">
          ${deviceType === "Camera Trap" ? "📷" : "🔊"}
        </div>
      `;
      return L.divIcon({
        html: iconHtml,
        className: "custom-device-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    };

    devices.forEach((dev) => {
      const customIcon = createCustomIcon(dev.device_type, dev.status);
      
      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; color: #f1f5f9; background-color: #0f172a; border-radius: 8px; font-size: 11px;">
          <h4 style="margin: 0 0 6px 0; font-size: 12px; color: #10b981; border-bottom: 1px solid #1e293b; padding-bottom: 4px;">${dev.name}</h4>
          <p style="margin: 3px 0;"><strong>Type:</strong> ${dev.device_type}</p>
          <p style="margin: 3px 0;"><strong>Status:</strong> <span style="color: ${dev.status === 'Active' ? '#10b981' : '#f59e0b'}">${dev.status}</span></p>
          <p style="margin: 3px 0;"><strong>Battery:</strong> ${dev.battery_level.toFixed(1)}%</p>
          <p style="margin: 4px 0 0 0; font-family: monospace; color: #64748b; font-size: 9px; padding-top: 4px; border-top: 1px dashed #1e293b;">
            ${dev.latitude.toFixed(5)} N, ${dev.longitude.toFixed(5)} E
          </p>
        </div>
      `;

      const marker = L.marker([dev.latitude, dev.longitude], { icon: customIcon })
        .bindPopup(popupContent, {
          closeButton: false,
          className: "custom-leaflet-popup"
        });

      markerGroupRef.current.addLayer(marker);
    });
  }, [devices]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full rounded-2xl" />
      
      {/* Floating Basemap Layer Selection HUD */}
      <div className="absolute top-6 left-6 flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-slate-800/80 backdrop-blur-md z-[1000] shadow-xl">
        <button
          onClick={() => setMapLayer("dark")}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            mapLayer === "dark" 
              ? "bg-emerald-500 text-slate-950" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => setMapLayer("light")}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            mapLayer === "light" 
              ? "bg-emerald-500 text-slate-950" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Light
        </button>
        <button
          onClick={() => setMapLayer("satellite")}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            mapLayer === "satellite" 
              ? "bg-emerald-500 text-slate-950" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sat
        </button>
        <button
          onClick={() => setMapLayer("terrain")}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            mapLayer === "terrain" 
              ? "bg-emerald-500 text-slate-950" 
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Terrain
        </button>
      </div>

      {/* Sleek Custom Legend HUD overlay */}
      <div className="absolute bottom-6 left-6 p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 backdrop-blur-md max-w-xs space-y-2 z-[1000] shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">GIS Interactive Map</h4>
        <div className="text-[11px] space-y-1.5 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block border border-slate-950" />
            <span>Active Telemetry Device</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 block border border-slate-950" />
            <span>Maintenance / Low Battery</span>
          </div>
          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            Current Location: <span className="text-slate-300 font-medium">{currentSite ? currentSite.location_name : "Loading reserve..."}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
