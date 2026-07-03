"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layers, Activity, Calendar, LayoutGrid, Sparkles } from "lucide-react";

export const DashboardShowcase: React.FC = () => {
  return (
    <section className="w-full py-28 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Title Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2 text-left">
            <span className="font-mono text-xs text-purple-400 uppercase tracking-widest font-semibold">[ 02 / SHOWCASE ]</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase font-mono">Workspace Interface</h2>
          </div>
          <p className="text-slate-400 text-xs font-mono max-w-sm leading-relaxed uppercase tracking-wider text-left">
            An elegant dashboard previewing your current streaks, finished tallies, monthly targets, and daily progress.
          </p>
        </div>

        {/* Large Dashboard Mockup Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full border border-white/10 bg-black/60 backdrop-blur-xl p-4 sm:p-6 rounded-none shadow-[0_0_80px_rgba(139,92,246,0.06)] overflow-hidden"
        >
          {/* macOS Browser Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="bg-white/5 px-6 py-1 rounded-md text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              localhost:3000 / dashboard
            </div>
            <div className="w-10 h-3" /> {/* Balance spacer */}
          </div>

          {/* Grid Layout Mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-left">
            
            {/* Sidebar Mock */}
            <div className="lg:col-span-3 space-y-6 hidden lg:block border-r border-white/10 pr-6">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-white flex items-center justify-center">
                  <BookOpen className="h-3.5 w-3.5 text-black" />
                </div>
                <span className="font-bold text-xs text-white">BOOKVAULT</span>
              </div>

              <div className="space-y-1.5 text-[10px] text-slate-450 uppercase tracking-wider">
                {["Dashboard", "Library Catalog", "My Wishlist", "Reading History", "Heatmap Calendar", "Analytics Stats"].map((item, idx) => (
                  <div 
                    key={item} 
                    className={`p-2.5 flex items-center gap-2 cursor-pointer ${idx === 0 ? "bg-white/5 text-white border-l-2 border-cyan-400" : "hover:bg-white/5 hover:text-white"}`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-slate-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Mock */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Active Streak", val: "5 Days", color: "text-pink-500" },
                  { label: "Pages Logged", val: "1,240 pg", color: "text-cyan-400" },
                  { label: "Completed Books", val: "12 Books", color: "text-blue-400" },
                  { label: "Current Speed", val: "1.4 PPM", color: "text-purple-400" },
                ].map((card) => (
                  <div key={card.label} className="p-4 border border-white/5 bg-white/5 rounded-none space-y-1">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest block">{card.label}</span>
                    <span className={`text-base font-bold uppercase ${card.color}`}>{card.val}</span>
                  </div>
                ))}
              </div>

              {/* Chart Mock & Goals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Visual Chart Placeholder */}
                <div className="md:col-span-8 p-6 border border-white/5 bg-white/5 rounded-none flex flex-col justify-between min-h-[220px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-200 uppercase tracking-wider">Reading Frequency (weekly)</span>
                    <span className="text-[9px] text-slate-500">PAGES READ / DAY</span>
                  </div>
                  
                  {/* Fake Bar Chart */}
                  <div className="flex items-end justify-between gap-2 h-28 pt-4">
                    {[35, 60, 45, 80, 50, 75, 95].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-none transition-all duration-500 hover:opacity-85" 
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[8px] text-slate-600">D-0{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress SVG Rings Placeholder */}
                <div className="md:col-span-4 p-6 border border-white/5 bg-white/5 rounded-none flex flex-col items-center justify-center gap-4 text-center min-h-[220px]">
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Daily Page Goal</span>
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    {/* SVG Progress Circle */}
                    <svg className="absolute inset-0 h-full w-full -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="url(#cyanGrad)" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset="62.8" />
                      <defs>
                        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-xs font-black text-cyan-400">75%</span>
                  </div>
                  <span className="text-[9px] text-slate-500">15 / 20 PAGES COMPLETED</span>
                </div>

              </div>

            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
};
import { BookOpen } from "lucide-react";
