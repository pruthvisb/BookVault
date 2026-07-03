"use client";

import React from "react";
import { motion } from "framer-motion";
import { DoorOpen, Edit3, Award, LineChart } from "lucide-react";

const steps = [
  {
    title: "1. Setup Your Sanctuary",
    desc: "Launch the app instantly in Sandbox mode or register for cloud sync. Create your database connection.",
    icon: DoorOpen,
    color: "bg-cyan-500/10 border-cyan-400 text-cyan-400"
  },
  {
    title: "2. Index & Catalog Your Library",
    desc: "Import physical cover parameters, set store purchase links, prioritize tags, or draft reading logs.",
    icon: Edit3,
    color: "bg-purple-500/10 border-purple-500 text-purple-400"
  },
  {
    title: "3. Log Daily Pages & Streaks",
    desc: "Enter daily session progress numbers, lock consecutive streak flames, and adjust reading target indicators.",
    icon: LineChart,
    color: "bg-blue-500/10 border-blue-500 text-blue-400"
  },
  {
    title: "4. Master Goals & Earn Badges",
    desc: "Fill progress rings, view finished statistics, study speeds, and earn milestone reward achievements.",
    icon: Award,
    color: "bg-pink-500/10 border-pink-500 text-pink-500"
  }
];

export const Timeline: React.FC = () => {
  return (
    <section className="w-full py-28 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Title Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2 text-left">
            <span className="font-mono text-xs text-indigo-400 uppercase tracking-widest font-semibold">[ 03 / ROUTINE ]</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase font-mono">Reading Journey</h2>
          </div>
          <p className="text-slate-400 text-xs font-mono max-w-sm leading-relaxed uppercase tracking-wider text-left">
            Four structural steps to building a consistent, documented reading habit with BookVault.
          </p>
        </div>

        {/* Vertical Timeline Layout */}
        <div className="relative max-w-4xl mx-auto pl-8 sm:pl-0">
          
          {/* Vertical center axis line on desktop */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2" />

          {/* Timeline Nodes */}
          <div className="space-y-12 relative">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div 
                  key={step.title} 
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 relative ${
                    isEven ? "sm:flex-row-reverse" : ""
                  }`}
                >
                  
                  {/* Central Node Indicator */}
                  <div className="absolute left-[-16px] sm:left-1/2 top-1.5 sm:top-1/2 h-8 w-8 rounded-full border border-white/15 bg-black/90 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10">
                    <step.icon className="h-4 w-4 text-slate-300" />
                  </div>

                  {/* Content Box */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 85 }}
                    className="w-full sm:w-[45%] p-6 border border-white/5 bg-black/40 backdrop-blur-md rounded-none text-left space-y-2 hover:border-white/15 transition-colors"
                  >
                    <h3 className="font-mono text-sm font-bold uppercase text-white tracking-widest leading-snug">{step.title}</h3>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-mono uppercase tracking-wider">{step.desc}</p>
                  </motion.div>

                  {/* Balance element to hold layout width on grid grids */}
                  <div className="hidden sm:block w-[45%]" />

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
