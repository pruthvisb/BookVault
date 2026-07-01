"use client";

import React, { useState } from "react";
import { ReadingLog, Book } from "@/utils/db";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Bookmark, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface CalendarViewProps {
  readingLogs: ReadingLog[];
  books: Book[];
  streak: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  readingLogs,
  books,
  streak,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayLogs, setSelectedDayLogs] = useState<ReadingLog[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get start day of month and total days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Calendar generation helpers
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayLogs([]);
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayLogs([]);
    setSelectedDateStr(null);
  };

  // Find logs for a specific day string (YYYY-MM-DD)
  const getLogsForDate = (dateStr: string): ReadingLog[] => {
    return readingLogs.filter((log) => log.date === dateStr);
  };

  // Heatmap color selector based on pages read
  const getHeatmapColorClass = (pages: number): string => {
    if (pages === 0) return "bg-slate-800/20 border-white/5 text-slate-500";
    if (pages <= 10) return "bg-indigo-950 text-indigo-400 border-indigo-500/20";
    if (pages <= 25) return "bg-indigo-800 text-indigo-200 border-indigo-500/40";
    if (pages <= 50) return "bg-indigo-600 text-white border-indigo-400/50 shadow-sm glow-primary";
    return "bg-purple-500 text-white border-purple-300 shadow-md glow-success";
  };

  // Render Days grid
  const renderDays = () => {
    const daysGrid = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    // 1. Render empty cells for previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const padDay = prevMonthDays - i;
      daysGrid.push(
        <div
          key={`prev-${padDay}`}
          className="p-3 text-center text-slate-700 text-xs border border-transparent select-none opacity-20"
        >
          {padDay}
        </div>
      );
    }

    // 2. Render current month days
    for (let day = 1; day <= totalDays; day++) {
      const dayDate = new Date(year, month, day);
      // Create local YYYY-MM-DD ISO string manually to bypass timezone shifts
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateStr = `${dayDate.getFullYear()}-${pad(dayDate.getMonth() + 1)}-${pad(dayDate.getDate())}`;

      const dayLogs = getLogsForDate(dateStr);
      const totalPages = dayLogs.reduce((sum, log) => sum + log.pages_read, 0);
      const cellColorClass = getHeatmapColorClass(totalPages);
      const isSelected = selectedDateStr === dateStr;

      daysGrid.push(
        <motion.div
          key={`day-${day}`}
          whileHover={{ scale: 1.1 }}
          onClick={() => {
            setSelectedDayLogs(dayLogs);
            setSelectedDateStr(dateStr);
          }}
          className={`calendar-heatmap-cell p-1.5 sm:p-3 text-center text-xs font-semibold rounded-xl border cursor-pointer select-none relative ${cellColorClass} ${
            isSelected ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 border-indigo-400" : ""
          }`}
        >
          <span>{day}</span>
          {totalPages > 0 && (
            <span className="absolute bottom-1 left-0 right-0 text-[8px] opacity-80 leading-none">
              {totalPages}p
            </span>
          )}
        </motion.div>
      );
    }

    return daysGrid;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid Card */}
      <div className="flex-1 p-6 rounded-3xl glass-panel space-y-6">
        {/* Header navigation controls */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            <span className="font-extrabold text-white text-base">
              {monthNames[month]} {year}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-black/20 p-3 rounded-xl border border-white/5">
          <span>Heatmap Scale:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-slate-800/20 border border-white/5" />
              <span>0p</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-indigo-950 border border-indigo-500/20" />
              <span>1-10p</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-indigo-800 border border-indigo-500/40" />
              <span>11-25p</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-indigo-600 border border-indigo-400/50" />
              <span>26-50p</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-purple-500 border border-purple-300" />
              <span>50p+</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Weekday titles */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {renderDays()}
          </div>
        </div>
      </div>

      {/* Right Column: Day Inspection Details & Streak Panel */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Streak visual board */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Flame className="h-7 w-7 fill-amber-500 animate-pulse" />
              <div>
                <span className="text-xs font-semibold text-slate-400 block font-semibold uppercase tracking-wider">Active Streak</span>
                <span className="text-lg font-bold text-white leading-none mt-0.5 block">{streak} Days Read</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Selected Date Activity card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl glass-panel h-full min-h-[300px]"
        >
          <span className="font-bold text-white text-sm uppercase tracking-wider block mb-4 border-b border-white/5 pb-2">
            Day Activity Log
          </span>

          {!selectedDateStr ? (
            <div className="text-center py-20">
              <CalendarIcon className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Click on any calendar day to inspect logged pages and notes.
              </p>
            </div>
          ) : selectedDayLogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xs text-slate-500">
                No reading history recorded on{" "}
                <span className="font-bold text-slate-300">
                  {new Date(selectedDateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                Logs for {new Date(selectedDateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </h4>

              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {selectedDayLogs.map((log) => {
                  const book = books.find((b) => b.id === log.book_id);
                  return (
                    <div key={log.id} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                      <div className="flex items-start gap-2 border-b border-white/5 pb-2">
                        <Bookmark className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                        <div className="overflow-hidden">
                          <span className="font-bold text-xs text-white truncate block">{book?.title || "Unknown Book"}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{book?.author}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                        <div>
                          <span>Pages Read:</span>
                          <span className="font-semibold text-white ml-1">{log.pages_read} pages</span>
                        </div>
                        {log.reading_time ? (
                          <div>
                            <span>Time:</span>
                            <span className="font-semibold text-white ml-1">{log.reading_time} mins</span>
                          </div>
                        ) : null}
                      </div>

                      {log.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-snug">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
