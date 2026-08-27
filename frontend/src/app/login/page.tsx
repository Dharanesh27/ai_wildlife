"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Mail, Lock, ArrowRight, AlertTriangle, Play } from "lucide-react";
import axios from "axios";
import { setCredentials } from "../../store/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Send OAuth2 Password Form Data
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      const tokenRes = await axios.post("http://localhost:8000/api/v1/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token } = tokenRes.data;

      // 2. Fetch User Profile
      const userRes = await axios.get("http://localhost:8000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      // 3. Dispatch to Redux Store
      dispatch(setCredentials({ token: access_token, user: userRes.data }));
      router.push("/dashboard");
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
        setError("Connection failed. Check if local backend is active at port 8000, or launch in Demo Mode below.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoBypass = () => {
    // Dispatch a dummy user session for evaluation without running the backend
    const dummyUser = {
      id: "demo-user-id-12345",
      email: "demo.researcher@wildlife.gov",
      first_name: "Demo",
      last_name: "Researcher",
      role: "Wildlife Researcher" as const,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    dispatch(setCredentials({ token: "demo-token", user: dummyUser }));
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 flex-col items-center justify-center p-6 relative">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 mb-3 shadow-lg shadow-emerald-500/20">
            W
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Access Population Console</h2>
          <p className="text-sm text-slate-400 mt-1 font-medium">Log in to process telemetry captures.</p>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-600" />
              <input
                type="email"
                required
                placeholder="researcher@wildlife.gov"
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-600 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
          >
            {isLoading ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-900"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">OR</span>
          <div className="flex-grow border-t border-slate-900"></div>
        </div>

        <button
          onClick={handleDemoBypass}
          className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="h-4 w-4 fill-emerald-400" />
          Quick Launch Demo Sandbox
        </button>

        <p className="text-sm text-slate-400 mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-400 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
