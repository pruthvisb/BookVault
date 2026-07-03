"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play } from "lucide-react";

interface CTAProps {
  onRegisterClick: () => void;
  onSandboxClick: () => void;
}

export const CTA: React.FC<CTAProps> = ({ onRegisterClick, onSandboxClick }) => {
  return (
    <section className="w-full py-28 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-5xl mx-auto px-6">
        
        {/* Callout Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-10 md:p-16 border border-white/10 rounded-none bg-gradient-to-br from-indigo-950/60 via-black/80 to-purple-950/60 overflow-hidden text-center space-y-6 shadow-[0_0_50px_rgba(139,92,246,0.08)]"
        >
          {/* Subtle grid patterns overlay inside the card */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: "30px 30px",
            }}
          />

          {/* Glowing blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/5 text-purple-400 text-xs font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Unshackle Your Focus</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase font-mono leading-tight max-w-2xl mx-auto">
              Start Building Your Reading Habit
            </h2>

            <p className="text-slate-400 text-xs md:text-sm font-mono max-w-lg mx-auto leading-relaxed uppercase tracking-wider">
              Establish a library, catalog finished books, analyze daily velocities, and unlock badges completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={onRegisterClick}
                className="SlotButton px-8 py-4 rounded-none bg-white text-black border border-white font-mono text-xs uppercase tracking-widest cursor-pointer hover:bg-cyan-400 hover:border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 mx-auto sm:mx-0"
              >
                <span className="SlotTextWrapper">
                  <span className="SlotTextNormal" style={{ color: "#000" }}>Establish Vault</span>
                  <span className="SlotTextHover" style={{ color: "#000" }}>Establish Vault</span>
                </span>
                <ArrowRight className="h-4 w-4 text-black shrink-0" />
              </button>

              <button
                onClick={onSandboxClick}
                className="SlotButton px-8 py-4 rounded-none border border-white/20 text-white font-mono text-xs uppercase tracking-widest cursor-pointer hover:bg-purple-600 hover:border-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.15)] flex items-center justify-center gap-2 mx-auto sm:mx-0"
              >
                <span className="SlotTextWrapper">
                  <span className="SlotTextNormal">Sandbox Mode</span>
                  <span className="SlotTextHover">Sandbox Mode</span>
                </span>
                <Play className="h-3.5 w-3.5 fill-white shrink-0" />
              </button>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
};
