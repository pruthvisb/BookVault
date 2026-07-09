"use client";

import React, { useState, useEffect } from "react";
import { Book, ReadingLog, parseBookOrder, formatBookOrder, cleanNotesFromOrder, parseRentalInfo } from "@/utils/db";
import { SortableGrid } from "./SortableGrid";
import {
  Search,
  BookOpen,
  CheckCircle,
  Clock,
  Star,
  Pin,
  Trash2,
  Edit,
  SlidersHorizontal,
  X,
  BookmarkCheck,
  Bookmark,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const parseBookNotes = (rawNotes: string | undefined) => {
  if (!rawNotes) return { chapters: [] as { name: string; pages: number }[], chapter: "", status: "", notes: "" };
  
  let notes = rawNotes;
  // Clean custom system metadata tags
  notes = notes.replace(/\[RENTAL:.*?\]\s*/g, "");
  notes = notes.replace(/\[ORDER:\d+\]\s*/g, "");

  let chapters: { name: string; pages: number }[] = [];
  let chapter = "";
  let status = "";

  const chaptersMatch = notes.match(/^\[CHAPTERS:(.*?)\]\s*([\s\S]*)/);
  if (chaptersMatch) {
    const rawChapters = chaptersMatch[1].split("|").filter(Boolean);
    chapters = rawChapters.map((raw) => {
      const colonIdx = raw.lastIndexOf(":");
      if (colonIdx !== -1) {
        const name = raw.substring(0, colonIdx);
        const pages = parseInt(raw.substring(colonIdx + 1), 10);
        if (!isNaN(pages)) {
          return { name, pages };
        }
      }
      return { name: raw, pages: 0 };
    });
    notes = chaptersMatch[2];
  }

  const chapterMatch = notes.match(/^\[CHAPTER:([^\]|]*?)(?:\|STATUS:([^\]]*?))?\]\s*([\s\S]*)/);
  if (chapterMatch) {
    chapter = chapterMatch[1];
    status = chapterMatch[2] || "In Progress";
    notes = chapterMatch[3];
  }

  return { chapters, chapter, status, notes };
};

interface LibraryProps {
  books: Book[];
  readingLogs?: ReadingLog[];
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onDeleteBook: (id: string) => void;
  onOpenEditBook: (book: Book) => void;
  onOpenDailyLog: (bookId?: string) => void;
  onOpenAddBook: () => void;
}

