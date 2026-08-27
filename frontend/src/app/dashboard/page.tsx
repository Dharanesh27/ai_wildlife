"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { logout } from "../../store/authSlice";
import axios from "axios";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("../../components/InteractiveMap"), {
  ssr: false,
});
import {
  Activity,
  Compass,
  Database,
  Eye,
  LogOut,
  MapPin,
  Shield,
  TrendingUp,
  Upload,
  User as UserIcon,
  AlertOctagon,
  FileSpreadsheet,
  Award,
  Volume2,
  TreePine,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  PlusCircle,
  Play,
  Bell,
  Sun,
  Moon
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line
} from "recharts";

// --- STATIC FALLBACK MOCK DATA (DEMO MODE) ---
const mockPopulationData = [
  { month: "Jan", BengalTiger: 120, AsianElephant: 310, IndianLeopard: 220 },
  { month: "Feb", BengalTiger: 122, AsianElephant: 308, IndianLeopard: 224 },
  { month: "Mar", BengalTiger: 125, AsianElephant: 315, IndianLeopard: 231 },
  { month: "Apr", BengalTiger: 130, AsianElephant: 312, IndianLeopard: 235 },
  { month: "May", BengalTiger: 129, AsianElephant: 320, IndianLeopard: 242 },
  { month: "Jun", BengalTiger: 134, AsianElephant: 324, IndianLeopard: 249 },
  { month: "Jul", BengalTiger: 138, AsianElephant: 330, IndianLeopard: 255 },
];

const mockAlertData = [
  { name: "Mon", PoachingAlerts: 1, IntrusionAlerts: 3, FireRisk: 1 },
  { name: "Tue", PoachingAlerts: 0, IntrusionAlerts: 5, FireRisk: 2 },
  { name: "Wed", PoachingAlerts: 2, IntrusionAlerts: 2, FireRisk: 1 },
  { name: "Thu", PoachingAlerts: 0, IntrusionAlerts: 1, FireRisk: 0 },
  { name: "Fri", PoachingAlerts: 1, IntrusionAlerts: 4, FireRisk: 3 },
  { name: "Sat", PoachingAlerts: 3, IntrusionAlerts: 6, FireRisk: 4 },
  { name: "Sun", PoachingAlerts: 0, IntrusionAlerts: 2, FireRisk: 2 },
];

