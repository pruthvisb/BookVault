"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, Server, FileCode, CheckSquare, Compass, ShieldCheck, Play } from "lucide-react";

const techs = [
  { name: "Next.js 15", desc: "App Router & SSR", color: "hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]" },
  { name: "React 19", desc: "Dynamic Hooks", color: "hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]" },
  { name: "TypeScript", desc: "Strong Type Safety", color: "hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]" },
  { name: "Tailwind CSS", desc: "Premium Layouts", color: "hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]" },
  { name: "Supabase", desc: "Postgres Storage", color: "hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]" },
  { name: "PostgreSQL", desc: "Relational RLS", color: "hover:border-cyan-600/30 hover:shadow-[0_0_20px_rgba(8,145,178,0.1)]" },
  { name: "Vercel", desc: "Production Host", color: "hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]" }
];

export const TrustedTech: React.FC = () => {
  return (
    <section className="w-full py-16 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Title */}
        <div className="text-center space-y-2">
          <span className="font-mono text-[9px] text-slate-500 tracking-[0.3em] uppercase">POWERED BY ENTERPRISE STACK</span>
          <h2 className="text-sm font-mono text-slate-400 uppercase tracking-widest">Trusted Technologies</h2>
        </div>

        {/* Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {techs.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`p-5 border border-white/5 bg-black/30 backdrop-blur-sm rounded-none text-center flex flex-col justify-between items-center h-28 cursor-default transition-all duration-300 ${tech.color}`}
            >
              <span className="text-xs font-bold font-mono text-slate-200 tracking-wider uppercase">{tech.name}</span>
              <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">{tech.desc}</span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
