"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import {
  LogOut,
  User as UserIcon,
  Loader2,
  Video,
  Sparkles,
  Play,
  Download,
  Share2,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ZapIcon,
  Layers,
  Clock,
  Monitor,
  Sun,
  Moon,
  Upload,
  Image as ImageIcon,
  X,
  Smartphone,
  Square,
  Film,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const models = [
  { id: "wan2.2-t2v-14b", name: "Wan 2.2 14B", description: "State-of-the-art detail", speed: "~180s", category: "Text-to-Video" },
  { id: "ltx2-t2v", name: "LTX-2 Video", description: "Excellent motion consistency", speed: "~30s", category: "Text-to-Video" },
  { id: "cogvideox-1.5-5b", name: "CogVideoX 1.5", description: "Creative & diverse motion", speed: "~90s", category: "Text-to-Video" },
  { id: "hunyuan-video-720p", name: "Hunyuan 720p", description: "Cinematic realism", speed: "~120s", category: "Text-to-Video" },
  { id: "wan2.1-i2v-720p", name: "Wan 2.1 I2V 720p", description: "Animate images (High)", speed: "Varies", category: "Image-to-Video" },
  { id: "wan2.2-i2v-14b", name: "Wan 2.2 I2V 14B", description: "Pro-grade animation", speed: "Varies", category: "Image-to-Video" }
];