const mockSpeciesDistribution = [
  { name: "Mammals", value: 45, color: "#10b981" },
  { name: "Birds", value: 30, color: "#14b8a6" },
  { name: "Reptiles", value: 15, color: "#3b82f6" },
  { name: "Amphibians", value: 10, color: "#8b5cf6" },
];

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isLight = theme === "light";

  // AI Interactive State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Backend state
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [devices, setDevices] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [selectedDeviceForInference, setSelectedDeviceForInference] = useState<string>("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "Wildlife Researcher"
  });
  const [trendMetrics, setTrendMetrics] = useState<any | null>(null);
  const [suitabilityData, setSuitabilityData] = useState<any | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Loading/Operation states
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDemo = token === "demo-token" || !token;
  const userRole = isDemo ? "Administrator" : user?.role;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Verification protection
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [isMounted, isAuthenticated, router]);

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setCreateUserError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post("http://localhost:8000/api/v1/users/create", newUserData, { headers });
      
      // Clear form
      setNewUserData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "Wildlife Researcher"
      });
      setIsCreateOpen(false);
      showToast("Active user account created successfully!", "success");
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setCreateUserError(err.response.data.detail);
      } else {
        setCreateUserError("Failed to create user. Verify connection to the backend.");
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const loadPendingUsers = async () => {
    if (isDemo || userRole !== "Administrator") return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("http://localhost:8000/api/v1/users/pending", { headers });
      setPendingUsers(res.data);
    } catch (err) {
      console.error("Failed to load pending users", err);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setIsApproving(userId);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:8000/api/v1/users/${userId}/approve`, {}, { headers });
      await loadPendingUsers();
    } catch (err) {
      console.error("Failed to approve user", err);
      showToast("Failed to approve user registration.", "error");
    } finally {
      setIsApproving(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to reject and delete this registration request?")) return;
    setIsApproving(userId);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:8000/api/v1/users/${userId}/reject`, { headers });
      await loadPendingUsers();
    } catch (err) {
      console.error("Failed to reject user", err);
      showToast("Failed to reject user registration.", "error");
    } finally {
      setIsApproving(null);
    }
  };

  // Fetch initial data
  const loadDashboardData = async () => {
    if (isDemo) {
      setSites([
        {
          id: "all",
          name: "Mudumalai Tiger Reserve",
          location_name: "Nilgiri Hills, Tamil Nadu",
          latitude: 11.5623,
          longitude: 76.5345,
          description: "Nilgiri Biosphere Reserve corridor, high density of Bengal Tigers, Indian Elephants, and leopards.",
          is_protected_area: true
        }
      ]);
      setSelectedSiteId("all");
      setDevices([
        {
          id: "dev-1",
          name: "Moyar Path Cam 1",
          device_type: "Camera Trap",
          status: "Active",
          battery_level: 92.4,
          latitude: 11.5645,
          longitude: 76.5360
        },
        {
          id: "dev-2",
          name: "Scrub Gorge Audio 2",
          device_type: "Audio Sensor",
          status: "Active",
          battery_level: 88.1,
          latitude: 11.5610,
          longitude: 76.5312
        },
        {
          id: "dev-3",
          name: "Nilgiri Edge Cam 3",
          device_type: "Camera Trap",
          status: "Inactive",
          battery_level: 4.2,
          latitude: 11.5650,
          longitude: 76.5380
        }
      ]);
      loadAlerts();
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch sites
      const sitesRes = await axios.get("http://localhost:8000/api/v1/sites", { headers });
      setSites(sitesRes.data);
      if (sitesRes.data.length > 0) {
        setSelectedSiteId(sitesRes.data[0].id);
      }

      // Fetch active recommendations
      const recsRes = await axios.get("http://localhost:8000/api/v1/recommendations", { headers });
      setRecommendations(recsRes.data);

      // Fetch recent observations
      const obsRes = await axios.get("http://localhost:8000/api/v1/observations", { headers });
      setObservations(obsRes.data);
      await loadAlerts();
      await loadPendingUsers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to connect to local FastAPI backend. Database metrics fall back to demo mode.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch site-specific data (devices, health logs, site observations)
  const loadSiteSpecificData = async () => {
    if (isDemo || selectedSiteId === "all") return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch devices
      const devicesRes = await axios.get(`http://localhost:8000/api/v1/sites/${selectedSiteId}/devices`, { headers });
      setDevices(devicesRes.data);
      if (devicesRes.data.length > 0) {
        setSelectedDeviceForInference(devicesRes.data[0].id);
      } else {
        setSelectedDeviceForInference("");
      }

      // Fetch health logs
      const healthLogsRes = await axios.get(`http://localhost:8000/api/v1/sites/${selectedSiteId}/health-logs`, { headers });
      setHealthLogs(healthLogsRes.data);

      // Fetch observations for this site
      const obsRes = await axios.get(`http://localhost:8000/api/v1/sites/${selectedSiteId}/observations`, { headers });
      setObservations(obsRes.data);
      
      // Fetch dynamic HSI/NDVI suitability data
      await loadSuitabilityData(selectedSiteId);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && selectedSiteId !== "all") {
      loadSiteSpecificData();
    }
  }, [selectedSiteId]);

  useEffect(() => {
    if (isAuthenticated) {
      const siteId = selectedSiteId === "all" && sites.length > 0 ? sites[0].id : selectedSiteId;
      loadForecastData(siteId);
      loadSuitabilityData(siteId);
    }
  }, [selectedSiteId, sites, isAuthenticated]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  // Load Alerts
  const loadAlerts = async () => {
    if (isDemo) {
      setAlerts([
        {
          id: "alert-1",
          alert_type: "Security",
          title: "Intruder Alert: Critical Threat",
          message: "Threat detected at station 'Tiger Corridor Cam 1': Gunshot spike detected. Detected Bengal Tiger nearby.",
          severity: "Critical",
          is_read: false,
          timestamp: new Date().toISOString()
        },
        {
          id: "alert-2",
          alert_type: "Hardware",
          title: "Low Battery Warning: North Gate Security",
          message: "Station 'North Gate Security' battery level is critically low (4.2%). Maintenance required.",
          severity: "Warning",
          is_read: false,
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("http://localhost:8000/api/v1/alerts", { headers });
      setAlerts(res.data);
    } catch (err) {
      console.error("Failed to load alerts", err);
    }
  };

  // Dismiss a single alert
  const handleDismissAlert = async (alertId: string) => {
    if (isDemo) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:8000/api/v1/alerts/${alertId}/dismiss`, {}, { headers });
      await loadAlerts();
    } catch (err) {
      console.error("Failed to dismiss alert", err);
    }
  };

  // Dismiss all alerts
  const handleDismissAllAlerts = async () => {
    if (isDemo) {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put("http://localhost:8000/api/v1/alerts/dismiss-all/clear", {}, { headers });
      await loadAlerts();
    } catch (err) {
      console.error("Failed to dismiss all alerts", err);
    }
  };

  // Load dynamic population forecast data
  const loadForecastData = async (siteId: string) => {
    if (isDemo || siteId === "all") {
      setForecastData([
        { date: "2026-03", actual: 8, predicted: 8.2, lower: 6.5, upper: 9.8 },
        { date: "2026-04", actual: 9, predicted: 8.8, lower: 7.0, upper: 10.5 },
        { date: "2026-05", actual: 11, predicted: 9.4, lower: 7.6, upper: 11.2 },
        { date: "2026-06", actual: 10, predicted: 10.0, lower: 8.1, upper: 11.9 },
        { date: "2026-07", actual: null, predicted: 10.6, lower: 8.6, upper: 12.6 },
        { date: "2026-08", actual: null, predicted: 11.2, lower: 9.1, upper: 13.3 },
        { date: "2026-09", actual: null, predicted: 11.8, lower: 9.6, upper: 14.0 },
      ]);
      setTrendMetrics({
        slope: 0.6,
        growth_rate_pct: 6.4,
        assessment: "Increasing (Healthy Growth)",
        indicator: "positive",
        message: "Population shows a +6.4% monthly trend over 4 months. Ecological state: Increasing."
      });
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`http://localhost:8000/api/v1/analytics/forecast/${siteId}`, { headers });
      setForecastData(res.data.series);
      setTrendMetrics(res.data.metrics);
    } catch (err) {
      console.error("Failed to load population forecast", err);
    }
  };

  // Load dynamic habitat suitability scores
  const loadSuitabilityData = async (siteId: string) => {
    if (isDemo || siteId === "all") {
      setSuitabilityData({
        hsi_score: 8.24,
        ndvi: 0.76,
        water_proximity: 0.85,
        disturbance: 0.05,
        assessment: "Optimal Habitat Corridor (Prime)",
        recommendation: "No intervention needed. Maintain current drone patrol grids.",
        status_color: "positive",
        ndvi_trend: [
          { month: "Jan", ndvi: 0.72 },
          { month: "Feb", ndvi: 0.74 },
          { month: "Mar", ndvi: 0.76 },
          { month: "Apr", ndvi: 0.75 },
          { month: "May", ndvi: 0.77 },
          { month: "Jun", ndvi: 0.76 },
        ]
      });
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`http://localhost:8000/api/v1/monitoring/suitability/${siteId}`, { headers });
      setSuitabilityData(res.data);
    } catch (err) {
      console.error("Failed to load habitat suitability index", err);
    }
  };

  // Export PDF or Excel Reports
  const handleExportReport = async (type: 'pdf' | 'excel') => {
    if (isDemo) {
      showToast("Reports generation restricted to active database scopes.", "info");
      return;
    }
    
    const siteId = selectedSiteId === "all" && sites.length > 0 ? sites[0].id : selectedSiteId;
    if (siteId === "all") {
      showToast("Please select a specific reserve site first.", "info");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:8000/api/v1/reports/${type}/${siteId}`, {
        headers,
        responseType: "blob"
      });

      const contentType = response.headers["content-type"];
      const blob = new Blob([response.data], { type: typeof contentType === "string" ? contentType : undefined });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers["content-disposition"];
      let filename = `Wildlife_${type === 'pdf' ? 'Report' : 'Telemetry'}_Site.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      if (typeof contentDisposition === "string") {
        const matches = contentDisposition.match(/filename=(.+)/);
        if (matches && matches[1]) filename = matches[1];
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export ${type} report`, err);
      showToast(`Error compiling report: ${err}`, "error");
    }
  };

  // Recalculate health
  const handleRecalculateHealth = async () => {
    if (isDemo || selectedSiteId === "all") return;
    setIsRecalculating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:8000/api/v1/sites/${selectedSiteId}/recalculate-health`, {}, { headers });
      setHealthLogs([res.data, ...healthLogs]);
    } catch (err) {
      console.error("Recalculation error", err);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Database Seeder handler
  const handleSeedDatabase = async () => {
    if (isDemo) return;
    setIsSeeding(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post("http://localhost:8000/api/v1/seed", {}, { headers });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to run seed script. Verify the local server is running and Postgres connection is open.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Resolve recommendation
  const handleResolveRecommendation = async (id: string) => {
    if (isDemo) {
      setRecommendations(recommendations.filter(r => r.id !== id));
      showToast("Demo Mode: Sector dispatch recommendation resolved.", "info");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:8000/api/v1/recommendations/${id}`, { status: "Resolved" }, { headers });
      setRecommendations(recommendations.filter(r => r.id !== id));
      showToast("Recommendation resolved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Error resolving recommendation.", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  // Poll status of background Celery tasks
  const pollTaskStatus = async (taskId: string) => {
    const headers = { Authorization: `Bearer ${token}` };
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/observations/tasks/${taskId}`, { headers });
        if (res.data.status === "SUCCESS") {
          clearInterval(interval);
          setIsAnalyzing(false);
          const obs = res.data.result;
          
          if (obs.file_url) {
            setPreviewUrl(obs.file_url);
          }

          setAnalysisResult({
            detected: obs.detected,
            confidence: obs.confidence,
            taxonomic_class: obs.taxonomic_class,
            behavior: obs.behavior || "N/A",
            count: obs.count,
            health_index: obs.health_index,
            threat_level: obs.threat_level,
            alerts: obs.threat_level === "None" ? "None" : obs.threat_details
          });

          // Reload dashboards & maps
          await loadSiteSpecificData();

          // Refresh active recommendations
          const recsRes = await axios.get("http://localhost:8000/api/v1/recommendations", { headers });
          setRecommendations(recsRes.data);

          // Refresh telemetry warnings
          await loadAlerts();
        } else if (res.data.status === "FAILURE") {
          clearInterval(interval);
          setIsAnalyzing(false);
          setErrorMsg(`Celery background task execution failed: ${res.data.message}`);
        }
      } catch (err) {
        console.error("Error polling Celery task status:", err);
      }
    }, 1500);
  };

  // Process AI (Uploads real file to YOLOv8 backend or simulates in demo sandbox)
  const runSimulatedInference = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    
    if (isDemo) {
      setTimeout(() => {
        setIsAnalyzing(false);
        const fileName = selectedFile.name.toLowerCase();
        let detected = "Bengal Tiger (Panthera tigris)";
        let confidence = 96.8;
        let taxonomic_class = "Mammalia > Carnivora > Felidae";
        let behavior = "Walking / Patrol";
        let count = 1;
        let box = [120, 80, 410, 380];
        let health_index = 9.2;
        let threat_level = "None";
        let threat_details = "";

        if (fileName.includes("elephant")) {
          detected = "Asian Elephant (Elephas maximus)";
          confidence = 92.4;
          taxonomic_class = "Mammalia > Proboscidea > Elephantidae";
          behavior = "Feeding";
          count = 2;
          box = [45, 120, 520, 480];
          health_index = 8.5;
        } else if (fileName.includes("leopard")) {
          detected = "Indian Leopard (Panthera pardus)";
          confidence = 89.5;
          taxonomic_class = "Mammalia > Carnivora > Felidae";
          behavior = "Climbing Tree";
          count = 1;
          box = [80, 100, 420, 440];
          health_index = 8.4;
        } else if (fileName.includes("poacher") || fileName.includes("human") || fileName.includes("person")) {
          detected = "Human (Unauthorized / Poacher)";
          confidence = 99.1;
          taxonomic_class = "Mammalia > Primates > Hominidae";
          behavior = "Intrusion / Trespassing";
          count = 1;
          box = [150, 60, 380, 480];
          health_index = 2.0;
          threat_level = "Critical";
          threat_details = "Unauthorized human presence detected in reserve sector. Potential poaching risk.";
        } else if (fileName.includes("bear")) {
          detected = "Himalayan Brown Bear (Ursus arctos)";
          confidence = 85.0;
          taxonomic_class = "Mammalia > Carnivora > Ursidae";
          behavior = "Foraging";
          count = 1;
          box = [90, 110, 460, 450];
          health_index = 7.5;
          threat_level = "Medium";
          threat_details = "Predator activity detected near sensor node.";
        }

        const result = {
          detected,
          confidence,
          taxonomic_class,
          behavior,
          count,
          box,
          health_index,
          threat_level,
          threat_details,
        };

        setAnalysisResult({
          ...result,
          health_index: `${result.health_index}/10`,
          alerts: result.threat_level === "None" ? "None" : result.threat_details
        });
      }, 1500);
      return;
    }

    let isAsyncStarted = false;
    try {
      const headers = { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      };
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("device_id", selectedDeviceForInference);

      const response = await axios.post(
        "http://localhost:8000/api/v1/observations/upload", 
        formData, 
        { headers }
      );

      if (response.data.is_async) {
        isAsyncStarted = true;
        setAnalysisResult({
          detected: "AI processing in queue...",
          confidence: 0,
          taxonomic_class: "Resolving GBIF...",
          behavior: "Analysis in progress",
          count: 0,
          health_index: "Calculating...",
          threat_level: "None",
          alerts: "None"
        });
        await pollTaskStatus(response.data.task_id);
      } else {
        const obs = response.data.result;
        if (obs.file_url) {
          setPreviewUrl(obs.file_url);
        }

        setAnalysisResult({
          detected: obs.detected,
          confidence: obs.confidence,
          taxonomic_class: obs.taxonomic_class,
          behavior: obs.behavior || "N/A",
          count: obs.count,
          health_index: obs.health_index,
          threat_level: obs.threat_level,
          alerts: obs.threat_level === "None" ? "None" : obs.threat_details
        });

        // Reload dashboards & maps
        await loadSiteSpecificData();

        // Refresh active recommendations
        const recsRes = await axios.get("http://localhost:8000/api/v1/recommendations", { headers });
        setRecommendations(recsRes.data);

        // Refresh telemetry warnings
        await loadAlerts();
      }
    } catch (err: any) {
      console.error("YOLOv8 pipeline upload failed:", err);
      setErrorMsg("Failed to run backend YOLOv8 pipeline. Falling back to sandbox simulation.");
      
      const fileName = selectedFile.name.toLowerCase();
      let detected = "Bengal Tiger (Panthera tigris) [Simulated]";
      let confidence = 96.8;
      let taxonomic_class = "Mammalia > Carnivora > Felidae";
      let behavior = "Walking / Patrol";
      let count = 1;
      let box = [120, 80, 410, 380];
      let health_index = 9.2;
      let threat_level = "None";
      let threat_details = "";

      if (fileName.includes("elephant")) {
        detected = "Asian Elephant (Elephas maximus) [Simulated]";
        confidence = 92.4;
        taxonomic_class = "Mammalia > Proboscidea > Elephantidae";
        behavior = "Feeding";
        count = 2;
        box = [45, 120, 520, 480];
        health_index = 8.5;
      } else if (fileName.includes("leopard")) {
        detected = "Indian Leopard (Panthera pardus) [Simulated]";
        confidence = 89.5;
        taxonomic_class = "Mammalia > Carnivora > Felidae";
        behavior = "Climbing Tree";
        count = 1;
        box = [80, 100, 420, 440];
        health_index = 8.4;
      } else if (fileName.includes("poacher") || fileName.includes("human") || fileName.includes("person")) {
        detected = "Human (Unauthorized / Poacher) [Simulated]";
        confidence = 99.1;
        taxonomic_class = "Mammalia > Primates > Hominidae";
        behavior = "Intrusion / Trespassing";
        count = 1;
        box = [150, 60, 380, 480];
        health_index = 2.0;
        threat_level = "Critical";
        threat_details = "Unauthorized human presence detected in reserve sector. Potential poaching risk.";
      } else if (fileName.includes("bear")) {
        detected = "Himalayan Brown Bear (Ursus arctos) [Simulated]";
        confidence = 85.0;
        taxonomic_class = "Mammalia > Carnivora > Ursidae";
        behavior = "Foraging";
        count = 1;
        box = [90, 110, 460, 450];
        health_index = 7.5;
        threat_level = "Medium";
        threat_details = "Predator activity detected near sensor node.";
      }

      const result = {
        detected,
        confidence,
        taxonomic_class,
        behavior,
        count,
        box,
        health_index,
        threat_level,
        threat_details,
      };

      setAnalysisResult({
        ...result,
        health_index: `${result.health_index}/10`,
        alerts: result.threat_level === "None" ? "None" : result.threat_details
      });
    } finally {
      if (!isAsyncStarted) {
        setIsAnalyzing(false);
      }
    }
  };

  if (!isMounted || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        Authenticating session...
      </div>
    );
  }

  // --- DYNAMIC KPI COMPUTATIONS ---
  const currentSite = sites.find(s => s.id === selectedSiteId);
  const activeLogs = healthLogs.length > 0 ? healthLogs[0] : null;

  const displayHealthScore = isDemo 
    ? "8.42 / 10" 
    : activeLogs 
      ? `${activeLogs.overall_health_score} / 10`
      : "Not Calibrated";

  const displayCameraTrapsCount = isDemo
    ? "48 Active"
    : `${devices.filter(d => d.device_type === "Camera Trap").length} Deployed`;

  const displayAudioSensorsCount = isDemo
    ? "14,240 events"
    : `${devices.filter(d => d.device_type === "Audio Sensor").length} Deployed`;

  const displayEndangeredCount = isDemo
    ? "18 Specimens"
    : `${observations.filter(obs => ["Bengal Tiger (Panthera tigris)", "Asian Elephant (Elephas maximus)", "Indian Leopard (Panthera pardus)"].includes(obs.detected_species)).length} Sightings`;

  // --- DYNAMIC CHART MAPPINGS ---
  // Fallback to static mock charts if database is empty / in Demo Mode
  const finalPopulationData = isDemo || observations.length === 0 
    ? mockPopulationData 
    : observations.slice(0, 10).map((obs, idx) => ({
        month: new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        BengalTiger: obs.detected_species.includes("Tiger") ? obs.count : 0,
        AsianElephant: obs.detected_species.includes("Elephant") ? obs.count : 0,
        IndianLeopard: obs.detected_species.includes("Leopard") ? obs.count : 0,
      })).reverse();

  const finalSpeciesDistribution = isDemo || observations.length === 0
    ? mockSpeciesDistribution
    : Object.entries(
        observations.reduce((acc: any, curr) => {
          const parts = curr.taxonomic_class ? curr.taxonomic_class.split(">") : [];
          const displayName = parts.length > 2 
            ? parts[2].trim() 
            : parts.length > 0 
              ? parts[0].trim() 
              : "Mammalia";
          acc[displayName] = (acc[displayName] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, val]: any, idx) => ({
        name,
        value: val,
        color: ["#10b981", "#14b8a6", "#3b82f6", "#8b5cf6"][idx % 4]
      }));

  const finalAlertData = isDemo || observations.length === 0
    ? mockAlertData
    : observations.slice(0, 7).map((obs, idx) => ({
        name: new Date(obs.timestamp).toLocaleDateString([], { weekday: 'short' }),
        PoachingAlerts: obs.threat_level === "Critical" ? 1 : 0,
        IntrusionAlerts: obs.threat_level === "High" ? 1 : 0,
        FireRisk: obs.threat_level === "Medium" ? 1 : 0,
      }));

  return (
    <div className={`flex min-h-screen bg-slate-950 text-slate-100 flex-col md:flex-row transition-colors duration-300`}>
      {/* Dynamic Theme Styles Override */}
      <style>{`
        main { background-color: ${isLight ? '#f8fafc' : '#020617'} !important; }
        aside { background-color: ${isLight ? '#f1f5f9' : '#020617'} !important; }
        .bg-slate-950 { background-color: ${isLight ? '#f8fafc' : '#020617'} !important; }
        .bg-slate-950\\/80 { background-color: ${isLight ? '#f1f5f9' : 'rgba(2, 6, 23, 0.8)'} !important; }
        .bg-slate-950\\/20 { background-color: ${isLight ? '#f1f5f9' : 'rgba(2, 6, 23, 0.2)'} !important; }
        .bg-slate-900\\/60 { background-color: ${isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)'} !important; }
        .bg-slate-900\\/30 { background-color: ${isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.3)'} !important; }
        .bg-slate-900\\/40 { background-color: ${isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.4)'} !important; }
        .bg-slate-900 { background-color: ${isLight ? '#ffffff' : '#0f172a'} !important; }
        .bg-slate-950\\/40 { background-color: ${isLight ? '#f1f5f9' : 'rgba(2, 6, 23, 0.4)'} !important; }
        .bg-slate-950\\/60 { background-color: ${isLight ? '#f1f5f9' : 'rgba(2, 6, 23, 0.6)'} !important; }
        .border-slate-900 { border-color: ${isLight ? '#e2e8f0' : '#0f172a'} !important; }
        .border-slate-900\\/60 { border-color: ${isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.6)'} !important; }
        .border-slate-800 { border-color: ${isLight ? '#cbd5e1' : '#1e293b'} !important; }
        .text-slate-100 { color: ${isLight ? '#0f172a' : '#f1f5f9'} !important; }
        .text-slate-200 { color: ${isLight ? '#1e293b' : '#e2e8f0'} !important; }
        .text-slate-300 { color: ${isLight ? '#334155' : '#cbd5e1'} !important; }
        .text-slate-400 { color: ${isLight ? '#475569' : '#94a3b8'} !important; }
        .text-slate-500 { color: ${isLight ? '#64748b' : '#64748b'} !important; }
        .divide-slate-900 > * + * { border-color: ${isLight ? '#e2e8f0' : '#0f172a'} !important; }
        .divide-y { border-color: ${isLight ? '#e2e8f0' : '#0f172a'} !important; }
        .hover\\:bg-slate-900\\/10:hover { background-color: ${isLight ? 'rgba(226, 232, 240, 0.5)' : 'rgba(15, 23, 42, 0.1)'} !important; }
        .hover\\:bg-slate-900\\/50:hover { background-color: ${isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.5)'} !important; }
        .text-emerald-400 { color: ${isLight ? '#059669' : '#34d399'} !important; }
        .text-teal-400 { color: ${isLight ? '#0d9488' : '#2dd4bf'} !important; }
        .text-blue-400 { color: ${isLight ? '#2563eb' : '#60a5fa'} !important; }
        .text-indigo-400 { color: ${isLight ? '#4f46e5' : '#818cf8'} !important; }
        .text-amber-500 { color: ${isLight ? '#d97706' : '#f59e0b'} !important; }
      `}</style>
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-slate-900 bg-slate-950/80 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
              W
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Wildlife Portal
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Console</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Activity className="h-4 w-4" />
              Intelligence Overview
            </button>

            {userRole === "Administrator" && (
              <button
                onClick={() => setActiveTab("ai-inference")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "ai-inference"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                <Eye className="h-4 w-4" />
                AI Inference Hub
              </button>
            )}

            {(userRole === "Administrator" || userRole === "Conservation Officer" || userRole === "Forest Department Officer") && (
              <button
                onClick={() => setActiveTab("gis-map")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "gis-map"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                <MapPin className="h-4 w-4" />
                GIS Map Layers
              </button>
            )}

            {(userRole === "Administrator" || userRole === "Conservation Officer") && (
              <button
                onClick={() => setActiveTab("recommendations")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "recommendations"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                <Compass className="h-4 w-4" />
                AI Recommendations
              </button>
            )}

          </div>
        </div>

        {/* User Footer Profile */}
        <div className="border-t border-slate-900 pt-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user.first_name || "Guest"} {user.last_name || "User"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl">
        
        {/* Real Backend DB Seeding Banner */}
        {!isDemo && userRole === "Administrator" && sites.length === 0 && !isLoading && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-950 border border-emerald-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl shadow-emerald-500/5 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Seeding Recommended
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                The database is connected but contains no wildlife data. Seed it with sample monitoring reserves (Zone-C, West Wetlands), active devices, and historical sightings.
              </p>
            </div>
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all shrink-0 hover:shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSeeding ? "animate-spin" : ""}`} />
              {isSeeding ? "Seeding..." : "Seed Database"}
            </button>
          </div>
        )}

        {/* Top Header info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Population Intelligence Console</h1>
            <p className="text-sm text-slate-400 mt-1">
              Active Scope: <span className="text-slate-200 font-semibold">{user.role} Privilege Level</span>
              {isDemo && <span className="text-emerald-400 font-semibold ml-2">(Demo Sandbox Active)</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center shadow-md"
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-400" />
              )}
            </button>
            {/* Database Site Selector Dropdown */}
            {!isDemo && sites.length > 0 && (
              <div className="relative">
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl focus:border-emerald-500 focus:outline-none transition-all appearance-none cursor-pointer pr-10"
                >
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <MapPin className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Geo-Inference Nodes Active
            </span>

            {/* Notification Bell Icon & Dropdown Panel (Only visible to Admin & Officers) */}
            {(userRole === "Administrator" || userRole === "Conservation Officer") && (
              <div className="relative">
                <button
                  onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                  className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer hover:bg-slate-850"
                >
                  <Bell className="h-4 w-4" />
                  {alerts.filter(a => !a.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-slate-950 animate-bounce">
                      {alerts.filter(a => !a.is_read).length}
                    </span>
                  )}
                </button>

                {isAlertsOpen && (
                  <div className="absolute right-0 mt-3 w-80 p-4 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md z-50 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Warnings ({alerts.filter(a => !a.is_read).length})</span>
                      {alerts.filter(a => !a.is_read).length > 0 && (
                        <button
                          onClick={handleDismissAllAlerts}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-all cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                      {alerts.length > 0 ? (
                        alerts.map(a => (
                          <div
                            key={a.id}
                            className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all relative group ${
                              a.is_read 
                                ? "bg-slate-950/20 border-slate-950 text-slate-500" 
                                : a.severity === "Critical" 
                                  ? "bg-rose-500/5 border-rose-500/20 text-slate-300"
                                  : "bg-amber-500/5 border-amber-500/20 text-slate-300"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className={`font-bold ${a.severity === "Critical" ? "text-rose-400" : "text-amber-400"}`}>
                                {a.title}
                              </span>
                              {!a.is_read && (
                                <button
                                  onClick={() => handleDismissAlert(a.id)}
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-all shrink-0 cursor-pointer"
                                >
                                  Dismiss
                                </button>
                              )}
                            </div>
                            <p>{a.message}</p>
                            <span className="text-[9px] text-slate-500 block mt-1.5 font-mono">
                              {new Date(a.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-4 italic">No warning alerts active.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Site Details Card */}
        {currentSite && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 text-xs text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-slate-200 uppercase tracking-wider block mb-0.5">Location Bio</span>
              <p>{currentSite.description} ({currentSite.habitat_type} habitat, {currentSite.is_protected_area ? "Designated Protected Reserve" : "Public/Buffer Land"})</p>
            </div>
            {selectedSiteId !== "all" && userRole === "Administrator" && (
              <button
                onClick={handleRecalculateHealth}
                disabled={isRecalculating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isRecalculating ? "animate-spin" : ""}`} />
                Recalculate Health
              </button>
            )}
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-900 glow-emerald flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ecosystem Health</span>
                  <Award className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold">{displayHealthScore}</h3>
                  <p className="text-xs text-emerald-400 mt-1 font-medium">Weighted index calculation</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-900 glow-blue flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Camera Traps</span>
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold">{displayCameraTrapsCount}</h3>
                  <p className="text-xs text-slate-400 mt-1">Deploy stations plotting geolocations</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-900 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audio Captures</span>
                  <Volume2 className="h-5 w-5 text-teal-400" />
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold">{displayAudioSensorsCount}</h3>
                  <p className="text-xs text-slate-400 mt-1">Acoustic sensors active</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-900 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Endangered Sightings</span>
                  <AlertOctagon className="h-5 w-5 text-amber-500" />
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold">{displayEndangeredCount}</h3>
                  <p className="text-xs text-amber-400 mt-1 font-medium">Verified by YOLOv8 pipeline</p>
                </div>
              </div>
            </div>

            {/* Health logs breakdown (PostgreSQL dynamic health scores) */}
            {!isDemo && healthLogs.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-emerald-400" />
                  Ecosystem Health Factor Weighting Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Biodiversity (30%)</span>
                    <span className="text-lg font-bold text-emerald-400">{activeLogs?.biodiversity_score} / 10</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Stability (25%)</span>
                    <span className="text-lg font-bold text-teal-400">{activeLogs?.population_stability_score} / 10</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Habitat Quality (20%)</span>
                    <span className="text-lg font-bold text-blue-400">{activeLogs?.habitat_quality_score} / 10</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Endangered Status (15%)</span>
                    <span className="text-lg font-bold text-indigo-400">{activeLogs?.endangered_species_status_score} / 10</span>
                  </div>
                  <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Environment (10%)</span>
                    <span className="text-lg font-bold text-amber-500">{activeLogs?.environmental_conditions_score} / 10</span>
                  </div>
                </div>
              </div>
            )}

            {/* Protected Area Monitoring HUD: Habitat Suitability Index (HSI) & NDVI */}
            {suitabilityData && (
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900/60 shadow-xl backdrop-blur-md">
                <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                  
                  {/* Left: circular gauge simulation */}
                  <div className="flex flex-col items-center justify-center text-center shrink-0 p-4 bg-slate-950/40 border border-slate-900/80 rounded-2xl w-full lg:w-56">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mb-3">Habitat Suitability</span>
                    <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-slate-800">
                      <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${
                        suitabilityData.status_color === "positive" 
                          ? "border-emerald-500" 
                          : suitabilityData.status_color === "stable"
                            ? "border-blue-400"
                            : "border-rose-500"
                      } animate-pulse`} />
                      <div className="text-center z-10">
                        <span className="text-3xl font-black text-slate-100">{suitabilityData.hsi_score}</span>
                        <span className="block text-[10px] text-slate-500 font-bold mt-0.5">/ 10 INDEX</span>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold mt-4 uppercase border ${
                      suitabilityData.status_color === "positive"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : suitabilityData.status_color === "stable"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {suitabilityData.assessment}
                    </span>
                  </div>

                  {/* Right: Dynamic Sub-Index Bars */}
                  <div className="flex-1 space-y-5 w-full">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Protected Area Suitability Diagnostics</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Geometric calculation combining remote-sensing canopy cover, distance to water body, and tactical alerts.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Bar 1: NDVI */}
                      <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <TreePine className="h-3.5 w-3.5 text-emerald-400" />
                            NDVI Canopy Density
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">{(suitabilityData.ndvi * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${suitabilityData.ndvi * 100}%` }} />
                        </div>
                      </div>

                      {/* Bar 2: Water Proximity */}
                      <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <Compass className="h-3.5 w-3.5 text-blue-400" />
                            Water Resource Index
                          </span>
                          <span className="font-mono text-blue-400 font-bold">{(suitabilityData.water_proximity * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${suitabilityData.water_proximity * 100}%` }} />
                        </div>
                      </div>

                      {/* Bar 3: Disturbance Index */}
                      <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium flex items-center gap-1.5">
                            <AlertOctagon className="h-3.5 w-3.5 text-amber-500" />
                            Human Disturbance
                          </span>
                          <span className={`font-mono font-bold ${
                            suitabilityData.disturbance > 0.3 ? "text-rose-400" : "text-slate-400"
                          }`}>{Math.round(suitabilityData.disturbance * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            suitabilityData.disturbance > 0.3 ? "bg-rose-500" : "bg-slate-700"
                          }`} style={{ width: `${suitabilityData.disturbance * 100}%` }} />
                        </div>
                      </div>

                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/20 border border-slate-900/80 text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block">Strategic Patrol Recommendation</span>
                      <p className="text-slate-300 mt-1">{suitabilityData.recommendation}</p>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Export Intelligence Reports Section */}
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  Reserve Intelligence Exports
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Compile and download structured telemetry observations, database hardware logs, and tactical patrol directives for this reserve.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={() => handleExportReport("pdf")}
                  className="flex-1 md:flex-none px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
                >
                  Export PDF Report
                </button>
                <button
                  onClick={() => handleExportReport("excel")}
                  className="flex-1 md:flex-none px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
                >
                  Export Excel Sheet
                </button>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Species Trends Line Chart */}
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 lg:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        AI Population Forecasting (Linear Fit)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Solid line represents actual census counts. Dashed represents 3-month predictive projections.
                      </p>
                    </div>
                    {trendMetrics && (
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          trendMetrics.indicator === "positive" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : trendMetrics.indicator === "negative"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-slate-500/10 text-slate-400 border border-slate-800"
                        }`}>
                          {trendMetrics.growth_rate_pct >= 0 ? "+" : ""}{trendMetrics.growth_rate_pct.toFixed(1)}% / month
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-1 font-medium">{trendMetrics.assessment}</span>
                      </div>
                    )}
                  </div>

                  <div className="h-80 w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={forecastData}>
                        <defs>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} 
                          labelStyle={{ color: "#94a3b8" }}
                          itemStyle={{ fontSize: 12 }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="plainline" />
                        
                        {/* Shaded Confidence Intervals */}
                        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#colorForecast)" fillOpacity={1} name="95% Confidence Bounds" />
                        <Area type="monotone" dataKey="lower" stroke="none" fill="#0b0f19" fillOpacity={1} name="Lower Bound Shading" legendType="none" />

                        {/* Historical Actual Observations */}
                        <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} name="Historical Sightings" connectNulls />
                        
                        {/* Predictive Projections */}
                        <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }} name="AI Projected Count" connectNulls />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Taxonomic Pie Chart */}
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900">
                <h3 className="text-base font-bold mb-6">Taxonomic Class Distribution</h3>
                <div className="h-60 w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalSpeciesDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {finalSpeciesDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {finalSpeciesDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-400">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Bars Chart */}
              <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 lg:col-span-3">
                <h3 className="text-base font-bold mb-6">Acoustic & Vision Threat Indicators</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={finalAlertData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Legend />
                      <Bar dataKey="PoachingAlerts" fill="#f43f5e" name="Gunshot Alerts (Audio)" />
                      <Bar dataKey="IntrusionAlerts" fill="#e11d48" name="Unauthorized Intrusions" />
                      <Bar dataKey="FireRisk" fill="#f59e0b" name="Thermal / Smoke Alert" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Recent Telemetry Sightings Table */}
            <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold">Recent Telemetry Sightings</h3>
                  <p className="text-xs text-slate-400 mt-1">Live feed of enriched classifications fetched from GBIF registry.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Species</th>
                      <th className="pb-3">Taxonomy (GBIF)</th>
                      <th className="pb-3">Confidence</th>
                      <th className="pb-3">Threat Assessment</th>
                      <th className="pb-3">IUCN status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {!isDemo && observations.length > 0 ? (
                      observations.slice(0, 10).map((obs) => {
                        const iucnMatch = obs.threat_details?.match(/\[IUCN:\s*([A-Z]+)\]/);
                        const iucnCode = iucnMatch ? iucnMatch[1] : null;
                        
                        let iucnLabel = "Data Deficient (DD)";
                        let iucnColor = "bg-slate-800/40 text-slate-400 border border-slate-800";
                        
                        if (iucnCode === "EN") {
                          iucnLabel = "Endangered (EN)";
                          iucnColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                        } else if (iucnCode === "VU") {
                          iucnLabel = "Vulnerable (VU)";
                          iucnColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                        } else if (iucnCode === "LC") {
                          iucnLabel = "Least Concern (LC)";
                          iucnColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                        } else if (iucnCode === "CR") {
                          iucnLabel = "Critical Alert (CR)";
                          iucnColor = "bg-rose-600/20 text-rose-300 border border-rose-500/30";
                        }

                        const cleanThreatDetails = obs.threat_details ? obs.threat_details.replace(/\[IUCN:\s*[A-Z]+\]\s*/, "") : "Sighting recorded.";

                        return (
                          <tr key={obs.id} className="hover:bg-slate-900/10 transition-colors">
                            <td className="py-3.5 font-mono text-[10px] text-slate-500">
                              {new Date(obs.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3.5 font-bold text-slate-200">
                              {obs.detected_species}
                            </td>
                            <td className="py-3.5 text-slate-400 font-mono text-[10px]">
                              {obs.taxonomic_class || "Mammalia"}
                            </td>
                            <td className="py-3.5 font-semibold text-slate-300">
                              {obs.confidence.toFixed(1)}%
                            </td>
                            <td className="py-3.5">
                              <span className={`font-semibold ${
                                obs.threat_level === "Critical" 
                                  ? "text-rose-400" 
                                  : obs.threat_level === "High" 
                                    ? "text-rose-400/80" 
                                    : obs.threat_level === "Medium"
                                      ? "text-amber-400"
                                      : "text-slate-400"
                              }`}>
                                {obs.threat_level}: {cleanThreatDetails}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${iucnColor}`}>
                                {iucnLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <>
                        <tr className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 font-mono text-[10px] text-slate-500">2026-07-07 12:00</td>
                          <td className="py-3.5 font-bold text-slate-200">Bengal Tiger</td>
                          <td className="py-3.5 text-slate-400 font-mono text-[10px]">Mammalia &gt; Carnivora &gt; Felidae</td>
                          <td className="py-3.5 font-semibold text-slate-300">96.8%</td>
                          <td className="py-3.5 text-slate-400">None: Sighting recorded.</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Endangered (EN)
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-3.5 font-mono text-[10px] text-slate-500">2026-07-07 11:30</td>
                          <td className="py-3.5 font-bold text-slate-200">Asian Elephant</td>
                          <td className="py-3.5 text-slate-400 font-mono text-[10px]">Mammalia &gt; Proboscidea &gt; Elephantidae</td>
                          <td className="py-3.5 font-semibold text-slate-300">92.4%</td>
                          <td className="py-3.5 text-slate-400">None: Sighting recorded.</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Endangered (EN)
                            </span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AI INFERENCE MODULE */}
        {activeTab === "ai-inference" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 max-w-4xl">
              <h2 className="text-xl font-bold mb-2">Species Detection Pipeline</h2>
              <p className="text-sm text-slate-400 mb-6">
                Upload raw camera trap photos to analyze with YOLOv8. The pipeline counts individuals, highlights bounding areas, and predicts biological activity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Upload Section */}
                <div className="space-y-4">
                  {/* Real Device Link for Ingestion */}
                  {!isDemo && devices.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Originating Telemetry Node</label>
                      <select
                        value={selectedDeviceForInference}
                        onChange={(e) => setSelectedDeviceForInference(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
                      >
                        {devices.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.device_type})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-slate-950/40 min-h-64 relative">
                    {previewUrl ? (
                      selectedFile && (selectedFile.type.startsWith("audio/") || selectedFile.name.toLowerCase().endsWith(".wav") || selectedFile.name.toLowerCase().endsWith(".mp3")) ? (
                        <div className="w-full text-center space-y-4 px-4 z-10">
                          <Volume2 className="h-12 w-12 text-teal-400 mx-auto animate-pulse" />
                          <p className="text-xs text-slate-300 truncate max-w-full font-medium">{selectedFile.name}</p>
                          <audio src={previewUrl} controls className="w-full mx-auto" />
                        </div>
                      ) : (
                        <img src={previewUrl} alt="Preview" className="max-h-56 object-contain rounded-lg" />
                      )
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="h-10 w-10 text-slate-600 mx-auto" />
                        <p className="text-sm font-semibold">Select Camera Capture</p>
                        <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, or MP3 (Acoustics)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*,audio/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </div>

                  {selectedFile && (
                    <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 px-4 py-2.5 rounded-lg">
                      <span className="truncate max-w-xs">{selectedFile.name}</span>
                      <button
                        onClick={runSimulatedInference}
                        disabled={isAnalyzing}
                        className="px-4 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzing ? "Processing..." : "Process AI"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Analysis results */}
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-900 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Pipeline Outputs</h3>
                    {isAnalyzing ? (
                      <div className="space-y-4">
                        <div className="h-4 bg-slate-900 rounded animate-pulse w-3/4"></div>
                        <div className="h-4 bg-slate-900 rounded animate-pulse w-1/2"></div>
                        <div className="h-4 bg-slate-900 rounded animate-pulse w-5/6"></div>
                      </div>
                    ) : analysisResult ? (
                      <div className="space-y-3.5 text-sm">
                        <div>
                          <span className="text-xs text-slate-500 block">Classified Specimen:</span>
                          <span className="font-bold text-emerald-400">{analysisResult.detected}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-slate-500 block">Model Confidence:</span>
                            <span className="font-semibold">{analysisResult.confidence}%</span>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 block">Count:</span>
                            <span className="font-semibold">{analysisResult.count} individual</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Identified Action:</span>
                          <span className="font-semibold text-slate-300">{analysisResult.behavior}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 block">Wildlife Health Assessment:</span>
                          <span className="font-semibold text-emerald-400">{analysisResult.health_index}</span>
                        </div>
                        {!isDemo && (
                          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4" />
                            Observation written to database logs.
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 italic">Upload an environmental file and run inference to see telemetry diagnostics.</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                    Model Registry: {selectedFile && (selectedFile.type.startsWith("audio/") || selectedFile.name.toLowerCase().endsWith(".wav") || selectedFile.name.toLowerCase().endsWith(".mp3")) ? "BirdNET-v2.2-species.onnx" : "YOLOv8x-wildlife-v3.onnx"}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GIS SPATIAL MAPS */}
        {activeTab === "gis-map" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">GIS Spatial Ingestion</h2>
                  <p className="text-sm text-slate-400 mt-1">Real-time coordinates plotting and boundary layers.</p>
                </div>
              </div>

              {/* Map canvas container */}
              {/* Map canvas container */}
              <div className="relative w-full h-[500px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden z-0">
                <InteractiveMap 
                  sites={sites} 
                  selectedSiteId={selectedSiteId} 
                  devices={devices} 
                  theme={theme}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONSERVATION RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 max-w-4xl">
              <h2 className="text-xl font-bold mb-2">Conservation Policy & Decision Support</h2>
              <p className="text-sm text-slate-400 mb-6">
                Our recommendation engine uses biodiversity index declines, habitat health metrics, and threat alerts to auto-generate prioritizations for forest department patrols.
              </p>

              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map(rec => (
                    <div key={rec.id} className="p-5 rounded-xl bg-slate-950 border border-slate-900 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-lg shrink-0 ${
                          rec.priority === "Critical"
                            ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                            : rec.priority === "Medium"
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        }`}>
                          {rec.priority === "Critical" ? <AlertOctagon className="h-5 w-5" /> : rec.priority === "Medium" ? <TreePine className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-200">{rec.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              rec.priority === "Critical"
                                ? "bg-rose-500/15 border border-rose-500/20 text-rose-400"
                                : rec.priority === "Medium"
                                  ? "bg-amber-500/15 border border-amber-500/20 text-amber-400"
                                  : "bg-emerald-500/15 border border-emerald-500/20 text-emerald-400"
                            }`}>{rec.priority} Priority</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResolveRecommendation(rec.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap"
                      >
                        Resolve Patrol
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm italic">No open recommendations/directives for patrol re-routing currently active.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {toast && (
        <>
          <style>{`
            @keyframes slideInUp {
              from { transform: translateY(100%) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>
          <div 
            className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-950/95 border border-slate-900 shadow-2xl flex items-center gap-3"
            style={{ 
              minWidth: "280px", 
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              animation: "slideInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            <div className={`h-2 w-2 rounded-full shrink-0 ${
              toast.type === "success" 
                ? "bg-emerald-400 animate-pulse" 
                : toast.type === "error" 
                  ? "bg-rose-500" 
                  : "bg-blue-400"
            }`} />
            <p className="text-xs font-semibold text-slate-200">{toast.message}</p>
          </div>
        </>
      )}
    </div>
  );
}
