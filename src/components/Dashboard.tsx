"use client";

import React, { useState } from "react";
import { Book, ReadingLog, ReadingGoals } from "@/utils/db";
import {
  BookOpen,
  Award,
  Bookmark,
  Flame,
  Plus,
  Compass,
  ChevronRight,
  TrendingUp,
  Heart,
  Edit2,
  CheckCircle,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface DashboardProps {
  books: Book[];
  readingLogs: ReadingLog[];
  goals: ReadingGoals;
  onUpdateGoals: (g: Partial<ReadingGoals>) => void;
  onOpenAddBook: () => void;
  onOpenDailyLog: () => void;
  onSelectTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  books,
  readingLogs,
  goals,
  onUpdateGoals,
  onOpenAddBook,
  onOpenDailyLog,
  onSelectTab,
}) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoalValue, setNewGoalValue] = useState(goals.pages_per_day.toString());
  const [chartRange, setChartRange] = useState<7 | 30>(7);

  // Statistics Calculations
  const totalOwned = books.filter((b) => b.status !== "Wishlist").length;
  const completedCount = books.filter((b) => b.status === "Completed").length;
  const readingCount = books.filter((b) => b.status === "Reading").length;
  const wishlistCount = books.filter((b) => b.status === "Wishlist").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const pagesReadToday = readingLogs
    .filter((log) => log.date === todayStr)
    .reduce((acc, log) => acc + log.pages_read, 0);

  // Streak calculation (already imported in Badges, let's implement inline or import)
  const calculateStreakVal = (logs: ReadingLog[]): number => {
    if (logs.length === 0) return 0;
    const sortedDates = Array.from(new Set(logs.map((l) => l.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    const lastLogDate = sortedDates[0];
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().split("T")[0];
    if (lastLogDate !== todayStr && lastLogDate !== yestStr) return 0;

    let streak = 0;
    let curr = new Date(lastLogDate);
    for (let i = 0; i < sortedDates.length; i++) {
      const diff = Math.ceil(
        Math.abs(curr.getTime() - new Date(sortedDates[i]).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (i === 0 || diff === 0 || diff === 1) {
        streak++;
        curr = new Date(sortedDates[i]);
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreakVal(readingLogs);

  // Chart Data preparation
  const getChartData = () => {
    const data = [];
    const dateMap = new Map<string, number>();

    // Seed map with empty days
    for (let i = chartRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      dateMap.set(str, 0);
    }

    // Populate actual logs
    readingLogs.forEach((log) => {
      if (dateMap.has(log.date)) {
        dateMap.set(log.date, (dateMap.get(log.date) || 0) + log.pages_read);
      }
    });

    for (const [date, pages] of dateMap.entries()) {
      const dateObj = new Date(date);
      data.push({
        day: dateObj.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
        pages: pages,
      });
    }
    return data;
  };

  const chartData = getChartData();

  // Circular gauge calculations
  const goalProgressPercent = Math.min(100, Math.round((pagesReadToday / goals.pages_per_day) * 100));
  const strokeDashoffset = 220 - (220 * goalProgressPercent) / 100;

  // Favorite Books selector
  const favorites = books.filter((b) => b.is_favorite);

  const handleSaveGoal = () => {
    const val = parseInt(newGoalValue, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateGoals({ pages_per_day: val });
      setEditingGoal(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column: Stats Cards and Trend Charts */}
      <div className="flex-1 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Keep track of your reading progress and statistics.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDailyLog}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 font-semibold text-xs hover:bg-indigo-500/20 transition-all cursor-pointer"
            >
              <Bookmark className="h-4 w-4 fill-indigo-300" />
              <span>Log Reading</span>
            </button>

            <button
              onClick={onOpenAddBook}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md glow-primary cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Book</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Books", val: totalOwned, icon: <BookOpen className="h-5 w-5 text-indigo-400" /> },
            { label: "Completed", val: completedCount, icon: <Award className="h-5 w-5 text-emerald-400" /> },
            { label: "Reading Now", val: readingCount, icon: <Compass className="h-5 w-5 text-sky-400" /> },
            { label: "Wishlist", val: wishlistCount, icon: <Heart className="h-5 w-5 text-pink-400" /> },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-2xl glass-card flex flex-col justify-between h-28 cursor-pointer"
              onClick={() => onSelectTab(item.label === "Wishlist" ? "wishlist" : "library")}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{item.label}</span>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">{item.icon}</div>
              </div>
              <span className="text-3xl font-extrabold text-white mt-2">{item.val}</span>
            </motion.div>
          ))}
        </div>

        {/* Progress chart Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl glass-panel relative"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <span className="font-bold text-white text-base">Pages Read History</span>
            </div>

            <div className="flex gap-1.5 bg-black/40 border border-white/5 p-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider">
              {([7, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartRange === r ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Last {r} Days
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="pagesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#a5b4fc" }}
                />
                <Area
                  type="monotone"
                  dataKey="pages"
                  name="Pages Read"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#pagesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Goal and Favorites */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Daily Goal Visual Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl glass-panel flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setEditingGoal(!editingGoal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          </div>

          <span className="font-bold text-white text-base mb-6">Daily Progress Goal</span>

          {editingGoal ? (
            <div className="flex gap-2 items-center mb-6">
              <input
                type="number"
                min="1"
                value={newGoalValue}
                onChange={(e) => setNewGoalValue(e.target.value)}
                className="w-20 px-3 py-1.5 text-center text-sm glass-input text-white"
              />
              <button
                onClick={handleSaveGoal}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-xs font-semibold"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="relative h-32 w-32 mb-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Track */}
                <circle
                  cx="64"
                  cy="64"
                  r="55"
                  className="stroke-slate-800 fill-transparent"
                  strokeWidth="8"
                />
                {/* Progress bar */}
                <circle
                  cx="64"
                  cy="64"
                  r="55"
                  className="stroke-indigo-500 fill-transparent transition-all duration-500"
                  strokeWidth="8"
                  strokeDasharray="346"
                  strokeDashoffset={346 - (346 * goalProgressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{pagesReadToday}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  / {goals.pages_per_day} pages
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
            {goalProgressPercent >= 100 ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Daily goal achieved!</span>
              </>
            ) : (
              <span className="text-slate-400">
                Read <span className="font-semibold text-white">{goals.pages_per_day - pagesReadToday}</span> more pages today.
              </span>
            )}
          </div>
        </motion.div>

        {/* Reading Streak Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-400 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Flame className="h-6 w-6 fill-amber-500" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Streak Tracker</span>
              <span className="text-lg font-bold text-white leading-none mt-0.5 block">
                {streak} Day Reading Streak
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-500" />
        </motion.div>

        {/* Favorite Books list */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl glass-panel"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <Heart className="h-4.5 w-4.5 text-pink-500 fill-pink-500" />
            <span className="font-bold text-white text-sm uppercase tracking-wider">Favorites Pinned</span>
          </div>

          {favorites.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              Pin your favorite books to display them here for quick access.
            </p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {favorites.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectTab("library")}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div
                    style={{ background: b.cover_url?.startsWith("linear-gradient") ? b.cover_url : "none" }}
                    className="w-9 h-12 rounded bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/5"
                  >
                    {b.cover_url && !b.cover_url.startsWith("linear-gradient") && (
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-white truncate block">{b.title}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{b.author}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
