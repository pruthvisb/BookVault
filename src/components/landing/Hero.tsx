"use client";

import React, { useRef, useEffect } from "react";
import { BookOpen, Sparkles, ArrowRight, Play, Database, Book } from "lucide-react";
import { motion } from "framer-motion";

// Plexus canvas for right-side/holographic visual
const HeroPlexus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const colors = ["rgba(6, 182, 212, 0.45)", "rgba(139, 92, 246, 0.45)", "rgba(59, 130, 246, 0.45)"];

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Spin central vault hologram core
      const time = Date.now() * 0.001;
      const cX = width / 2;
      const cY = height / 2;
      const size = Math.min(width, height) * 0.22;

      ctx.save();
      ctx.translate(cX, cY);
      ctx.rotate(time * 0.2);

      // Outermost circle
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Spinning hexagon
      ctx.rotate(time * 0.15);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * (size * 0.85);
        const y = Math.sin(angle) * (size * 0.85);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(139, 92, 246, 0.25)";
      ctx.stroke();

      // Core spinning node
      ctx.rotate(time * -0.4);
      ctx.beginPath();
      ctx.rect(-10, -10, 20, 20);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.stroke();

      ctx.restore();

      // Draw and update plexus nodes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.x !== -1000) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            p.x += dx * 0.01;
            p.y += dy * 0.01;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Connect nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.2;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full cursor-crosshair opacity-80" />;
};

interface HeroProps {
  onRegisterClick: () => void;
  onSandboxClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onRegisterClick, onSandboxClick }) => {
  return (
    <section className="relative min-h-[95vh] w-full flex flex-col items-center justify-center pt-28 pb-16 overflow-hidden border-b border-white/5 bg-transparent">
      {/* 1. Floating Books & Sparkles in Space */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft blur blobs */}
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] animate-[float1_20s_infinite_alternate]" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[130px] animate-[float2_25s_infinite_alternate]" />
        
        {/* Floating Book 1 */}
        <div className="absolute top-[20%] left-[8%] animate-[float3_10s_infinite_alternate] opacity-35 hidden md:block">
          <Book className="h-10 w-10 text-cyan-400 rotate-[-15deg] filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
        </div>
        {/* Floating Book 2 */}
        <div className="absolute bottom-[25%] left-[12%] animate-[float1_12s_infinite_alternate] opacity-25 hidden md:block">
          <BookOpen className="h-12 w-12 text-purple-400 rotate-[20deg] filter drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
        </div>
        {/* Floating Book 3 */}
        <div className="absolute top-[30%] right-[10%] animate-[float2_9s_infinite_alternate] opacity-30 hidden md:block">
          <Book className="h-11 w-11 text-blue-400 rotate-[10deg] filter drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
        </div>
      </div>

      {/* CSS float animations */}
      <style>{`
        @keyframes float1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-30px, 40px) scale(1.05); }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -30px) scale(1.03); }
        }
        @keyframes float3 {
          0% { transform: translate(0, 0) rotate(-15deg); }
          100% { transform: translate(-20px, -30px) rotate(5deg); }
        }
      `}</style>

      {/* 2. Grid Container */}
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Headline & Copy */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-semibold uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-POWERED KNOWLEDGE SANCTUARY</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] uppercase font-mono"
          >
            Your Intelligent <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 drop-shadow-sm italic font-serif capitalize">
              Digital Library
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-slate-400 text-xs md:text-sm font-mono max-w-xl leading-relaxed uppercase tracking-wider"
          >
            Escape the clutter of fragmented library catalogs. Organize books, map finished heatmaps, track streaks, and analyze reading performance in a custom, glassmorphic layout.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <button
              onClick={onRegisterClick}
              className="SlotButton px-8 py-4 rounded-none bg-white text-black border border-white font-mono text-xs uppercase tracking-widest cursor-pointer hover:bg-cyan-400 hover:border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2"
            >
              <span className="SlotTextWrapper">
                <span className="SlotTextNormal" style={{ color: "#000" }}>Launch Vault</span>
                <span className="SlotTextHover" style={{ color: "#000" }}>Launch Vault</span>
              </span>
              <ArrowRight className="h-4 w-4 text-black shrink-0" />
            </button>

            <button
              onClick={onSandboxClick}
              className="SlotButton px-8 py-4 rounded-none border border-white/20 text-white font-mono text-xs uppercase tracking-widest cursor-pointer hover:bg-purple-600 hover:border-purple-600 shadow-[0_0_30px_rgba(139,92,246,0.15)] flex items-center justify-center gap-2"
            >
              <span className="SlotTextWrapper">
                <span className="SlotTextNormal">Use Local Sandbox</span>
                <span className="SlotTextHover">Use Local Sandbox</span>
              </span>
              <Play className="h-3.5 w-3.5 fill-white shrink-0" />
            </button>
          </motion.div>
        </div>

        {/* Right Side: Animated Plexus & Hologram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-5 w-full h-[380px] lg:h-[450px] relative border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.05)] rounded-none"
        >
          {/* Corner highlights */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/30" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/30" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/30" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/30" />
          
          <div className="absolute top-4 left-4 flex items-center gap-1.5 font-mono text-[7px] tracking-widest text-slate-500 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>CLOUD SYNC DATABASE SIMULATOR</span>
          </div>

          <HeroPlexus />
        </motion.div>

      </div>
    </section>
  );
};
