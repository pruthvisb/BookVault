"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Rivera",
    role: "Software Architect",
    quote: "BookVault completely replaced my clunky spreadsheet. The local sandbox mode let me test it instantly, and the Supabase cloud sync works flawlessly across all my devices.",
    initials: "AR",
    gradient: "from-cyan-500 to-blue-500"
  },
  {
    name: "Sophia Martinez",
    role: "Graduate Researcher",
    quote: "The pages-read contribution calendar is incredibly motivating. It feels like committing code, but for reading! The badges and streaks keep me engaged every single night.",
    initials: "SM",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    name: "Daniel Chen",
    role: "Educator",
    quote: "The interface is absolutely stunning. The glassmorphism dashboard, dynamic analytics, and offline PWA capability make it feel like a modern, premium workspace.",
    initials: "DC",
    gradient: "from-blue-500 to-purple-500"
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="w-full py-28 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Title Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2 text-left">
            <span className="font-mono text-xs text-pink-500 uppercase tracking-widest font-semibold">[ 04 / REVIEWS ]</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase font-mono">User Testimonials</h2>
          </div>
          <p className="text-slate-400 text-xs font-mono max-w-sm leading-relaxed uppercase tracking-wider text-left">
            See how readers, developers, and researchers use BookVault to construct their daily habits.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, idx) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="p-8 border border-white/5 bg-black/40 backdrop-blur-md rounded-none text-left space-y-6 flex flex-col justify-between hover:border-white/15 transition-colors relative group"
            >
              <Quote className="absolute top-6 right-6 h-5 w-5 text-slate-700 opacity-40 group-hover:text-cyan-400/30 transition-colors" />

              <p className="text-[11px] text-slate-400 leading-relaxed font-mono uppercase tracking-wider">
                "{test.quote}"
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${test.gradient} flex items-center justify-center font-bold text-white text-xs font-mono`}>
                  {test.initials}
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase text-white tracking-widest">{test.name}</h4>
                  <span className="text-[9px] text-slate-550 font-mono uppercase tracking-wider">{test.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
