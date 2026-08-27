"use client";

import Link from "next/link";
import { Eye, Shield, MapPin, Database, Award, ArrowRight, Zap, RefreshCw, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background Radial Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
            W
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              AI Wildlife Intelligence
            </h1>
            <p className="text-xs text-slate-500">Global Conservation Platform</p>
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors">
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all font-semibold hover:shadow-lg hover:shadow-emerald-500/20"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-5xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-6">
          <Zap className="h-3 w-3" />
          <span>v1.0 Production-Ready Deployment</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Enterprise Wildlife Population & <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
            Bioacoustic Intelligence
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-3xl mb-10 leading-relaxed">
          Monitor biodiversity hotspots, track endangered species, analyze environmental indicators, and generate intelligent conservation policy recommendations using state-of-the-art vision and acoustic AI pipelines.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-90 transition-all shadow-xl shadow-emerald-500/15"
          >
            Deploy New Survey
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold transition-all"
          >
            Explore Dashboard Demo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm hover:border-emerald-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-all">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Computer Vision Models</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              YOLOv8-powered object detection and species classification pipelines tailored for high-volume camera traps and drone imagery.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm hover:border-teal-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:bg-teal-500/20 transition-all">
              <BarChart2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Acoustic Audio Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              BirdNET and YAMNet integration for automated bird and mammal call recognition, noise filtering, and temporal acoustic events.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm hover:border-blue-500/30 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20 transition-all">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">GIS-Powered Dashboard</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Interactive spatial layers, species mapping, coordinates history, and localized habitat degradation risk scoring.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-8 px-6 text-center text-xs text-slate-500 z-10">
        <p>© {new Date().getFullYear()} AI Wildlife Population Intelligence System. All rights reserved.</p>
        <p className="mt-2 text-slate-600">Built for wildlife researchers, park rangers, and government environmental conservation agencies.</p>
      </footer>
    </div>
  );
}
