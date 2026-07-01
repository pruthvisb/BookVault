"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { setSandboxMode } from "@/utils/db";
import {
  BookOpen,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  Play,
  AlertCircle,
  User,
  Briefcase,
  Calendar,
  ChevronRight,
  TrendingUp,
  Flame,
  Award,
  Heart,
  ArrowRight,
  Shield,
  Smartphone,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Variants } from "framer-motion";

interface AuthPortalProps {
  onAuthSuccess: () => void;
}

const supabase = createClient();

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthSuccess }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Reader");
  const [dob, setDob] = useState("");
  
  // Feedback Messages
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName,
              role: role,
              dob: dob,
            }
          },
        });
        if (error) throw error;
        
        // Save profile metadata locally
        localStorage.setItem("bookvault_profile_name", fullName);
        localStorage.setItem("bookvault_profile_role", role);
        localStorage.setItem("bookvault_profile_dob", dob);

        if (data.user && data.session === null) {
          setInfoMsg("Verification link sent! Check your email to confirm registration.");
          setIsSignUp(false); // Switch to Sign In view
        } else {
          localStorage.setItem("bookvault_session_active", "true");
          setSandboxMode(false);
          onAuthSuccess();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        localStorage.setItem("bookvault_session_active", "true");
        setSandboxMode(false);
        onAuthSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Google Authentication failed.");
      setLoading(false);
    }
  };

  const handleSandboxMode = () => {
    setSandboxMode(true);
    onAuthSuccess();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* 1. Header Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowAuth(false)}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg glow-primary">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">BookVault</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsSignUp(true);
              setShowAuth(true);
            }}
            className="text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer hidden sm:block"
          >
            Register
          </button>
          <button
            onClick={() => {
              setIsSignUp(false);
              setShowAuth(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md glow-primary cursor-pointer"
          >
            Login
          </button>
        </div>
      </header>

      {/* 2. Main content area switcher */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 md:py-16 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            /* --- LANDING VIEW --- */
            <motion.div
              key="landing"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="w-full space-y-24"
            >
              {/* Hero Section & Mockup */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
                {/* Left Column: Hero Text */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  <motion.div
                    variants={itemVariants}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold"
                  >
                    <Flame className="h-4 w-4 fill-indigo-400" />
                    <span>The Notion-meets-Goodreads Personal Workspace</span>
                  </motion.div>

                  <motion.h1
                    variants={itemVariants}
                    className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-2"
                  >
                    Step into your personal <br />
                    <span className="text-gradient-primary">literary sanctuary.</span>
                  </motion.h1>

                  <motion.p
                    variants={itemVariants}
                    className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                  >
                    BookVault is a premium tracker for your reading life. Set daily page goals, track library catalogs, analyze speeds, view heatmaps, and unlock achievements. All stored securely in the cloud, or locally offline.
                  </motion.p>

                  <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4"
                  >
                    <button
                      onClick={() => {
                        setIsSignUp(true);
                        setShowAuth(true);
                      }}
                      className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg glow-primary cursor-pointer"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={handleSandboxMode}
                      className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>Try Sandbox Mode</span>
                    </button>
                  </motion.div>
                </div>

                {/* Right Column: Mockup */}
                <div className="lg:col-span-5 w-full">
                  {/* Mockup Preview Card */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-3xl border border-white/10 glass-panel shadow-2xl relative overflow-hidden space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Library Preview</span>
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-14 h-20 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow shrink-0">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="overflow-hidden space-y-1.5 flex-1 py-1">
                        <h4 className="font-extrabold text-white text-xs truncate">Atomic Habits</h4>
                        <p className="text-[10px] text-slate-400 leading-none">James Clear</p>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-indigo-500 h-full w-[65%]" />
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-bold">
                          <span>208 / 320 pages</span>
                          <span>65% completed</span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights mini indicators */}
                    <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-3 text-center">
                      <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Streak</span>
                        <span className="text-sm font-black text-amber-400 mt-0.5 block flex items-center justify-center gap-0.5">
                          <Flame className="h-3 w-3 fill-amber-500" /> 5d
                        </span>
                      </div>
                      <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">PPM speed</span>
                        <span className="text-sm font-black text-indigo-400 mt-0.5 block flex items-center justify-center gap-0.5">
                          <TrendingUp className="h-3 w-3" /> 1.8
                        </span>
                      </div>
                      <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Badges</span>
                        <span className="text-sm font-black text-purple-400 mt-0.5 block flex items-center justify-center gap-0.5">
                          <Award className="h-3 w-3" /> 4/8
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Extended Section 1: How it Works Timeline */}
              <div className="space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">How BookVault Works</h2>
                  <p className="text-slate-400 text-sm">
                    A visual workflow designed around your daily reading routine.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  {[
                    {
                      step: "01",
                      title: "Organize your Library",
                      desc: "Import physical books, upload custom covers, choose preset gradients, or track wanted purchases in your smart wishlist.",
                      color: "text-indigo-400 bg-indigo-500/10",
                    },
                    {
                      step: "02",
                      title: "Log Daily Sessions",
                      desc: "Input pages read today, record reading duration, write session notes, and automatically update your page quotients.",
                      color: "text-purple-400 bg-purple-500/10",
                    },
                    {
                      step: "03",
                      title: "Analyze & Earn Badges",
                      desc: "Interact with GitHub-style heatmap calendars, view PPM speeds, and unlock achievement badges as your streaks grow.",
                      color: "text-emerald-400 bg-emerald-500/10",
                    },
                  ].map((step, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      whileHover={{ y: -4 }}
                      className="p-6 rounded-3xl border border-white/5 bg-white/5 relative overflow-hidden space-y-4"
                    >
                      <span className={`inline-flex items-center justify-center h-10 w-10 rounded-xl font-black text-sm ${step.color}`}>
                        {step.step}
                      </span>
                      <h3 className="text-base font-extrabold text-white">{step.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Extended Section 2: Comparison Grid */}
              <div className="space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">Why BookVault?</h2>
                  <p className="text-slate-400 text-sm">
                    How BookVault compares to traditional tracking setups.
                  </p>
                </div>

                <div className="overflow-x-auto glass-panel border border-white/5 rounded-3xl shadow-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-black/30 border-b border-white/5 font-bold uppercase tracking-widest text-[9px] text-slate-400">
                      <tr>
                        <th className="p-4">Feature</th>
                        <th className="p-4 text-indigo-400">BookVault</th>
                        <th className="p-4">Notion</th>
                        <th className="p-4">Goodreads</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-350">
                      {[
                        { name: "Zero-Setup Local Sandbox", bv: true, nt: false, gr: false },
                        { name: "Reading Speed PPM Log", bv: true, nt: false, gr: false },
                        { name: "Heatmap Contribution Grid", bv: true, nt: false, gr: false },
                        { name: "Offline Syncing Support", bv: true, nt: true, gr: false },
                        { name: "Milestone Badges & Streaks", bv: true, nt: false, gr: false },
                        { name: "Clean Glassmorphic Theme", bv: true, nt: true, gr: false },
                      ].map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-semibold text-slate-200">{row.name}</td>
                          <td className="p-4">
                            {row.bv ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" /> : <XCircle className="h-4.5 w-4.5 text-slate-650" />}
                          </td>
                          <td className="p-4">
                            {row.nt ? <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" /> : <XCircle className="h-4.5 w-4.5 text-slate-600" />}
                          </td>
                          <td className="p-4">
                            {row.gr ? <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" /> : <XCircle className="h-4.5 w-4.5 text-slate-600" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Extended Section 3: Gamification Badges Preview */}
              <div className="space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">Gamified Reading Milestones</h2>
                  <p className="text-slate-400 text-sm">
                    Earn badges automatically as you build a consistent reading habit.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Consistent Reader", desc: "Unlock with a 3-day streak.", icon: <Flame className="h-5 w-5 fill-amber-400" />, color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400" },
                    { name: "Speed Demon", desc: "Read at average > 1.5 PPM.", icon: <TrendingUp className="h-5 w-5 text-indigo-450" />, color: "from-indigo-500/10 to-blue-500/10 border-indigo-500/20 text-indigo-400" },
                    { name: "Bookworm I", desc: "Complete your first book.", icon: <Award className="h-5 w-5" />, color: "from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-purple-400" },
                    { name: "Deep Diver", desc: "Complete a 500+ page book.", icon: <Shield className="h-5 w-5" />, color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400" },
                  ].map((badge, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center flex flex-col items-center gap-3 relative"
                    >
                      <div className={`p-3 rounded-full border bg-gradient-to-br ${badge.color}`}>
                        {badge.icon}
                      </div>
                      <h4 className="font-extrabold text-sm text-white">{badge.name}</h4>
                      <p className="text-[10px] text-slate-450">{badge.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Extended Section 4: Mobile PWA support */}
              <motion.div
                variants={itemVariants}
                className="p-8 rounded-3xl border border-white/5 bg-gradient-to-r from-indigo-950/20 to-purple-950/20 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="space-y-3 max-w-xl text-center md:text-left">
                  <div className="inline-flex p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mb-1">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Install BookVault on your phone</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    BookVault is a fully optimized Progressive Web App. Install it directly from your web browser to enjoy offline caching, dashboard access, and seamless synchronization when you reconnect.
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <div className="bg-black/40 border border-white/5 px-4 py-3 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-450 block uppercase">caching</span>
                    <span className="text-xs font-black text-indigo-300 mt-1 block">Full Offline</span>
                  </div>
                  <div className="bg-black/40 border border-white/5 px-4 py-3 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-450 block uppercase">install</span>
                    <span className="text-xs font-black text-purple-300 mt-1 block">PWA Support</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* --- AUTH CARD VIEW --- */
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md p-8 rounded-3xl border border-white/5 glass-panel shadow-2xl relative overflow-hidden"
            >
              {/* Back to Home Button */}
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setInfoMsg(null);
                  setShowAuth(false);
                }}
                className="absolute top-4 left-4 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>

              {/* Logo / Header */}
              <div className="flex flex-col items-center text-center mt-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg glow-primary mb-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {isSignUp ? "Create Vault" : "Welcome Back"}
                </h2>
                <p className="text-slate-450 text-xs mt-1 leading-normal">
                  {isSignUp
                    ? "Enter your reader details to create your secure library."
                    : "Enter your credentials to access your reading tracking workspace."}
                </p>
              </div>

              {/* Message Panels */}
              {errorMsg && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-450 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {/* Form block */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 mb-2"
                  >
                    <div>
                      <label className="text-slate-350 text-xs font-semibold block mb-1.5 pl-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="h-4.5 w-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required={isSignUp}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-355 text-xs font-semibold block mb-1.5 pl-1">
                        Current Role / Occupation
                      </label>
                      <div className="relative">
                        <Briefcase className="h-4.5 w-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all appearance-none"
                        >
                          <option value="Reader" className="bg-slate-900 text-white">Reader</option>
                          <option value="Student" className="bg-slate-900 text-white">Student</option>
                          <option value="Developer" className="bg-slate-900 text-white">Developer</option>
                          <option value="Researcher" className="bg-slate-900 text-white">Researcher</option>
                          <option value="Educator" className="bg-slate-900 text-white">Educator</option>
                          <option value="Other" className="bg-slate-900 text-white">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-355 text-xs font-semibold block mb-1.5 pl-1">
                        Date of Birth (DOB)
                      </label>
                      <div className="relative">
                        <Calendar className="h-4.5 w-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          required={isSignUp}
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="text-slate-350 text-xs font-semibold block mb-1.5 pl-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4.5 w-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="reader@bookvault.app"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-355 text-xs font-semibold block mb-1.5 pl-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4.5 w-4.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all duration-205 cursor-pointer shadow-md glow-primary disabled:opacity-50"
                >
                  {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  <span>{loading ? "Authenticating..." : isSignUp ? "Create Vault" : "Sign In"}</span>
                </button>
              </form>

              {/* Separator */}
              <div className="flex items-center my-5">
                <div className="flex-1 h-px bg-white/5" />
                <span className="px-3 text-slate-500 text-[10px] uppercase font-bold tracking-wider">Or</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 bg-white/5 text-white font-medium text-sm hover:bg-white/10 transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.29 1.945 15.485 1 12.24 1 5.92 1 .8 6.12.8 12.4s5.12 11.4 11.44 11.4c6.6 0 11-4.636 11-11.198 0-.752-.08-1.327-.18-1.917H12.24z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  onClick={handleSandboxMode}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 font-medium text-sm hover:bg-indigo-500/20 transition-all cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-indigo-300" />
                  <span>Use Local Sandbox</span>
                </button>
              </div>

              {/* Toggle Footer */}
              <div className="text-center mt-5">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-t-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 relative z-10">
        <span>© {new Date().getFullYear()} BookVault. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
};