export const Library: React.FC<LibraryProps> = ({
  books,
  readingLogs = [],
  onUpdateBook,
  onDeleteBook,
  onOpenEditBook,
  onOpenDailyLog,
  onOpenAddBook,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (!isDragging) {
      setLocalBooks(books);
    }
  }, [books, isDragging]);

  const libraryBooks = localBooks.filter((b) => b.status !== "Wishlist" && !parseRentalInfo(b.notes));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [ratingFilter, setRatingFilter] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState<"title" | "progress" | "recent" | "custom">("custom");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

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

  // Filter and Sort logic
  const filteredBooks = libraryBooks
    .filter((book) => {
      const matchSearch =
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === "All" || book.status === statusFilter;
      const matchRating = ratingFilter === "All" || book.rating === ratingFilter;

      return matchSearch && matchStatus && matchRating;
    })
    .sort((a, b) => {
      // Pin favorites to top
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;

      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") {
        const progressA = a.current_page / a.total_pages;
        const progressB = b.current_page / b.total_pages;
        return progressB - progressA;
      }
      if (sortBy === "custom") {
        const orderA = parseBookOrder(a.notes);
        const orderB = parseBookOrder(b.notes);
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      // default: recent/created_at
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

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
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">My Library</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and track your reading vault ({filteredBooks.length} books).</p>
        </div>

        {/* Search and filter controls */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4.5 w-4.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, author, genre..."
              className="w-full pl-9 pr-4 py-2.5 text-sm glass-input placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onOpenAddBook}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md glow-primary cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Book</span>
            </button>

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
              <option value="recent">Sort: Recent</option>
              <option value="title">Sort: Title</option>
              <option value="progress">Sort: Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl glass-panel border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden"
          >
            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-2">Reading Status</label>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Not Started", "Reading", "Completed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      statusFilter === status
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-semibold block mb-2">Rating</label>
              <div className="flex flex-wrap gap-1.5">
                {["All", 1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setRatingFilter(rating as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                      ratingFilter === rating
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {rating !== "All" && <Star className="h-3 w-3 fill-current" />}
                    <span>{rating} {rating !== "All" && "Star"}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/5">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">No books found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or add new books to your library library vault.
          </p>
        </div>
      ) : (
        <SortableGrid
          items={filteredBooks}
          sortBy={sortBy}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          onReorder={(sourceIndex, targetIndex) => {
            const newFiltered = [...filteredBooks];
            const [removed] = newFiltered.splice(sourceIndex, 1);
            newFiltered.splice(targetIndex, 0, removed);

            const updatedBooks = newFiltered.map((book, i) => {
              const newOrder = i * 1000;
              const cleanNotes = cleanNotesFromOrder(book.notes);
              const newNotes = `${formatBookOrder(newOrder)} ${cleanNotes}`.trim();
              return { ...book, notes: newNotes };
            });

            setLocalBooks((prev) =>
              prev.map((b) => {
                const updated = updatedBooks.find((ub) => ub.id === b.id);
                return updated ? updated : b;
              })
            );
          }}
          renderItem={(book, index, isDraggingItem, isOver, dragProps) => {
            const progressPercent = Math.round((book.current_page / book.total_pages) * 100);

            return (
              <motion.div
                layout
                {...dragProps}
                className={`rounded-3xl border glass-card overflow-hidden flex flex-col justify-between h-full relative transition-all duration-300 ${
                  isOver
                    ? "border-indigo-500 bg-indigo-500/10 scale-102 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse"
                    : "border-white/5"
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

                  <div className="overflow-hidden flex flex-col justify-between py-0.5">
                    <div className="space-y-0.5">
                      <h3
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBook(book);
                        }}
                        className="font-extrabold text-white text-sm truncate leading-snug cursor-pointer hover:text-indigo-400 transition-colors"
                        title="Click to view details"
                      >
                        {book.title}
                      </h3>
                      <p className="text-slate-400 text-xs truncate">{book.author}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          book.status === "Reading"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25"
                            : book.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            : "bg-slate-500/15 text-slate-400 border border-white/5"
                        }`}
                      >
                        {book.status}
                      </span>
                      {book.genre && (
                        <span className="text-[9px] bg-slate-500/10 text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-white/5">
                          {book.genre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-450">Progress</span>
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

                  {/* Rating Display */}
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
                      <p className="text-[11px] text-slate-500 italic line-clamp-2 border-t border-white/5 pt-3">
                        "{notes}"
                      </p>
                    );
                  })()}
                </div>

                {/* Card Action Footers */}
                <div className="px-5 py-3.5 bg-black/30 border-t border-white/5 flex items-center justify-between gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditBook(book);
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-medium"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBook(book.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete Book"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {(book.status === "Reading" || book.status === "Not Started") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDailyLog(book.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow glow-primary cursor-pointer"
                      >
                        <Bookmark className="h-3 w-3" />
                        <span>Log Session</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }}
        />
      )}
      {/* Book Details Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left"
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
                        <span className="text-slate-500 block">Purchase Date</span>
                        <span className="text-slate-200 font-semibold">{selectedBook.purchase_date}</span>
                      </div>
                    )}
                    {selectedBook.price !== undefined && selectedBook.price !== null && (
                      <div>
                        <span className="text-slate-500 block">Price Paid</span>
                        <span className="text-slate-200 font-semibold">₹{Number(selectedBook.price).toFixed(2)}</span>
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
                    {selectedBook.purchase_link && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Store Link</span>
                        <a
                          href={selectedBook.purchase_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-semibold underline truncate block max-w-md mt-0.5"
                        >
                          {selectedBook.purchase_link}
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedBook.notes && (() => {
                    const { chapters, notes } = parseBookNotes(selectedBook.notes);
                    
                    // Calculate status and pages read for each chapter dynamically from reading logs
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
                          
                          // Find matching chapter case-insensitively and whitespace-insensitively
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
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        {chapters.length > 0 && (
                          <div>
                            <span className="text-xs text-slate-500 block mb-2">Book Chapters ({chapters.length})</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                              {chapters.map((ch, idx) => {
                                const totalPages = ch.pages;
                                const readPages = chapterPagesRead[ch.name] || 0;
                                const loggedStatus = chapterLoggedStatus[ch.name] || "Not Started";
                                
                                let percent = 0;
                                let status: "Completed" | "In Progress" | "Not Started" = "Not Started";
                                
                                if (totalPages > 0) {
                                  percent = Math.min(Math.round((readPages / totalPages) * 100), 100);
                                  if (percent === 100 || loggedStatus === "Completed") {
                                    status = "Completed";
                                    percent = 100;
                                  } else if (percent > 0 || loggedStatus === "In Progress") {
                                    status = "In Progress";
                                  }
                                } else {
                                  status = loggedStatus;
                                  if (status === "Completed") percent = 100;
                                  else if (status === "In Progress") percent = 50;
                                }

                                const isExpanded = expandedChapter === ch.name;
                                
                                // Filter logs for this specific chapter
                                const chapterLogs = bookLogs.filter((log) => {
                                  if (log.notes) {
                                    const logMatch = log.notes.match(/\[CHAPTER:([^\]|]*?)(?:\|STATUS:([^\]]*?))?\]/);
                                    if (logMatch) {
                                      return cleanName(logMatch[1]) === cleanName(ch.name);
                                    }
                                  }
                                  return false;
                                });

                                let badgeStyle = "bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-800/60";
                                let progressStyle = "bg-slate-700";
                                if (status === "Completed") {
                                  badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/[0.12]";
                                  progressStyle = "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(52,211,153,0.3)]";
                                } else if (status === "In Progress") {
                                  badgeStyle = "bg-sky-500/10 text-sky-300 border-sky-500/20 hover:bg-sky-500/[0.12]";
                                  progressStyle = "bg-gradient-to-r from-sky-500 to-indigo-500 shadow-[0_0_8px_rgba(56,189,248,0.3)]";
                                }

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setExpandedChapter(isExpanded ? null : ch.name)}
                                    className={`p-3.5 rounded-2xl border text-[11px] font-semibold transition-all space-y-2 cursor-pointer active:scale-[0.99] select-none ${badgeStyle} ${
                                      isExpanded ? "col-span-1 sm:col-span-2 ring-1 ring-indigo-500/30" : "col-span-1"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 truncate mr-2">
                                        {isExpanded ? (
                                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                        )}
                                        <span className="truncate font-bold text-white text-xs">{ch.name}</span>
                                      </div>
                                      <span className="text-[9px] uppercase tracking-wider shrink-0 bg-black/25 px-2 py-0.5 rounded-lg">
                                        {status}
                                      </span>
                                    </div>
                                    
                                    {totalPages > 0 ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                                          <span>{readPages} / {totalPages} pages</span>
                                          <span>{percent}%</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/5">
                                          <div
                                            style={{ width: `${percent}%` }}
                                            className={`h-full rounded-full transition-all duration-500 ${progressStyle}`}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-[9px] text-slate-500 italic">No page budget set</div>
                                    )}

                                    {/* Expanded History Details Timeline */}
                                    {isExpanded && (
                                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                                          Reading Logs History ({chapterLogs.length})
                                        </span>
                                        {chapterLogs.length === 0 ? (
                                          <span className="text-[10px] text-slate-500 italic block py-1.5">
                                            No sessions logged for this chapter yet.
                                          </span>
                                        ) : (
                                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                            {chapterLogs.map((log, lIdx) => {
                                              const logDate = new Date(log.date).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                              });
                                              const cleanNotes = log.notes ? log.notes.replace(/\[CHAPTER:.*?\]\s*/g, "").trim() : "";
                                              
                                              return (
                                                <div key={log.id || lIdx} className="bg-black/30 border border-white/5 rounded-xl p-2.5 space-y-1.5 transition-all hover:bg-black/40">
                                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                                                    <span className="text-slate-400 font-semibold">{logDate}</span>
                                                    <div className="flex items-center gap-2">
                                                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[8px]">
                                                        +{log.pages_read} pages
                                                      </span>
                                                      {log.reading_time ? (
                                                        <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[8px]">
                                                          {log.reading_time} mins
                                                        </span>
                                                      ) : null}
                                                    </div>
                                                  </div>
                                                  {cleanNotes && (
                                                    <p className="text-[10px] text-slate-300 italic bg-white/5 p-2 rounded-lg leading-relaxed">
                                                      "{cleanNotes}"
                                                    </p>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {notes && (
                          <div className="space-y-1">
                            <span className="text-xs text-slate-500 block">Notes & Review</span>
                            <p className="text-slate-300 text-xs leading-relaxed italic bg-black/20 p-3 border border-white/5 rounded-xl">
                              "{notes}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom Footer Actions (Edit option at last!) */}
              <div className="flex gap-3 justify-end border-t border-white/5 pt-5 mt-6">
                <button
                  onClick={() => {
                    setSelectedBook(null);
                    setExpandedChapter(null);
                  }}
                  className="px-4.5 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const bookToEdit = selectedBook;
                    setSelectedBook(null); // Close details modal
                    setExpandedChapter(null);
                    onOpenEditBook(bookToEdit); // Open edit modal
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow glow-primary cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Book Details</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
