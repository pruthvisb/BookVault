"use client";

import React, { useState } from "react";
import { ReadingLog, Book } from "@/utils/db";
import { History as HistoryIcon, Search, Trash2, Calendar, BookOpen, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface HistoryProps {
  readingLogs: ReadingLog[];
  books: Book[];
  onDeleteLog: (id: string) => void;
}

export const History: React.FC<HistoryProps> = ({
  readingLogs,
  books,
  onDeleteLog,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>("All");

  const filteredLogs = readingLogs.filter((log) => {
    return selectedBookId === "All" || log.book_id === selectedBookId;
  });

  // Calculate statistics
  const totalPages = filteredLogs.reduce((sum, l) => sum + l.pages_read, 0);
  const totalTime = filteredLogs.reduce((sum, l) => sum + (l.reading_time || 0), 0);
  const avgPages = filteredLogs.length > 0 ? Math.round(totalPages / filteredLogs.length) : 0;
  const avgTime = filteredLogs.length > 0 ? Math.round(totalTime / filteredLogs.length) : 0;

  // Estimated completion calculation for currently selected book
  const getSelectedBookEst = () => {
    if (selectedBookId === "All") return null;
    const book = books.find((b) => b.id === selectedBookId);
    if (!book || book.status === "Completed" || book.status === "Wishlist") return null;

    const remainingPages = book.total_pages - book.current_page;
    if (remainingPages <= 0) return "Completed";

    // Average page rate for this specific book
    const bookLogs = readingLogs.filter((l) => l.book_id === selectedBookId);
    const bookTotalRead = bookLogs.reduce((sum, l) => sum + l.pages_read, 0);
    const bookDays = Array.from(new Set(bookLogs.map((l) => l.date))).length;
    const bookAvg = bookDays > 0 ? bookTotalRead / bookDays : 0;

    if (bookAvg <= 0) return "N/A (Log more sessions)";

    const daysRemaining = Math.ceil(remainingPages / bookAvg);
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + daysRemaining);

    return {
      remainingPages,
      daysRemaining,
      dateString: estDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    };
  };

  const estInfo = getSelectedBookEst();

  return (
    <div className="space-y-6">
      {/* Header sections */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Reading History</h1>
          <p className="text-slate-400 text-sm mt-1">Review the daily logs of pages read across your library.</p>
        </div>

        <div className="w-full md:w-auto">
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full sm:w-64 px-4 py-2.5 text-sm glass-input bg-slate-900 border-white/5 font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            <option value="All">All Books</option>
            {books
              .filter((b) => b.status !== "Wishlist")
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Grid stats details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", val: filteredLogs.length, sub: "Times reading logged", icon: <HistoryIcon className="h-5 w-5 text-indigo-400" /> },
          { label: "Total Pages Read", val: totalPages, sub: "Pages read combined", icon: <BookOpen className="h-5 w-5 text-sky-400" /> },
          { label: "Avg Pages / Session", val: avgPages, sub: "Pages read per log", icon: <Calendar className="h-5 w-5 text-emerald-400" /> },
          { label: "Total Time Spent", val: `${totalTime}m`, sub: "Reading minutes logged", icon: <Clock className="h-5 w-5 text-amber-400" /> },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-2xl glass-card flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-slate-400 block">{item.label}</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{item.val}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{item.sub}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">{item.icon}</div>
          </motion.div>
        ))}
      </div>

      {/* Estimated Completion Panel for Single Book */}
      {estInfo && typeof estInfo === "object" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex gap-3">
            <Calendar className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Estimated Completion</span>
              <span className="text-sm font-semibold text-white mt-0.5 block">
                You have <span className="font-bold text-indigo-300">{estInfo.remainingPages} pages</span> remaining in this book.
              </span>
            </div>
          </div>
          <div className="text-right sm:text-right w-full sm:w-auto">
            <span className="text-xs text-slate-400 block">Estimated Finish Date</span>
            <span className="text-base font-extrabold text-indigo-300">{estInfo.dateString} (~{estInfo.daysRemaining} days)</span>
          </div>
        </motion.div>
      )}

      {/* Daily Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/5">
          <HistoryIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No history found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Log your first daily reading session from the Dashboard or Library to compile logs.
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-black/40 border-b border-white/5 text-slate-400 uppercase tracking-widest text-[9px] font-bold">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Pages Read</th>
                  <th className="p-4">Time Spent</th>
                  <th className="p-4">Current Page</th>
                  <th className="p-4">Session Notes</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-transparent">
                {filteredLogs.map((log) => {
                  const book = books.find((b) => b.id === log.book_id);
                  const formattedDate = new Date(log.date).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-semibold text-xs whitespace-nowrap">{formattedDate}</td>
                      <td className="p-4 font-bold text-white text-xs">{book?.title || "Deleted Book"}</td>
                      <td className="p-4 text-xs font-semibold text-indigo-400">{log.pages_read} pages</td>
                      <td className="p-4 text-xs text-slate-400">{log.reading_time ? `${log.reading_time} mins` : "—"}</td>
                      <td className="p-4 text-xs font-semibold text-slate-300">{log.current_page}</td>
                      <td className="p-4 text-xs text-slate-500 max-w-xs truncate" title={log.notes || undefined}>
                        {log.notes || "—"}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Delete Session Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
