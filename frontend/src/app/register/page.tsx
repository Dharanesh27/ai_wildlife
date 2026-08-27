"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "Wildlife Researcher",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Direct call to local FastAPI backend. If the container or server runs on localhost:8000
      const response = await axios.post("http://localhost:8000/api/v1/auth/register", formData);
      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail)) {
          const msg = detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ");
          setError(msg);
        } else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError("Network error: Failed to connect to the backend server. Please verify backend is running on port 8000.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 flex-col items-center justify-center p-6 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-lg glass rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 mb-3 shadow-lg shadow-emerald-500/20">
            W
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Create Environmental Account</h2>
          <p className="text-sm text-slate-400 mt-1">Register credentials to access monitoring layers.</p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Registration successful! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">First Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Jane"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <input
                type="email"
                required
                placeholder="researcher@wildlife.gov"
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Role</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <select
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none text-sm text-slate-100 appearance-none transition-all cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Wildlife Researcher" className="bg-slate-950">Wildlife Researcher</option>
                <option value="Conservation Officer" className="bg-slate-950">Conservation Officer</option>
                <option value="Forest Department Officer" className="bg-slate-950">Forest Department Officer</option>
                <option value="Administrator" className="bg-slate-950">Administrator</option>
              </select>
            </div>
            <p className="text-[10px] text-emerald-400/80 mt-1 font-medium transition-all">
              {formData.role === "Wildlife Researcher" && "✓ Grants access to Overview census, GBIF taxonomy, and reports."}
              {formData.role === "Conservation Officer" && "✓ Grants access to GIS mapping, alarm monitoring, and recommendations."}
              {formData.role === "Forest Department Officer" && "✓ Grants access to GIS mapping and site configuration."}
              {formData.role === "Administrator" && "✓ Grants complete systems administration, database, and telemetry access."}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
          >
            {isLoading ? "Provisioning..." : "Create Account"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <p className="text-sm text-slate-400 mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
