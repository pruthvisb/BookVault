"use client";

import React from "react";
import { Book, ReadingLog } from "@/utils/db";
import { Award, Flame, Zap, Compass, CheckCircle2, Star, BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface BadgesProps {
  books: Book[];
  readingLogs: ReadingLog[];
}

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  progressText: string;
  colorClass: string;
}

export const calculateStreak = (logs: ReadingLog[]): number => {
  if (logs.length === 0) return 0;
  
  // Sort logs by date descending
  const sortedDates = Array.from(new Set(logs.map((l) => l.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // If the last log is older than yesterday, streak is broken
  const lastLogDate = sortedDates[0];
  if (lastLogDate !== todayStr && lastLogDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(lastLogDate);

  for (let i = 0; i < sortedDates.length; i++) {
    const logDateStr = sortedDates[i];
    const logDate = new Date(logDateStr);
    
    // Check if it's the expected next date in the descending sequence
    const diffTime = Math.abs(currentDate.getTime() - logDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (i === 0 || diffDays === 0 || diffDays === 1) {
      streak++;
      currentDate = logDate;
    } else {
      break;
    }
  }

  return streak;
};

export const Badges: React.FC<BadgesProps> = ({ books, readingLogs }) => {
  const completedBooks = books.filter((b) => b.status === "Completed");
  const totalPagesRead = readingLogs.reduce((acc, log) => acc + log.pages_read, 0);
  const streak = calculateStreak(readingLogs);

  // Speed calculation: average pages read per minute (pages_read / reading_time)
  const logsWithTime = readingLogs.filter((l) => l.reading_time && l.reading_time > 0);
  const avgSpeed =
    logsWithTime.length > 0
      ? logsWithTime.reduce((acc, l) => acc + (l.pages_read / (l.reading_time || 1)), 0) /
        logsWithTime.length
      : 0;

  const maxSingleDayPages =
    readingLogs.length > 0 ? Math.max(...readingLogs.map((l) => l.pages_read)) : 0;

  const hasLargeBook = books.some((b) => b.total_pages >= 500 && b.status === "Completed");
  const favoritesCount = books.filter((b) => b.is_favorite).length;

  const badgeDefinitions: BadgeItem[] = [
    {
      id: "first-step",
      name: "First Step",
      description: "Log your first reading activity",
      icon: <BookOpen className="h-6 w-6" />,
      isUnlocked: readingLogs.length > 0,
      progressText: readingLogs.length > 0 ? "Unlocked" : "0/1 reading logs",
      colorClass: "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30",
    },
    {
      id: "bookworm-1",
      name: "Bookworm I",
      description: "Complete your first book",
      icon: <Award className="h-6 w-6" />,
      isUnlocked: completedBooks.length >= 1,
      progressText: completedBooks.length >= 1 ? "Unlocked" : "0/1 books",
      colorClass: "from-purple-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30",
    },
    {
      id: "bookworm-2",
      name: "Bookworm II",
      description: "Complete 5 books in library",
      icon: <Star className="h-6 w-6" />,
      isUnlocked: completedBooks.length >= 5,
      progressText: `${completedBooks.length}/5 completed`,
      colorClass: "from-violet-500/20 to-purple-500/20 text-purple-400 border-purple-500/30",
    },
    {
      id: "consistency-3",
      name: "Consistent Reader",
      description: "Achieve a 3-day reading streak",
      icon: <Flame className="h-6 w-6" />,
      isUnlocked: streak >= 3,
      progressText: `${streak}/3 day streak`,
      colorClass: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
    },
    {
      id: "consistency-7",
      name: "Habitual Reader",
      description: "Achieve a 7-day reading streak",
      icon: <Flame className="h-6 w-6" />,
      isUnlocked: streak >= 7,
      progressText: `${streak}/7 day streak`,
      colorClass: "from-red-500/20 to-orange-500/20 text-red-400 border-red-500/30",
    },
    {
      id: "speed-demon",
      name: "Speed Demon",
      description: "Read at > 1.5 pages per minute avg",
      icon: <Zap className="h-6 w-6" />,
      isUnlocked: avgSpeed >= 1.5,
      progressText: avgSpeed > 0 ? `${avgSpeed.toFixed(1)} pages/min` : "No speed logs",
      colorClass: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30",
    },
    {
      id: "deep-diver",
      name: "Deep Diver",
      description: "Complete a book of 500+ pages",
      icon: <Compass className="h-6 w-6" />,
      isUnlocked: hasLargeBook,
      progressText: hasLargeBook ? "Unlocked" : "No 500+ page book finished",
      colorClass: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "page-turner",
      name: "Page Turner",
      description: "Read over 100 pages in a single day",
      icon: <Clock className="h-6 w-6" />,
      isUnlocked: maxSingleDayPages >= 100,
      progressText: `${maxSingleDayPages}/100 max pages`,
      colorClass: "from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Achievements & Badges</h2>
        <p className="text-sm text-slate-400 dark:text-slate-400">
          Unlock badges as you hit your reading milestones.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badgeDefinitions.map((badge, idx) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-2xl border text-center glass-card ${
              badge.isUnlocked
                ? "border-white/10"
                : "opacity-40 filter grayscale border-white/5"
            }`}
          >
            {/* Background glow for unlocked badges */}
            {badge.isUnlocked && (
              <div className="absolute inset-0 bg-gradient-to-br opacity-5 blur-xl pointer-events-none" />
            )}

            {/* Badge Icon Container */}
            <div
              className={`p-3 rounded-full bg-gradient-to-br border ${
                badge.isUnlocked
                  ? badge.colorClass
                  : "bg-slate-800/20 text-slate-500 border-slate-700/20"
              } mb-3`}
            >
              {badge.icon}
            </div>

            {/* Badge Details */}
            <h3 className="font-semibold text-sm text-white">{badge.name}</h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2 h-8 leading-snug">
              {badge.description}
            </p>

            {/* Lock/Unlock Progress Indicator */}
            <div className="mt-3 flex items-center gap-1.5">
              {badge.isUnlocked ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              )}
              <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400">
                {badge.progressText}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
