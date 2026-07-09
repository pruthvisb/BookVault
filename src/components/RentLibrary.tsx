"use client";

import React, { useState } from "react";
import { Book, RentalInfo, parseRentalInfo, formatRentalInfo, cleanNotesFromRental } from "@/utils/db";
import { 
  Clock, 
  Calendar, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  History as HistoryIcon,
  Search, 
  BookOpen,
  CalendarCheck,
  Plus,
  RefreshCw,
  TrendingUp,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RentLibraryProps {
  books: Book[];
  onUpdateBook: (id: string, data: Partial<Book>) => Promise<void>;
  onOpenAddBook: () => void;
  onOpenEditBook: (book: Book) => void;
}

export const RentLibrary: React.FC<RentLibraryProps> = ({
  books,
  onUpdateBook,
  onOpenAddBook,
  onOpenEditBook,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [reissueBook, setReissueBook] = useState<Book | null>(null);
  const [reissueDate, setReissueDate] = useState("");
  const [reissueError, setReissueError] = useState<string | null>(null);

  // Parse all rental books
  const rentalBooks = books.map(b => ({
    book: b,
    rental: parseRentalInfo(b.notes)
  })).filter(item => item.rental !== null) as { book: Book; rental: RentalInfo }[];

  // Filter based on search query
  const filteredRentals = rentalBooks.filter(item => 
    item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active (not returned) vs History (returned)
  const activeRentals = filteredRentals.filter(item => !item.rental.returnedAt);
  const returnedHistory = filteredRentals.filter(item => !!item.rental.returnedAt);

  // Calculate stats
  const totalBorrowed = rentalBooks.filter(item => !item.rental.returnedAt).length;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueCount = rentalBooks.filter(item => 
    !item.rental.returnedAt && item.rental.returnBy < todayStr
  ).length;

  const totalReturned = rentalBooks.filter(item => !!item.rental.returnedAt).length;

  const handleReturnBook = async (book: Book, rental: RentalInfo) => {
    try {
      const updatedRental: RentalInfo = {
        ...rental,
        returnedAt: new Date().toISOString(),
      };

      const chaptersMatch = book.notes?.match(/\[CHAPTERS:.*?\]\s*/);
      const chaptersTag = chaptersMatch ? chaptersMatch[0] : "";
      const cleanNotes = cleanNotesFromRental(book.notes);

      await onUpdateBook(book.id, {
        notes: `${chaptersTag}${formatRentalInfo(updatedRental)} ${cleanNotes}`.trim(),
        status: "Completed" // Mark as completed on return
      });
    } catch (err) {
      console.error("Failed to return book:", err);
    }
  };

  const handleOpenReissue = (book: Book, rental: RentalInfo) => {
    // Default to +7 days from current returnBy date or today, whichever is later
    const baseDate = rental.returnBy > todayStr ? new Date(rental.returnBy) : new Date();
    baseDate.setDate(baseDate.getDate() + 7);
    const dateStr = baseDate.toISOString().split("T")[0];
    
    setReissueBook(book);
    setReissueDate(dateStr);
    setReissueError(null);
  };

  const handleConfirmReissue = async () => {
    if (!reissueBook || !reissueDate) return;
    
    if (reissueDate < todayStr) {
      setReissueError("Return due date cannot be in the past.");
      return;
    }

    try {
      const currentRental = parseRentalInfo(reissueBook.notes);
      if (!currentRental) return;

      const updatedRental: RentalInfo = {
        issuedAt: new Date().toISOString(), // Save new reissue timestamp
        returnBy: reissueDate,
        reissueCount: (currentRental.reissueCount || 0) + 1,
        returnedAt: undefined // Ensure returnedAt is cleared/empty
      };

      const chaptersMatch = reissueBook.notes?.match(/\[CHAPTERS:.*?\]\s*/);
      const chaptersTag = chaptersMatch ? chaptersMatch[0] : "";
      const cleanNotes = cleanNotesFromRental(reissueBook.notes);

      await onUpdateBook(reissueBook.id, {
        notes: `${chaptersTag}${formatRentalInfo(updatedRental)} ${cleanNotes}`.trim(),
        status: "Reading" // Keep it in reading mode on reissue
      });

      setReissueBook(null);
    } catch (err) {
      console.error("Failed to reissue book:", err);
    }
  };

  const handleReborrowBook = async (book: Book) => {
    // Automatically borrow again for 14 days
    const nextTwoWeeks = new Date();
    nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
    const dateStr = nextTwoWeeks.toISOString().split("T")[0];

    try {
      const updatedRental: RentalInfo = {
        issuedAt: new Date().toISOString(),
        returnBy: dateStr,
        reissueCount: 0,
        returnedAt: undefined
      };

      const chaptersMatch = book.notes?.match(/\[CHAPTERS:.*?\]\s*/);
      const chaptersTag = chaptersMatch ? chaptersMatch[0] : "";
      const cleanNotes = cleanNotesFromRental(book.notes);

      await onUpdateBook(book.id, {
        notes: `${chaptersTag}${formatRentalInfo(updatedRental)} ${cleanNotes}`.trim(),
        status: "Reading" // Back to reading
      });
    } catch (err) {
      console.error("Failed to re-borrow book:", err);
    }
  };

  const getDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Rent Library</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
            Manage rented books, due dates, reissues, and borrow history
          </p>
        </div>

        <button
          onClick={onOpenAddBook}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-md glow-primary cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Rent A Book</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Borrowed */}
        <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute right-4 top-4 h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Active Borrowed</span>
          <span className="text-3xl font-extrabold text-white mt-2 block">{totalBorrowed}</span>
          <span className="text-[10px] text-slate-500 block mt-1 uppercase">Currently out of library</span>
        </div>

        {/* Overdue */}
        <div className={`p-5 rounded-2xl border bg-slate-900/40 backdrop-blur-xl relative overflow-hidden transition-colors duration-300 ${
          overdueCount > 0 ? "border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]" : "border-white/5"
        }`}>
          <div className={`absolute right-4 top-4 h-8 w-8 rounded-lg flex items-center justify-center ${
            overdueCount > 0 ? "bg-rose-500/10 text-rose-400 animate-pulse" : "bg-slate-500/10 text-slate-400"
          }`}>
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Overdue Books</span>
          <span className={`text-3xl font-extrabold mt-2 block ${overdueCount > 0 ? "text-rose-455" : "text-white"}`}>
            {overdueCount}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1 uppercase">Require immediate return</span>
        </div>

        {/* Total Returned */}
        <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute right-4 top-4 h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Returned History</span>
          <span className="text-3xl font-extrabold text-white mt-2 block">{totalReturned}</span>
          <span className="text-[10px] text-slate-500 block mt-1 uppercase">Safely returned logs</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-slate-900/50 border border-white/5 rounded-2xl px-4 py-3 max-w-md">
        <Search className="h-4 w-4 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="bg-transparent border-0 outline-none text-slate-200 text-sm w-full placeholder-slate-500 focus:ring-0"
        />
      </div>

      {/* Active Borrowed Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-indigo-400" />
          <span>Active Rented Books ({activeRentals.length})</span>
        </h2>

        {activeRentals.length === 0 ? (
          <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center bg-slate-900/20">
            <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2.5" />
            <h4 className="text-sm font-bold text-slate-350">No active library books found</h4>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">
              Add a book and set its source to Borrowed/Library to track it here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRentals.map(({ book, rental }) => {
              const daysRemaining = getDaysRemaining(rental.returnBy);
              const isOverdue = daysRemaining < 0;
              
              return (
                <div 
                  key={book.id} 
                  className={`p-5 rounded-2xl border bg-slate-950/40 backdrop-blur-xl flex gap-4 transition-all duration-300 relative group ${
                    isOverdue ? "border-rose-500/25 hover:border-rose-500/40 shadow-sm" : "border-white/5 hover:border-white/10"
                  }`}
                >
                  {/* Book Cover */}
                  <div 
                    style={{ background: book.cover_url?.startsWith("linear-gradient") ? book.cover_url : "none", backgroundColor: "#1e293b" }}
                    className="w-20 h-28 rounded-lg overflow-hidden shrink-0 border border-white/5 relative shadow-md"
                  >
                    {!book.cover_url?.startsWith("linear-gradient") && book.cover_url && (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    )}
                    {(!book.cover_url) && <BookOpen className="h-6 w-6 text-slate-655 m-auto" />}
                  </div>

                  {/* Rental Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-white truncate pr-4">{book.title}</h4>
                        {isOverdue ? (
                          <span className="shrink-0 text-[8px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                            OVERDUE
                          </span>
                        ) : (
                          <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            daysRemaining <= 2 
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse" 
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          }`}>
                            {daysRemaining === 0 ? "Due Today" : daysRemaining === 1 ? "1 Day Left" : `${daysRemaining} Days Left`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">by {book.author}</p>
                    </div>

                    <div className="space-y-1 mt-2 text-[10px] uppercase font-mono tracking-wider text-slate-500 border-t border-white/5 pt-2">
                      <div className="flex justify-between">
                        <span>Issued On:</span>
                        <span className="text-slate-350 text-right">{formatDateTime(rental.issuedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span className={`font-semibold ${isOverdue ? "text-rose-400" : "text-slate-350"}`}>
                          {rental.returnBy}
                        </span>
                      </div>
                      {rental.reissueCount > 0 && (
                        <div className="flex justify-between text-amber-500/80">
                          <span>Reissues:</span>
                          <span>{rental.reissueCount} times</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-1">
                      <button
                        onClick={() => handleReturnBook(book, rental)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] uppercase tracking-widest cursor-pointer text-center transition-colors shadow-sm"
                      >
                        Return
                      </button>
                      <button
                        onClick={() => handleOpenReissue(book, rental)}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-950 border border-indigo-500/20 hover:border-indigo-500/50 text-indigo-300 font-semibold text-[10px] uppercase tracking-widest cursor-pointer text-center transition-colors"
                      >
                        Reissue
                      </button>
                      <button
                        onClick={() => onOpenEditBook(book)}
                        className="px-2 py-1.5 rounded-lg bg-slate-900 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white text-[10px] cursor-pointer transition-colors"
                        title="Edit Book Details"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History Log Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <HistoryIcon className="h-4.5 w-4.5 text-emerald-400" />
          <span>Returned History Log ({returnedHistory.length})</span>
        </h2>

        {returnedHistory.length === 0 ? (
          <div className="p-6 border border-dashed border-white/5 rounded-2xl text-center bg-slate-900/5">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">No past returns logged yet</span>
          </div>
        ) : (
          <div className="border border-white/5 rounded-2xl bg-slate-950/30 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/50 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="p-4">Book details</th>
                  <th className="p-4">Issued At</th>
                  <th className="p-4">Returned At</th>
                  <th className="p-4 text-center">Reissues</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {returnedHistory.map(({ book, rental }) => (
                  <tr key={book.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm font-sans">{book.title}</span>
                        <span className="text-slate-455 text-[10px] mt-0.5 font-sans">by {book.author}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">{formatDateTime(rental.issuedAt)}</td>
                    <td className="p-4 text-emerald-450">{formatDateTime(rental.returnedAt)}</td>
                    <td className="p-4 text-center text-slate-400">{rental.reissueCount || 0}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleReborrowBook(book)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[9px] uppercase tracking-widest cursor-pointer transition-colors shadow-sm"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Issue Again</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reissue Return Date Dialog Modal */}
      <AnimatePresence>
        {reissueBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReissueBook(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm p-6 rounded-2xl border border-white/10 bg-slate-950 text-slate-100 shadow-2xl z-10"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                <RefreshCw className="h-4.5 w-4.5 text-indigo-400" />
                <span>Reissue / Extend Return</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Set a new return due date for <strong className="text-white">"{reissueBook.title}"</strong>. This will increment the reissue count and save the reissue date/time.
              </p>

              {reissueError && (
                <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-350 text-[10px] uppercase font-semibold rounded-lg">
                  {reissueError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1.5 pl-0.5">New Return Due Date</label>
                  <input
                    type="date"
                    required
                    value={reissueDate}
                    onChange={(e) => setReissueDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm glass-input bg-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setReissueBook(null)}
                    className="px-4 py-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReissue}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Reissue Book
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
