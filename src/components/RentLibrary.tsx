"use client";

import React, { useState, useEffect } from "react";
import { Book, RentalInfo, parseRentalInfo, formatRentalInfo, cleanNotesFromRental, ReadingLog, parseBookOrder, formatBookOrder, cleanNotesFromOrder } from "@/utils/db";
import { SortableGrid } from "./SortableGrid";
import { 
  Clock, 
  Calendar, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  Search, 
  BookOpen,
  CalendarCheck,
  Plus,
  RefreshCw,
  TrendingUp,
  FileText,
  Pin,
  Trash2,
  Edit,
  X,
  SlidersHorizontal,
  Bookmark,
  Star,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RentLibraryProps {
  books: Book[];
  readingLogs?: ReadingLog[];
  onUpdateBook: (id: string, data: Partial<Book>) => Promise<void>;
  onDeleteBook: (id: string) => Promise<void>;
  onOpenAddBook: () => void;
  onOpenEditBook: (book: Book) => void;
  onOpenDailyLog: (bookId?: string) => void;
}

const parseBookNotes = (str: string) => {
  let chapters: { name: string; pages: number }[] = [];
  let chapter = "";
  let status = "";
  let notes = str || "";

  // Parse chapters metadata tag
  const chaptersMatch = notes.match(/\[CHAPTERS:(.*?)\]\s*/);
  if (chaptersMatch) {
    const rawChapters = chaptersMatch[1].split("|").filter(Boolean);
    chapters = rawChapters.map((raw) => {
      const colonIdx = raw.lastIndexOf(":");
      if (colonIdx !== -1) {
        const name = raw.substring(0, colonIdx);
        const pages = parseInt(raw.substring(colonIdx + 1), 10);
        return { name, pages: isNaN(pages) ? 0 : pages };
      }
      return { name: raw, pages: 0 };
    });
    notes = notes.replace(/\[CHAPTERS:.*?\]\s*/, "");
  }

  // Parse active log metadata tag if any
  const chapterMatch = notes.match(/\[ACTIVE_LOG:(.*?)\|(.*?)\|(.*?)\]\s*/);
  if (chapterMatch) {
    chapter = chapterMatch[1];
    status = chapterMatch[2] || "In Progress";
    notes = notes.replace(/\[ACTIVE_LOG:.*?\]\s*/, "");
  }

  // Parse rental metadata tag
  notes = notes.replace(/\[RENTAL:.*?\]\s*/, "");

  return { chapters, chapter, status, notes };
};

export const RentLibrary: React.FC<RentLibraryProps> = ({
  books,
  readingLogs = [],
  onUpdateBook,
  onDeleteBook,
  onOpenAddBook,
  onOpenEditBook,
  onOpenDailyLog,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (!isDragging) {
      setLocalBooks(books);
    }
  }, [books, isDragging]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [ratingFilter, setRatingFilter] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState<"dueDate" | "title" | "recent" | "custom">("custom");
  const [showFilters, setShowFilters] = useState(false);

  const handleDragEnd = async () => {
    try {
      const updates = [];
      for (const localBook of localBooks) {
        const originalBook = books.find((b) => b.id === localBook.id);
        if (originalBook && originalBook.notes !== localBook.notes) {
          updates.push(onUpdateBook(localBook.id, { notes: localBook.notes }));
        }
      }
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (err) {
      console.error("Failed to sync drag order:", err);
    } finally {
      setIsDragging(false);
    }
  };

  const [reissueBook, setReissueBook] = useState<Book | null>(null);
  const [reissueDate, setReissueDate] = useState("");
  const [reissueError, setReissueError] = useState<string | null>(null);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  // Parse all rental books
  const rentalBooks = localBooks.map(b => {
    const rental = parseRentalInfo(b.notes);
    if (!rental || rental.events.length === 0) return null;
    const activeEvent = rental.events[rental.events.length - 1];
    return {
      book: b,
      rental: {
        returnedAt: rental.returnedAt,
        events: rental.events,
        // Computed Flat Getters for backward compatibility
        issuedAt: activeEvent.issuedAt,
        returnBy: activeEvent.returnBy,
        reissueCount: rental.events.length - 1
      }
    };
  }).filter(Boolean) as { 
    book: Book; 
    rental: RentalInfo & { issuedAt: string; returnBy: string; reissueCount: number };
  }[];

  const todayStr = new Date().toISOString().split("T")[0];

  // Filter and Sort logic
  const filteredRentals = rentalBooks
    .filter((item) => {
      const matchSearch =
        item.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.book.genre && item.book.genre.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && !item.rental.returnedAt) ||
        (statusFilter === "Returned" && !!item.rental.returnedAt) ||
        (statusFilter === "Overdue" && !item.rental.returnedAt && item.rental.returnBy < todayStr) ||
        item.book.status === statusFilter;

      const matchRating = ratingFilter === "All" || item.book.rating === ratingFilter;

      return matchSearch && matchStatus && matchRating;
    })
    .sort((a, b) => {
      // Pin favorites to top
      if (a.book.is_favorite && !b.book.is_favorite) return -1;
      if (!a.book.is_favorite && b.book.is_favorite) return 1;

      if (sortBy === "title") return a.book.title.localeCompare(b.book.title);
      if (sortBy === "dueDate") {
        // Returned books at the bottom
        if (a.rental.returnedAt && !b.rental.returnedAt) return 1;
        if (!a.rental.returnedAt && b.rental.returnedAt) return -1;
        return a.rental.returnBy.localeCompare(b.rental.returnBy);
      }
      if (sortBy === "custom") {
        const orderA = parseBookOrder(a.book.notes);
        const orderB = parseBookOrder(b.book.notes);
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.book.created_at || 0).getTime() - new Date(a.book.created_at || 0).getTime();
      }
      // default: recent/created_at
      return new Date(b.book.created_at || 0).getTime() - new Date(a.book.created_at || 0).getTime();
    });

  // Calculate metrics stats
  const totalBorrowed = rentalBooks.filter(item => !item.rental.returnedAt).length;
  const overdueCount = rentalBooks.filter(item => 
    !item.rental.returnedAt && item.rental.returnBy < todayStr
  ).length;
  const totalReturned = rentalBooks.filter(item => !!item.rental.returnedAt).length;

  const handleReturnBook = async (book: Book, rental: RentalInfo) => {
    try {
      const returnTimestamp = new Date().toISOString();
      const updatedEvents = [...rental.events];
      if (updatedEvents.length > 0) {
        updatedEvents[updatedEvents.length - 1] = {
          ...updatedEvents[updatedEvents.length - 1],
          returnedAt: returnTimestamp,
        };
      }

      const updatedRental: RentalInfo = {
        returnedAt: returnTimestamp,
        events: updatedEvents,
      };

      const chaptersMatch = book.notes?.match(/\[CHAPTERS:.*?\]\s*/);
      const chaptersTag = chaptersMatch ? chaptersMatch[0] : "";
      const cleanNotes = cleanNotesFromRental(book.notes);

      await onUpdateBook(book.id, {
        notes: `${chaptersTag}${formatRentalInfo(updatedRental)} ${cleanNotes}`.trim(),
        status: "Completed"
      });
    } catch (err) {
      console.error("Failed to return book:", err);
    }
  };

  const handleOpenReissue = (book: Book, rental: RentalInfo) => {
    const activeEvent = rental.events[rental.events.length - 1];
    const returnBy = activeEvent?.returnBy || todayStr;
    const baseDate = returnBy > todayStr ? new Date(returnBy) : new Date();
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
        returnedAt: undefined,
        events: [
          ...currentRental.events,
          { issuedAt: new Date().toISOString(), returnBy: reissueDate }
        ]
      };

      const chaptersMatch = reissueBook.notes?.match(/\[CHAPTERS:.*?\]\s*/);
      const chaptersTag = chaptersMatch ? chaptersMatch[0] : "";
      const cleanNotes = cleanNotesFromRental(reissueBook.notes);

      await onUpdateBook(reissueBook.id, {
        notes: `${chaptersTag}${formatRentalInfo(updatedRental)} ${cleanNotes}`.trim(),
        status: "Reading"
      });

      setReissueBook(null);
    } catch (err) {
      console.error("Failed to reissue book:", err);
    }
  };

  const handleReborrowBook = async (book: Book) => {
    const nextTwoWeeks = new Date();
    nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
    const dateStr = nextTwoWeeks.toISOString().split("T")[0];

    try {
      const currentRental = parseRentalInfo(book.notes);
      const previousEvents = currentRental ? currentRental.events : [];

      const updatedRental: RentalInfo = {
        returnedAt: undefined,
        events: [
          ...previousEvents,
          { issuedAt: new Date().toISOString(), returnBy: dateStr }
        ]
      };

      const chaptersMatch = book.notes?.match(/\[CHAPTERS:.*?\]\s*/);
      const chaptersTag = chaptersMatch ? chaptersMatch[0] : "";
      const cleanNotes = cleanNotesFromRental(book.notes);

      await onUpdateBook(book.id, {
        notes: `${chaptersTag}${formatRentalInfo(updatedRental)} ${cleanNotes}`.trim(),
        status: "Reading"
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
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  const getStatusBadgeClass = (status: Book["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "Reading":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/25";
      default:
        return "bg-slate-500/15 text-slate-400 border border-white/5";
    }
  };

  const getStatusIcon = (status: Book["status"]) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-3 w-3 shrink-0" />;
      case "Reading":
        return <BookOpen className="h-3 w-3 shrink-0" />;
      default:
        return <Clock className="h-3 w-3 shrink-0" />;
    }
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
          <span className="text-[10px] text-slate-500 block mt-1 uppercase font-mono">Currently out of library</span>
        </div>

        {/* Overdue */}
        <div className={`p-5 rounded-2xl border bg-slate-900/40 backdrop-blur-xl relative overflow-hidden transition-colors duration-300 ${
          overdueCount > 0 ? "border-rose-500/25 shadow-[0_0_25px_rgba(244,63,94,0.08)]" : "border-white/5"
        }`}>
          <div className={`absolute right-4 top-4 h-8 w-8 rounded-lg flex items-center justify-center ${
            overdueCount > 0 ? "bg-rose-500/10 text-rose-400 animate-pulse" : "bg-slate-500/10 text-slate-400"
          }`}>
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Overdue Books</span>
          <span className={`text-3xl font-extrabold mt-2 block ${overdueCount > 0 ? "text-rose-400" : "text-white"}`}>
            {overdueCount}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1 uppercase font-mono">Require immediate return</span>
        </div>

        {/* Total Returned */}
        <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute right-4 top-4 h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider font-mono">Returned History</span>
          <span className="text-3xl font-extrabold text-white mt-2 block">{totalReturned}</span>
          <span className="text-[10px] text-slate-500 block mt-1 uppercase font-mono">Safely returned logs</span>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4.5 w-4.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, genre..."
              className="w-full pl-9 pr-4 py-2.5 text-sm glass-input placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                showFilters || statusFilter !== "All" || ratingFilter !== "All"
                  ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"
                  : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
              <span>Filters</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 text-sm glass-input bg-slate-900 border-white/5 font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              <option value="custom">Sort: Drag & Drop</option>
              <option value="dueDate">Sort by: Due Date</option>
              <option value="recent">Sort by: Recent</option>
              <option value="title">Sort by: Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold block mb-1.5 uppercase font-mono">Rental Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 text-xs glass-input bg-slate-900 border-white/5"
                >
                  <option value="All">All Rentals</option>
                  <option value="Active">Active Borrowed (Not Returned)</option>
                  <option value="Overdue">Overdue Books</option>
                  <option value="Returned">Returned History</option>
                  <option value="Reading">Status: Reading</option>
                  <option value="Not Started">Status: Not Started</option>
                  <option value="Completed">Status: Completed</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-xs font-semibold block mb-1.5 uppercase font-mono">Minimum Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value === "All" ? "All" : Number(e.target.value))}
                  className="w-full px-4 py-2 text-xs glass-input bg-slate-900 border-white/5"
                >
                  <option value="All">Any Rating</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value="4">⭐⭐⭐⭐ (4+ Stars)</option>
                  <option value="3">⭐⭐⭐ (3+ Stars)</option>
                  <option value="2">⭐⭐ (2+ Stars)</option>
                  <option value="1">⭐ (1+ Star)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards List Grid */}
      <div className="space-y-4">
        {filteredRentals.length === 0 ? (
          <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center bg-slate-900/20">
            <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2.5" />
            <h4 className="text-sm font-bold text-slate-300">No rented books matching constraints found</h4>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">
              Add a book and set its source to Borrowed/Library to track it here
            </p>
          </div>
        ) : (
          <SortableGrid
            items={filteredRentals.map(item => ({ id: item.book.id, ...item }))}
            sortBy={sortBy}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onReorder={(sourceIndex, targetIndex) => {
              const newFiltered = [...filteredRentals];
              const [removed] = newFiltered.splice(sourceIndex, 1);
              newFiltered.splice(targetIndex, 0, removed);

              const updatedBooks = newFiltered.map((item, i) => {
                const newOrder = i * 1000;
                const cleanNotes = cleanNotesFromOrder(item.book.notes);
                const newNotes = `${formatBookOrder(newOrder)} ${cleanNotes}`.trim();
                return { ...item.book, notes: newNotes };
              });

              setLocalBooks((prev) =>
                prev.map((b) => {
                  const updated = updatedBooks.find((ub) => ub.id === b.id);
                  return updated ? updated : b;
                })
              );
            }}
            renderItem={({ book, rental }, index, isDraggingItem, isOver, dragProps) => {
              const progressPercent = Math.round((book.current_page / book.total_pages) * 100);
              const daysRemaining = getDaysRemaining(rental.returnBy);
              const isOverdue = daysRemaining < 0 && !rental.returnedAt;

              return (
                <motion.div
                  layout
                  {...dragProps}
                  className={`rounded-3xl border glass-card overflow-hidden flex flex-col justify-between h-full relative transition-all duration-305 ${
                    isOver
                      ? "border-indigo-500 bg-indigo-500/10 scale-102 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse"
                      : isOverdue 
                        ? "border-rose-500/25 shadow-[0_0_20px_rgba(244,63,94,0.05)]" 
                        : "border-white/5 hover:border-white/10"
                  } ${isDraggingItem ? "opacity-30 scale-95" : ""} ${sortBy === "custom" ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  {/* Pin button (favorite) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateBook(book.id, { is_favorite: !book.is_favorite });
                    }}
                    className={`absolute top-4 right-4 z-10 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                      book.is_favorite
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                    }`}
                  >
                    <Pin className={`h-4 w-4 ${book.is_favorite ? "fill-amber-400" : ""}`} />
                  </button>

                  {/* Cover & metadata */}
                  <div className="p-5 flex gap-4 border-b border-white/5">
                    <div
                      style={{
                        background: book.cover_url?.startsWith("linear-gradient") ? book.cover_url : "none",
                        backgroundColor: book.cover_url?.startsWith("linear-gradient") ? "transparent" : "#1e293b",
                      }}
                      className="w-16 h-24 rounded-lg overflow-hidden shadow-md flex items-center justify-center border border-white/10 shrink-0"
                    >
                      {book.cover_url && !book.cover_url.startsWith("linear-gradient") && (
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      )}
                      {(!book.cover_url) && <BookOpen className="h-5 w-5 text-slate-500" />}
                    </div>

                    <div className="overflow-hidden flex flex-col justify-between py-0.5 flex-1">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1">
                          <div className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadgeClass(book.status)}`}>
                            {getStatusIcon(book.status)}
                            <span>{book.status}</span>
                          </div>
                          
                          {/* Overdue/Remaining Badge */}
                          {rental.returnedAt ? (
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Returned
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                              Overdue
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                              daysRemaining <= 2 
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse" 
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            }`}>
                              {daysRemaining === 0 ? "Due Today" : daysRemaining === 1 ? "1 Day Left" : `${daysRemaining} Days Left`}
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBook(book);
                          }}
                          className="font-extrabold text-white text-base leading-snug truncate pr-6 cursor-pointer hover:text-indigo-400 transition-colors"
                          title="Click to view details"
                        >
                          {book.title}
                        </h3>
                        <p className="text-slate-450 text-xs truncate leading-none">By {book.author}</p>
                      </div>

                      {book.genre && (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-bold px-2 py-0.5 rounded-lg border border-indigo-500/15 w-fit uppercase">
                          {book.genre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rental timeline summary */}
                  <div className="px-5 py-4 border-b border-white/5 bg-slate-900/10 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-450 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Date Borrowed</span>
                      </span>
                      <span className="text-slate-200">
                        {new Date(rental.events[0].issuedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-450 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Return By / Status</span>
                      </span>
                      {rental.returnedAt ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Returned</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="flex items-center gap-1 text-rose-400 animate-pulse">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Overdue ({Math.abs(daysRemaining)}d)</span>
                        </span>
                      ) : (
                        <span className="text-slate-200">
                          {new Date(rental.returnBy).toLocaleDateString()} ({daysRemaining}d left)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-455">Progress</span>
                        <span className="text-white">{progressPercent}%</span>
                      </div>

                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                        />
                      </div>
                    </div>

                    {/* Rating display */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex gap-0.5 items-center">
                        <span className="text-xs font-semibold text-slate-450 mr-1.5">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateBook(book.id, { rating: star });
                            }}
                            className="text-slate-500 hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                book.rating && star <= book.rating ? "text-amber-400 fill-amber-400" : ""
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes Summary */}
                    {book.notes && (() => {
                      const { notes } = parseBookNotes(book.notes);
                      if (!notes) return null;
                      return (
                        <p className="text-xs text-slate-500 italic line-clamp-2 border-t border-white/5 pt-3">
                          "{notes}"
                        </p>
                      );
                    })()}
                  </div>

                  {/* Card Action Footers */}
                  <div className="px-5 py-3.5 bg-black/30 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditBook(book);
                        }}
                        className="flex items-center gap-1.5 text-xs text-slate-455 hover:text-white transition-all cursor-pointer font-medium"
                        title="Edit Book Details"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBook(book.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-455 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete Book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex gap-1.5">
                      {/* Return/Reissue buttons for active rentals */}
                      {!rental.returnedAt ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReturnBook(book, rental);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                          >
                            Return
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReissue(book, rental);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-950 border border-indigo-500/20 hover:border-indigo-500/50 text-indigo-300 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            Reissue
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReborrowBook(book);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shadow shadow-indigo-600/15"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Issue Again</span>
                        </button>
                      )}

                      {/* Log session button */}
                      {!rental.returnedAt && (book.status === "Reading" || book.status === "Not Started") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDailyLog(book.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/5 hover:border-white/10 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                          title="Log Progress Session"
                        >
                          <Bookmark className="h-3 w-3 text-indigo-400" />
                          <span>Log</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }}
          />
        )}
      </div>

      {/* Book Details Modal Sheet */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedBook(null);
                  setExpandedChapter(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col md:flex-row gap-6 items-start mt-4">
                {/* Left: Book Cover preview */}
                <div className="w-full md:w-44 shrink-0 space-y-4">
                  <div
                    style={{
                      background: selectedBook.cover_url?.startsWith("linear-gradient") ? selectedBook.cover_url : "none",
                      backgroundColor: selectedBook.cover_url?.startsWith("linear-gradient") ? "transparent" : "#1e293b",
                    }}
                    className="w-full h-60 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center border border-white/10 relative"
                  >
                    {selectedBook.cover_url && !selectedBook.cover_url.startsWith("linear-gradient") && (
                      <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-full h-full object-cover" />
                    )}
                    {(!selectedBook.cover_url) && <BookOpen className="h-10 w-10 text-slate-500" />}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/5 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(selectedBook.status)}`}>
                      {getStatusIcon(selectedBook.status)}
                      <span className="ml-1">{selectedBook.status}</span>
                    </div>

                    {selectedBook.genre && (
                      <div className="text-center py-2 px-3 rounded-xl border border-indigo-500/10 bg-indigo-500/5 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        {selectedBook.genre}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Full Metadata Details */}
                <div className="flex-1 space-y-5 w-full">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-white leading-snug">{selectedBook.title}</h2>
                    <p className="text-slate-400 text-sm font-medium">By {selectedBook.author}</p>
                  </div>

                  {/* Progress info */}
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Reading Progress</span>
                      <span className="text-white font-mono">
                        {selectedBook.current_page} / {selectedBook.total_pages} pages ({Math.round((selectedBook.current_page / selectedBook.total_pages) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 border border-white/5 overflow-hidden">
                      <div
                        style={{ width: `${Math.round((selectedBook.current_page / selectedBook.total_pages) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Details Grid Table */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs border-t border-white/5 pt-4">
                    {selectedBook.publisher && (
                      <div>
                        <span className="text-slate-500 block">Publisher</span>
                        <span className="text-slate-200 font-semibold">{selectedBook.publisher}</span>
                      </div>
                    )}
                    {selectedBook.isbn && (
                      <div>
                        <span className="text-slate-500 block">ISBN</span>
                        <span className="text-slate-200 font-semibold">{selectedBook.isbn}</span>
                      </div>
                    )}
                    {selectedBook.purchase_date && (
                      <div>
                        <span className="text-slate-500 block">
                          {selectedBook.source === "Borrowed" || selectedBook.source === "Library" ? "Date Borrowed" : "Purchase Date"}
                        </span>
                        <span className="text-slate-200 font-semibold">{selectedBook.purchase_date}</span>
                      </div>
                    )}
                    {selectedBook.date_started && (
                      <div>
                        <span className="text-slate-500 block">Date Started</span>
                        <span className="text-slate-200 font-semibold">{selectedBook.date_started}</span>
                      </div>
                    )}
                    {selectedBook.date_finished && (
                      <div>
                        <span className="text-slate-500 block">Date Finished</span>
                        <span className="text-slate-200 font-semibold">{selectedBook.date_finished}</span>
                      </div>
                    )}
                    {selectedBook.source && (
                      <div>
                        <span className="text-slate-500 block">Source</span>
                        <span className="text-slate-200 font-semibold">{selectedBook.source}</span>
                      </div>
                    )}
                  </div>

                  {/* Rental details tag inside modal */}
                  {(() => {
                    const r = parseRentalInfo(selectedBook.notes);
                    if (!r) return null;

                    const getPagesInPeriod = (startIso: string, endIso?: string) => {
                      const start = new Date(startIso).getTime();
                      const end = endIso ? new Date(endIso).getTime() : Date.now();
                      return readingLogs
                        .filter(log => log.book_id === selectedBook.id)
                        .filter(log => {
                          const logDate = log.created_at ? new Date(log.created_at) : new Date(log.date + "T23:59:59");
                          const logTime = logDate.getTime();
                          return logTime >= start && logTime <= end;
                        })
                        .reduce((sum, log) => sum + (log.pages_read || 0), 0);
                    };

                    const totalReissues = r.events.length - 1;

                    return (
                      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 space-y-4 mt-4">
                        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">RENTAL LEDGER HISTORY</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            {r.returnedAt ? `COMPLETED (Reissued ${totalReissues} times)` : `ACTIVE (Reissued ${totalReissues} times)`}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {r.events.map((ev, idx) => {
                            const nextEvent = r.events[idx + 1];
                            const periodEnd = ev.returnedAt || nextEvent?.issuedAt || r.returnedAt;
                            const pagesRead = getPagesInPeriod(ev.issuedAt, periodEnd);
                            const percent = Math.min(100, Math.round((pagesRead / selectedBook.total_pages) * 100));
                            
                            const isCurrentPeriod = !nextEvent && !r.returnedAt;

                            return (
                              <div key={idx} className="relative pl-4 border-l border-white/10 space-y-1">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 ${
                                  isCurrentPeriod 
                                    ? "bg-indigo-500 border-indigo-400 animate-pulse" 
                                    : "bg-slate-800 border-slate-700"
                                }`} />

                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-200">
                                    {idx === 0 ? "Initial Issue" : `Reissue #${idx}`}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {formatDateTime(ev.issuedAt)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
                                  <div>
                                    <span>Due Date: </span>
                                    <span className="text-slate-350">{ev.returnBy}</span>
                                  </div>
                                  <div className="text-right">
                                    <span>Progress: </span>
                                    <span className="text-slate-300 font-semibold">{pagesRead} pages read ({percent}%)</span>
                                  </div>
                                </div>

                                {/* Period status details */}
                                <div className="text-[10px] font-mono text-slate-500">
                                  {ev.returnedAt ? (
                                    <span className="text-emerald-400">Returned on {formatDateTime(ev.returnedAt)}</span>
                                  ) : nextEvent ? (
                                    <span>Reissued on {formatDateTime(nextEvent.issuedAt)}</span>
                                  ) : r.returnedAt ? (
                                    <span className="text-emerald-400">Returned on {formatDateTime(r.returnedAt)}</span>
                                  ) : (
                                    <span className="text-indigo-400">Current Borrow Period (Active)</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {selectedBook.notes && (() => {
                    const { chapters, notes } = parseBookNotes(selectedBook.notes);
                    
                    const bookLogs = readingLogs.filter((log) => log.book_id === selectedBook.id);
                    const chapterPagesRead: Record<string, number> = {};
                    const chapterLoggedStatus: Record<string, "Completed" | "In Progress" | "Not Started"> = {};
                    
                    chapters.forEach((ch) => {
                      chapterPagesRead[ch.name] = 0;
                      chapterLoggedStatus[ch.name] = "Not Started";
                    });

                    const cleanName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

                    bookLogs.forEach((log) => {
                      if (log.notes) {
                        const logMatch = log.notes.match(/^\[CHAPTER:([^\]|]*?)(?:\|STATUS:([^\]]*?))?\]/);
                        if (logMatch) {
                          const chName = logMatch[1].trim();
                          const status = (logMatch[2] || "In Progress").trim() as "Completed" | "In Progress";
                          
                          const targetChapter = chapters.find((c) => cleanName(c.name) === cleanName(chName));
                          if (targetChapter) {
                            const chKey = targetChapter.name;
                            chapterPagesRead[chKey] = (chapterPagesRead[chKey] || 0) + Number(log.pages_read || 0);
                            
                            if (status === "Completed") {
                              chapterLoggedStatus[chKey] = "Completed";
                            } else if (chapterLoggedStatus[chKey] !== "Completed") {
                              chapterLoggedStatus[chKey] = "In Progress";
                            }
                          }
                        }
                      }
                    });

                    return (
                      <div className="space-y-4 border-t border-white/5 pt-4">
                        {notes && (
                          <div className="space-y-1">
                            <span className="text-slate-500 text-xs block">Personal Review & Notes</span>
                            <p className="text-slate-300 text-sm italic leading-relaxed">"{notes}"</p>
                          </div>
                        )}

                        {chapters.length > 0 && (
                          <div className="space-y-2.5">
                            <span className="text-slate-500 text-xs block uppercase tracking-wider font-mono">Chapters Breakdown</span>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                              {chapters.map((ch, idx) => {
                                const isExpanded = expandedChapter === ch.name;
                                const isCompleted = chapterLoggedStatus[ch.name] === "Completed";
                                const pagesDone = chapterPagesRead[ch.name] || 0;
                                const pct = Math.min(100, Math.round((pagesDone / ch.pages) * 100));

                                return (
                                  <div key={idx} className="p-3 rounded-2xl border border-white/5 bg-slate-950/20 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`h-2 w-2 rounded-full ${isCompleted ? "bg-emerald-500" : pct > 0 ? "bg-sky-500" : "bg-slate-700"}`} />
                                        <span className="font-bold text-slate-200 text-xs truncate">{ch.name}</span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-450 font-mono shrink-0">
                                          {pagesDone}/{ch.pages} p. ({pct}%)
                                        </span>
                                        <button
                                          onClick={() => setExpandedChapter(isExpanded ? null : ch.name)}
                                          className="text-slate-500 hover:text-white p-0.5"
                                        >
                                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Progress track */}
                                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                      <div style={{ width: `${pct}%` }} className={`h-full ${isCompleted ? "bg-emerald-500" : "bg-sky-500"}`} />
                                    </div>

                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="text-[11px] text-slate-450 font-mono space-y-1 pt-1.5 border-t border-white/5 mt-1.5"
                                        >
                                          <div className="flex justify-between">
                                            <span>Target Pages:</span>
                                            <span>{ch.pages} pages</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Pages Read:</span>
                                            <span>{pagesDone} pages</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Status:</span>
                                            <span className={isCompleted ? "text-emerald-400 font-semibold" : pct > 0 ? "text-sky-400" : ""}>
                                              {chapterLoggedStatus[ch.name]}
                                            </span>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <p className="text-xs text-slate-400 leading-relaxed mb-4 font-sans">
                Set a new return due date for <strong className="text-white">"{reissueBook.title}"</strong>. This will increment the reissue count and save the reissue date/time.
              </p>

              {reissueError && (
                <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-350 text-[10px] uppercase font-semibold rounded-lg font-mono">
                  {reissueError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1.5 pl-0.5 font-mono">New Return Due Date</label>
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
