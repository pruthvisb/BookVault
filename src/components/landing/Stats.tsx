"use client";

import React, { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Ticking number counter hook
const TickingNumber: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string }> = ({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
}) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const inView = useInView(elementRef, { once: true });

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
    
    const timer = setInterval(() => {
      start += Math.max(Math.floor(end / 40), 1);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, inView]);

  return (
    <span ref={elementRef}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const statistics = [
  { label: "Active Streaks", value: 365, suffix: " Days", desc: "Longest logged daily streak." },
  { label: "Pages Completed", value: 12450, suffix: " pg", desc: "Aggregate pages log counts." },
  { label: "Finished Volumes", value: 142, suffix: " Books", desc: "Completed catalog volumes." },
  { label: "Average Velocity", value: 45, prefix: "~", suffix: " PPM", desc: "Reading speed metrics." },
  { label: "Earned Milestones", value: 18, suffix: " Badges", desc: "Unlocked streak achievements." }
];

export const Stats: React.FC = () => {
  return (
    <section className="w-full py-24 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Title Block */}
        <div className="text-center space-y-2 mb-12">
          <span className="font-mono text-[9px] text-slate-500 tracking-[0.3em] uppercase">SYSTEM STATISTICS</span>
          <h2 className="text-sm font-mono text-slate-400 uppercase tracking-widest">Global Reading Performance</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {statistics.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="p-6 border border-white/5 bg-black/40 backdrop-blur-md rounded-none text-left space-y-2 hover:border-white/10 transition-colors"
            >
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">{stat.label}</span>
              <div className="text-lg sm:text-2xl font-bold uppercase tracking-tight text-white font-mono">
                <TickingNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </div>
              <span className="text-[9px] text-slate-550 font-mono uppercase tracking-wider block">{stat.desc}</span>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
