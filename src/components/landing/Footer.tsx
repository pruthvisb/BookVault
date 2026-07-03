"use client";

import React from "react";
import { BookOpen, FileText, Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-16 border-t border-white/5 bg-transparent relative z-30 font-mono text-[10px] uppercase tracking-widest text-slate-500">
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 items-start text-left">
        
        {/* Branding Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold text-xs text-white tracking-wider">BOOKVAULT</span>
          </div>
          <p className="text-[9px] text-slate-600 leading-relaxed uppercase tracking-wider max-w-xs">
            Architect personal sanctuaries for books, schedules, speeds, and badges.
          </p>
        </div>

        {/* Resources links */}
        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-slate-400 tracking-[0.2em]">Resources</h4>
          <div className="flex flex-col gap-2">
            <a href="https://github.com/pruthvisb/BookVault" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span>GitHub Repository</span>
            </a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Documentation API</span>
            </a>
          </div>
        </div>

        {/* Technical Stack details */}
        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-slate-400 tracking-[0.2em]">Platform Stack</h4>
          <div className="flex flex-col gap-1.5 text-slate-600">
            <span>Next.js 15 App Router</span>
            <span>Tailwind CSS v4</span>
            <span>Supabase Server Client</span>
            <span>Framer Motion Elements</span>
          </div>
        </div>

        {/* License Block */}
        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-slate-400 tracking-[0.2em]">Legal Matters</h4>
          <div className="flex flex-col gap-2">
            <span className="text-slate-600">© {new Date().getFullYear()} BookVault.</span>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>MIT License</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