const socialPresets = [
  { id: "16:9", name: "YouTube", sub: "16:9 Wide", icon: Monitor },
  { id: "9:16", name: "TikTok / Reels", sub: "9:16 Tall", icon: Smartphone },
  { id: "1:1", name: "Instagram", sub: "1:1 Square", icon: Square },
  { id: "21:9", name: "Cinematic", sub: "21:9 Ultra", icon: Film }
];

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"Text-to-Video" | "Image-to-Video">("Text-to-Video");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [showRatioDropdown, setShowRatioDropdown] = useState(false);
  const [duration, setDuration] = useState("5s");
  const [model, setModel] = useState("wan2.2-t2v-14b");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ratioRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch and load saved state
  useEffect(() => {
    setMounted(true);
    const savedTab = localStorage.getItem("packet_activeTab") as "Text-to-Video" | "Image-to-Video" | null;
    if (savedTab === "Text-to-Video" || savedTab === "Image-to-Video") {
      setActiveTab(savedTab);
      const categoryModels = models.filter(m => m.category === savedTab);
      if (categoryModels.length > 0) {
        setModel(categoryModels[0].id);
      }
    }
  }, []);

  const isI2V = activeTab === "Image-to-Video";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      import("@/lib/quota").then(({ getUserQuota }) => {
        getUserQuota(user.uid).then(quota => {
          setCredits(Math.max(0, quota.videosTotal - quota.videosUsed));
        }).catch(err => {
          console.error("Failed to load credits:", err);
          setCredits(100); // UI fallback
        });
      });
    }
  }, [user, loading, router]);

  // Click away listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
      if (ratioRef.current && !ratioRef.current.contains(event.target as Node)) {
        setShowRatioDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505] transition-colors duration-500">
        <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const handleGenerate = async () => {
    if (!prompt) return;
    if (models.find(m => m.id === model)?.category === "Image-to-Video" && !selectedImage) {
      setApiError("Please upload a starting image for Image-to-Video generation.");
      return;
    }

    setIsGenerating(true);
    setGeneratedVideo(null);
    setApiError(null);

    try {
      const { checkQuota, incrementQuota } = await import("@/lib/quota");
      let hasQuota = true;
      try {
        hasQuota = await checkQuota(user.uid);
      } catch (err: any) {
        console.error("Firebase Quota Error:", err);
        setApiError("Database config error: " + (err.message || "Ensure Realtime DB is enabled."));
        setIsGenerating(false);
        return;
      }

      if (!hasQuota) {
        setApiError("You have reached your weekly limit of 100 generated videos. Please upgrade your plan or check back next week.");
        setIsGenerating(false);
        return;
      }

      const { generateVideo } = await import("./actions/generate");
      const result = await generateVideo({
        prompt,
        aspectRatio,
        model,
        duration,
        image: selectedImage || undefined
      });

      if (result.success && result.videoData) {
        setGeneratedVideo(result.videoData);
        try {
          await incrementQuota(user.uid);
          setCredits(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
        } catch (err) {
          console.error("Failed to deduct credit:", err);
        }
      } else {
        setApiError(result.error || "Failed to generate video");
      }
    } catch (error) {
      console.error("Failed to generate video:", error);
      setApiError("An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };



  const toggleDuration = () => {
    const durations = ["5s", "10s"];
    const currentIndex = durations.indexOf(duration);
    setDuration(durations[(currentIndex + 1) % durations.length]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleTabChange = (tab: "Text-to-Video" | "Image-to-Video") => {
    setActiveTab(tab);
    localStorage.setItem("packet_activeTab", tab);
    // Auto-select first model in category
    const categoryModels = models.filter(m => m.category === tab);
    if (categoryModels.length > 0) {
      setModel(categoryModels[0].id);
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-[#080808] text-slate-900 dark:text-slate-200 font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col transition-colors duration-500">
      {/* Background Zen Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/[0.03] dark:bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/[0.03] dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Minimal Top Header */}
      <header className="h-20 px-10 flex items-center justify-between z-50 bg-white/70 dark:bg-[#080808]/40 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex-shrink-0 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col -space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-950 dark:text-white text-lg">VidGen.</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 font-mono">v1.0</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 dark:text-gray-500 tracking-wider">by Bunter Codes</span>
          </div>
        </div>


        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full">
            <ZapIcon className="w-3.5 h-3.5 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-gray-400">
              {credits !== null ? credits : "..."}
            </span>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full transition-all duration-300 hover:bg-white dark:hover:bg-white/10 shadow-sm dark:shadow-none relative overflow-hidden group"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={resolvedTheme}
                  initial={{ y: 20, opacity: 0, rotate: 45 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: -20, opacity: 0, rotate: -45 }}
                  transition={{ duration: 0.2 }}
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>

          {/* Account Menu */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 p-1.5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full transition-all duration-300 shadow-sm"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-blue-500 shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 m-2 text-white" />
                )}
              </div>
              <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 dark:text-gray-500 transition-transform duration-300 mr-1.5", showAccountMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showAccountMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-purple-500/10 overflow-hidden z-50 origin-top-right"
                >
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user?.displayName || "Creator"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">
                      {user?.email || "No email available"}
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => router.push("/plan")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors group"
                    >
                      <CreditCard className="w-4 h-4 text-slate-400 dark:text-gray-500 group-hover:text-purple-500 transition-colors" />
                      View Plan
                      <span className="ml-auto text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">Pro</span>
                    </button>

                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors group"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="flex-1 overflow-hidden flex flex-col px-6 lg:px-10 pb-6 lg:pb-10 pt-4 gap-6">

        {/* Absolute Centered Tabs (Independent of columns) */}
        <div className="flex justify-center z-50">
          <div className="relative inline-flex p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-purple-500/5">
            <div
              className={cn(
                "absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-white/10 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 transition-all duration-300 ease-out",
                activeTab === "Image-to-Video" ? "translate-x-full" : "translate-x-0"
              )}
            />
            <button
              onClick={() => handleTabChange("Text-to-Video")}
              className={cn(
                "relative z-10 px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-colors duration-300 flex items-center gap-2 cursor-pointer",
                activeTab === "Text-to-Video" ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Text to Video
            </button>
            <button
              onClick={() => handleTabChange("Image-to-Video")}
              className={cn(
                "relative z-10 px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-colors duration-300 flex items-center gap-2 cursor-pointer",
                activeTab === "Image-to-Video" ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Image to Video
            </button>
          </div>
        </div>

        {/* Split Pane Content */}
        <div className="flex-1 flex flex-col gap-10 overflow-hidden">
          {/* Main Configuration Area */}
          <div className="flex-1 flex flex-col justify-center space-y-6 z-10 w-full max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Prompt Input */}

              {/* Prompt Input */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-[0.08] dark:opacity-10 group-focus-within:opacity-30 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/10 rounded-3xl p-4 transition-all duration-500 shadow-sm dark:shadow-none flex flex-col h-[420px]">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isI2V ? "Describe how the image should move or animate..." : "A futuristic city in the clouds, golden hour lighting, cinematic drone shot..."}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 focus:ring-offset-0 text-lg p-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-gray-600 flex-1 resize-none scrollbar-hide"
                  />

                  {isI2V && (
                    <div className="px-2 mb-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {!selectedImage ? (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-gray-500"
                        >
                          <Upload className="w-6 h-6" />
                          <span className="text-xs font-bold uppercase tracking-wider">Upload Start Frame</span>
                        </button>
                      ) : (
                        <div className="relative w-full h-32 rounded-2xl overflow-hidden group">
                          <img src={selectedImage} alt="Start frame" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedImage(null)}
                              className="p-2 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-auto">
                    <div className="flex gap-4">
                      <div className="relative" ref={ratioRef}>
                        <ConfigBadge
                          icon={socialPresets.find(p => p.id === aspectRatio)?.icon || Monitor}
                          label={aspectRatio}
                          onClick={() => setShowRatioDropdown(!showRatioDropdown)}
                          active={showRatioDropdown}
                          hasDropdown
                        />
                        <AnimatePresence>
                          {showRatioDropdown && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute bottom-full left-0 mb-4 w-56 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-[60] overflow-hidden"
                            >
                              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1">
                                Platform Presets
                              </div>
                              <div className="grid gap-1">
                                {socialPresets.map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      setAspectRatio(p.id);
                                      setShowRatioDropdown(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left",
                                      aspectRatio === p.id
                                        ? "bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400"
                                    )}
                                  >
                                    <div className={cn(
                                      "p-1.5 rounded-lg border",
                                      aspectRatio === p.id ? "bg-white dark:bg-white/5 border-purple-200 dark:border-purple-600/30" : "bg-slate-50 dark:bg-white/5 border-transparent"
                                    )}>
                                      <p.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <div className="text-[11px] font-bold leading-none">{p.name}</div>
                                      <div className="text-[9px] opacity-60 mt-1 font-mono">{p.sub}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <ConfigBadge icon={Clock} label={duration} onClick={toggleDuration} />

                      <div className="relative" ref={dropdownRef}>
                        <ConfigBadge
                          icon={Sparkles}
                          label={models.find(m => m.id === model)?.name.split(' ')[0] || "Model"}
                          onClick={() => setShowModelDropdown(!showModelDropdown)}
                          active={showModelDropdown}
                          hasDropdown
                        />

                        <AnimatePresence>
                          {showModelDropdown && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute bottom-full left-0 mb-4 w-64 bg-white dark:bg-[#0c0c0c] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-[60] overflow-hidden"
                            >
                              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1">
                                Available Engines
                              </div>
                              <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                                {models.filter(m => m.category === activeTab).map((m) => (
                                  <button
                                    key={m.id}
                                    onClick={() => {
                                      setModel(m.id);
                                      setShowModelDropdown(false);
                                    }}
                                    className={cn(
                                      "w-full flex flex-col items-start p-3 rounded-xl transition-all duration-200 group text-left",
                                      model === m.id
                                        ? "bg-purple-600/10 border border-purple-600/20 dark:bg-purple-600/20 dark:border-purple-600/30"
                                        : "hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent"
                                    )}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className={cn(
                                        "text-xs font-bold",
                                        model === m.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-gray-300"
                                      )}>
                                        {m.name}
                                      </span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-gray-500 font-mono">
                                        {m.speed}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                                      {m.description}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt || isGenerating}
                      className={cn(
                        "h-12 px-6 rounded-2xl font-bold flex items-center gap-2 transition-all duration-300 shadow-lg dark:shadow-xl",
                        prompt && !isGenerating
                          ? "bg-slate-950 text-white dark:bg-white dark:text-black hover:scale-105 active:scale-95"
                          : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-600 cursor-not-allowed border border-slate-200 dark:border-none"
                      )}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Generate</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-gray-600 px-2 font-medium">
                <Layers className="w-3.5 h-3.5" />
                <span>TIP: Use descriptive adjectives for better lighting and texture results.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Video Player Modal */}
      <AnimatePresence>
        {generatedVideo && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header / Top Right Close Button */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={() => setGeneratedVideo(null)}
                  className="w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Area */}
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={generatedVideo}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Bottom Actions Area */}
              <div className="p-6 bg-slate-950 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-white text-center sm:text-left overflow-hidden w-full">
                  <h3 className="font-semibold text-lg truncate">
                    {prompt || "Generated Video"}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Ready for download</p>
                </div>
                <div className="flex shrink-0">
                  <a
                    href={generatedVideo}
                    download="packet_ai_video.mp4"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20"
                  >
                    <Download className="w-5 h-5" />
                    Download Video
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Alert Modal */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-red-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/10 flex flex-col"
            >
              <div className="p-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-12 h-12 shrink-0 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center border border-red-200 dark:border-red-500/20">
                  <X className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {apiError === "Please upload a starting image for Image-to-Video generation." ? "Image Not Attached" : "Internal Error"}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{apiError}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 flex justify-end">
                <button
                  onClick={() => setApiError(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black rounded-xl font-bold transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ConfigBadge({ icon: Icon, label, onClick, active, hasDropdown }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1.5 rounded-xl border",
        active
          ? "border-purple-600/50 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/10"
          : "border-slate-200 dark:border-white/5 text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20"
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", active ? "text-purple-600" : "text-purple-600/70 dark:text-purple-500/70")} />
      <span>{label}</span>
      {hasDropdown && <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", active && "rotate-180")} />}
    </button>
  );
}

function PreviewButton({ icon: Icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white active:scale-90"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

