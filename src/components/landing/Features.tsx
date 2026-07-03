"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  BarChart3, 
  Target, 
  Flame, 
  Heart, 
  BrainCircuit, 
  WifiOff, 
  CloudLightning 
} from "lucide-react";

const features = [
  { 
    title: "Personal Library", 
    desc: "Aesthetic glassmorphic database listing all your physical and digital books with custom filters.",
    icon: BookOpen, 
    color: "text-blue-400", 
    border: "hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
  },
  { 
    title: "Reading Analytics", 
    desc: "Calculate read duration and average reading speeds. Analyze weekly pages charts via Recharts.",
    icon: BarChart3, 
    color: "text-cyan-400", 
    border: "hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
  },
  { 
    title: "Reading Goals", 
    desc: "Set annual books and daily page counts. Watch vector SVG progress rings fill dynamically.",
    icon: Target, 
    color: "text-indigo-400", 
    border: "hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]"
  },
  { 
    title: "Reading Streaks", 
    desc: "Achieve badges and lock milestones. Display active burning flame indicators on daily sessions.",
    icon: Flame, 
    color: "text-pink-500", 
    border: "hover:border-pink-500/40 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]"
  },
  { 
    title: "Smart Wishlist", 
    desc: "Add pending items, log cost parameters, store links, and move to libraries automatically.",
    icon: Heart, 
    color: "text-purple-400", 
    border: "hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
  },
  { 
    title: "AI Ready", 
    desc: "Built to translate pages logged into knowledge maps and summary reports natively in later cores.",
    icon: BrainCircuit, 
    color: "text-teal-400", 
    border: "hover:border-teal-500/40 hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]"
  },
  { 
    title: "Offline Sandbox", 
    desc: "Zero requirements. Enter sandbox mode instantly, saving all book states in local storage queues.",
    icon: WifiOff, 
    color: "text-amber-500", 
    border: "hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
  },
  { 
    title: "Cloud Syncing", 
    desc: "Establish a secure user profile and sync local databases with Supabase Cloud Postgres seamlessly.",
    icon: CloudLightning, 
    color: "text-emerald-400", 
    border: "hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
  }
];

export const Features: React.FC = () => {
  return (
    <section className="w-full py-28 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Title Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2 text-left">
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold">[ 01 / FEATURES ]</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase font-mono">System Capabilities</h2>
          </div>
          <p className="text-slate-400 text-xs font-mono max-w-sm leading-relaxed uppercase tracking-wider text-left">
            BookVault provides full control over your library indexing, reading sessions, and database states.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className={`p-6 border border-white/5 bg-black/40 backdrop-blur-md flex flex-col justify-between h-64 transition-all duration-300 ${feat.border}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">F-0{idx + 1}</span>
                <feat.icon className={`h-6 w-6 ${feat.color}`} />
              </div>

              <div className="space-y-2 text-left">
                <h3 className="font-mono text-sm uppercase text-white tracking-wider leading-snug">{feat.title}</h3>
                <p className="text-[10px] text-slate-450 leading-relaxed font-mono uppercase tracking-wider">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
