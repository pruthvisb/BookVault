"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { isLocalSandbox, setSandboxMode } from "@/utils/db";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  History,
  Calendar,
  BarChart3,
  Sun,
  Moon,
  CloudLightning,
  Cloud,
  LogOut,
  Menu,
  X,
  Flame,
  User,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streak: number;
  onLogout: () => void;
}

const supabase = createClient();

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  streak,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("Reader");
  const [sandbox, setSandbox] = useState(true);

  useEffect(() => {
    setSandbox(isLocalSandbox());
    const fetchUser = async () => {
      if (!isLocalSandbox()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profileName = user.user_metadata?.full_name || user.email || "Reader";
          const profileRole = user.user_metadata?.role || "Cloud Reader";
          setUserEmail(profileName);
          setUserRole(profileRole);
        }
      } else {
        const localName = localStorage.getItem("bookvault_profile_name") || "Sandbox Reader";
        const localRole = localStorage.getItem("bookvault_profile_role") || "Local Reader";
        setUserEmail(localName);
        setUserRole(localRole);
      }
    };
    fetchUser();
  }, [activeTab]);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "library", label: "My Library", icon: <BookOpen className="h-5 w-5" /> },
    { id: "wishlist", label: "Wishlist", icon: <Heart className="h-5 w-5" /> },
    { id: "history", label: "Reading History", icon: <History className="h-5 w-5" /> },
    { id: "calendar", label: "Calendar View", icon: <Calendar className="h-5 w-5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/5 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
            <span className="font-bold text-white text-base">B</span>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">BookVault</span>
        </div>

        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full text-xs font-semibold">
              <Flame className="h-3.5 w-3.5 fill-amber-500" />
              <span>{streak}d</span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel flex flex-col justify-between border-r border-white/5 p-6 transition-transform duration-300 md:translate-x-0 md:sticky ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header */}
        <div className="flex flex-col gap-6">
          <div className="hidden md:flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-primary">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-white tracking-tight block">BookVault</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Personal Library</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden flex-1">
              <span className="font-medium text-xs text-white block truncate">{userEmail}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {sandbox ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-[9px] text-amber-400 uppercase tracking-wider font-semibold truncate max-w-[130px]" title={userRole}>
                      Sandbox • {userRole}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold truncate max-w-[130px]" title={userRole}>
                      Sync • {userRole}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-md glow-primary border-l-4 border-indigo-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Controls */}
        <div className="flex flex-col gap-4">
          {/* Streak Indicator (Sidebar) */}
          {streak > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 fill-amber-500" />
                <span className="text-sm font-medium">Reading Streak</span>
              </div>
              <span className="text-base font-bold">{streak} days</span>
            </div>
          )}

          {/* Theme & Network Status Bar */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all duration-200"
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-400" />
              )}
            </button>

            <button
              onClick={onLogout}
              className="flex items-center justify-center p-2.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-white/5 transition-all duration-200"
              title={sandbox ? "Connect Cloud" : "Sign Out"}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </>
  );
};
