"use client";

import React, { useState } from "react";
import { Book, ReadingLog } from "@/utils/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  PieChartIcon,
  Award,
  Zap,
  Calendar,
  Compass,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Badges } from "./Badges";
import { motion } from "framer-motion";

interface AnalyticsProps {
  books: Book[];
  readingLogs: ReadingLog[];
}

const COLORS = ["#6366f1", "#a78bfa", "#f43f5e", "#10b981", "#06b6d4", "#f59e0b", "#ec4899"];

export const Analytics: React.FC<AnalyticsProps> = ({ books, readingLogs }) => {
  const [range, setRange] = useState<7 | 30>(7);

  const libraryBooks = books.filter((b) => b.status !== "Wishlist");
  const completedBooks = libraryBooks.filter((b) => b.status === "Completed");
  const readingBooks = libraryBooks.filter((b) => b.status === "Reading");

  // Summary Metrics
  const totalPagesRead = readingLogs.reduce((acc, log) => acc + log.pages_read, 0);

  // Speed Metrics
  const logsWithTime = readingLogs.filter((l) => l.reading_time && l.reading_time > 0);
  const totalReadingTime = logsWithTime.reduce((acc, l) => acc + (l.reading_time || 0), 0);
  const totalPagesWithTime = logsWithTime.reduce((acc, l) => acc + l.pages_read, 0);
  const avgPagesPerMinute =
    totalReadingTime > 0 ? (totalPagesWithTime / totalReadingTime) : 0;

  // Average pages read per day (based on active logging history)
  const uniqueDates = Array.from(new Set(readingLogs.map((l) => l.date)));
  const avgPagesPerDay =
    uniqueDates.length > 0 ? Math.round(totalPagesRead / uniqueDates.length) : 0;

  // Estimated completion dates
  const estimatedCompletionBooks = readingBooks.map((book) => {
    const pagesRemaining = book.total_pages - book.current_page;
    let daysToComplete = Infinity;
    let estDate = "Unknown (No history)";

    if (avgPagesPerDay > 0) {
      daysToComplete = Math.ceil(pagesRemaining / avgPagesPerDay);
      const est = new Date();
      est.setDate(est.getDate() + daysToComplete);
      estDate = est.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    return {
      title: book.title,
      pagesRemaining,
      daysToComplete,
      estDate,
    };
  });

  // 1. Pages read each day chart
  const getPagesPerDayData = () => {
    const data = [];
    const dateMap = new Map<string, number>();

    // Seed map
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      dateMap.set(str, 0);
    }

    readingLogs.forEach((log) => {
      if (dateMap.has(log.date)) {
        dateMap.set(log.date, (dateMap.get(log.date) || 0) + log.pages_read);
      }
    });

    for (const [date, pages] of dateMap.entries()) {
      const dateObj = new Date(date);
      data.push({
        name: dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        pages: pages,
      });
    }
    return data;
  };

  const pagesPerDayData = getPagesPerDayData();

  // 2. Books completed each month chart
  const getCompletedMonthlyData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyCounts = Array(12).fill(0);

    completedBooks.forEach((book) => {
      const finishDate = book.date_finished ? new Date(book.date_finished) : new Date(book.updated_at || 0);
      const monthIdx = finishDate.getMonth();
      monthlyCounts[monthIdx]++;
    });

    return monthNames.map((name, idx) => ({
      month: name,
      completed: monthlyCounts[idx],
    }));
  };

  const completedMonthlyData = getCompletedMonthlyData();

  // 3. Genre distribution chart
  const getGenreData = () => {
    const genreMap = new Map<string, number>();
    libraryBooks.forEach((book) => {
      const g = book.genre || "Uncategorized";
      genreMap.set(g, (genreMap.get(g) || 0) + 1);
    });

    const data: any = [];
    genreMap.forEach((count, genre) => {
      data.push({ name: genre, value: count });
    });
    return data;
  };

  const genreData = getGenreData();

  // 4. Completion percentages calculation
  const totalBooksCount = libraryBooks.length;
  const completionPercentage = totalBooksCount > 0 ? Math.round((completedBooks.length / totalBooksCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">Deep insight into your reading habits and library coverage.</p>
      </div>

      {/* Numerical Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pages Read", val: totalPagesRead, sub: "Across all logs", icon: <TrendingUp className="h-5 w-5 text-indigo-400" /> },
          { label: "Completion Rate", val: `${completionPercentage}%`, sub: `${completedBooks.length}/${totalBooksCount} books completed`, icon: <Award className="h-5 w-5 text-emerald-400" /> },
          { label: "Daily Avg Pages", val: avgPagesPerDay, sub: "Pages read per active day", icon: <Calendar className="h-5 w-5 text-sky-400" /> },
          { label: "Reading Speed", val: avgPagesPerMinute > 0 ? `${avgPagesPerMinute.toFixed(1)} PPM` : "N/A", sub: "Pages read per minute", icon: <Zap className="h-5 w-5 text-amber-400" /> },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-5 rounded-2xl glass-card flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-400 block">{item.label}</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{item.val}</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">{item.sub}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">{item.icon}</div>
          </motion.div>
        ))}
      </div>

      {/* Grid for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pages Read Trend */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl glass-panel relative"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="font-bold text-white text-base">Reading Pages Frequency</span>
            <div className="flex gap-1.5 bg-black/40 border border-white/5 p-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider">
              {([7, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    range === r ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Last {r} Days
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pagesPerDayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="pages" name="Pages" stroke="#818cf8" strokeWidth={2} fill="url(#analyticsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Books Completed Monthly */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl glass-panel"
        >
          <span className="font-bold text-white text-base block mb-6">Completed Books per Month</span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completedMonthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="completed" name="Books Finished" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Genre Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl glass-panel flex flex-col justify-between"
        >
          <span className="font-bold text-white text-base block mb-6">Genre Distribution</span>
          {genreData.length === 0 ? (
            <p className="text-slate-500 text-xs py-20 text-center">Add books with genres to display this chart.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genreData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {genreData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend list */}
              <div className="flex-1 space-y-2.5 w-full">
                {genreData.map((genre: any, idx: number) => (
                  <div key={genre.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-slate-300">{genre.name}</span>
                    </div>
                    <span className="text-white font-extrabold">{genre.value} books</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Estimated Completion Dates */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl glass-panel flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="font-bold text-white text-base">Estimated Completion Tracker</span>
            <span title="Calculated based on your average pages read per day" className="cursor-help">
              <HelpCircle className="h-4.5 w-4.5 text-slate-500" />
            </span>
          </div>

          {estimatedCompletionBooks.length === 0 ? (
            <p className="text-slate-500 text-xs py-20 text-center">No books currently in progress ("Reading").</p>
          ) : (
            <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
              {estimatedCompletionBooks.map((book, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-extrabold text-xs text-white truncate">{book.title}</span>
                    <span className="text-[10px] text-indigo-400 font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                      {book.estDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{book.pagesRemaining} pages remaining</span>
                    <span>{book.daysToComplete === Infinity ? "N/A" : `Est: ~${book.daysToComplete} days`}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Gamification Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl glass-panel"
      >
        <Badges books={books} readingLogs={readingLogs} />
      </motion.div>
    </div>
  );
};
