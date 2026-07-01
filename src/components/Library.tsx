"use client";

import React, { useState } from "react";
import { Book } from "@/utils/db";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LibraryProps {
  books: Book[];
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onDeleteBook: (id: string) => void;
  onOpenEditBook: (book: Book) => void;
  onOpenDailyLog: () => void;
  onOpenAddBook: () => void;
}

export const Library: React.FC<LibraryProps> = ({
  books,
  onUpdateBook,
  onDeleteBook,
  onOpenEditBook,
  onOpenDailyLog,
  onOpenAddBook,
}) => {
  const libraryBooks = books.filter((b) => b.status !== "Wishlist");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [ratingFilter, setRatingFilter] = useState<number | "All">("All");
  const [sortBy, setSortBy] = useState<"title" | "progress" | "recent">("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") {
        const progressA = a.current_page / a.total_pages;
        const progressB = b.current_page / b.total_pages;
        return progressB - progressA;
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const progressPercent = Math.round((book.current_page / book.total_pages) * 100);

            return (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-white/5 glass-card overflow-hidden flex flex-col justify-between h-full relative"
              >
                {/* Pin button (favorite) */}
                <button
                  onClick={() => onUpdateBook(book.id, { is_favorite: !book.is_favorite })}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                    book.is_favorite
                      ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                      : "bg-black/40 text-slate-400 border border-white/5 hover:text-white"
                  }`}
                  title={book.is_favorite ? "Unpin Favorite" : "Pin Favorite"}
                >
                  <Pin className={`h-4.5 w-4.5 ${book.is_favorite ? "fill-pink-500" : ""}`} />
                </button>

                {/* Cover & title section */}
                <div className="p-5 flex gap-4 border-b border-white/5">
                  {/* Book Cover */}
                  <div
                    style={{
                      background: book.cover_url?.startsWith("linear-gradient") ? book.cover_url : "none",
                      backgroundColor: book.cover_url?.startsWith("linear-gradient") ? "transparent" : "#1e293b",
                    }}
                    className="w-20 h-28 rounded-xl overflow-hidden shadow-md flex items-center justify-center border border-white/10 shrink-0 relative"
                  >
                    {book.cover_url && !book.cover_url.startsWith("linear-gradient") && (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    )}
                    {(!book.cover_url) && <BookOpen className="h-6 w-6 text-slate-500" />}
                  </div>

                  {/* Title and details */}
                  <div className="overflow-hidden flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadgeClass(book.status)}`}>
                        {getStatusIcon(book.status)}
                        <span>{book.status}</span>
                      </div>
                      <h3 
                        onClick={() => setSelectedBook(book)}
                        className="font-extrabold text-white text-base leading-snug truncate pr-6 cursor-pointer hover:text-indigo-400 transition-colors" 
                        title="Click to view details"
                      >
                        {book.title}
                      </h3>
                      <p className="text-slate-400 text-xs truncate leading-none">By {book.author}</p>
                    </div>

                    {book.genre && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-semibold px-2.5 py-1 rounded-lg border border-indigo-500/15 w-fit">
                        {book.genre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar & ratings details */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400">Pages Completed</span>
                      <span className="text-white">
                        {book.current_page} / {book.total_pages} ({progressPercent}%)
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-2 rounded-full bg-slate-800 border border-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Source, Price, and Online Link details */}
                  {(book.source || book.price || (book.source === "Online" && book.purchase_link)) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/5 pt-3 mt-2 text-[11px] text-slate-400 font-medium">
                      {book.source && (
                        <div>
                          <span>Source: </span>
                          <span className="text-slate-200 font-semibold">{book.source}</span>
                        </div>
                      )}
                      {book.price !== undefined && book.price !== null && (
                        <div>
                          <span>Price: </span>
                          <span className="text-slate-200 font-semibold">₹{Number(book.price).toFixed(2)}</span>
                        </div>
                      )}
                      {book.source === "Online" && book.purchase_link && (
                        <a
                          href={book.purchase_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                        >
                          <span>Store Link ↗</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Rating display */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
                    <div className="flex gap-0.5 items-center">
                      <span className="text-xs font-semibold text-slate-400 mr-1.5">Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => onUpdateBook(book.id, { rating: star })}
                          className="text-slate-500 hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              book.rating && star <= book.rating ? "text-amber-400 fill-amber-400" : ""
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes summary */}
                  {book.notes && (
                    <p className="text-xs text-slate-500 italic line-clamp-2 border-t border-white/5 pt-3">
                      "{book.notes}"
                    </p>
                  )}
                </div>

                {/* Card Action Footers */}
                <div className="px-5 py-3.5 bg-black/30 border-t border-white/5 flex items-center justify-between gap-2.5">
                  <button
                    onClick={() => onOpenEditBook(book)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-medium"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onDeleteBook(book.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete Book"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {(book.status === "Reading" || book.status === "Not Started") && (
                      <button
                        onClick={onOpenDailyLog}
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
          })}
        </div>
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
                onClick={() => setSelectedBook(null)}
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

                  {selectedBook.notes && (
                    <div className="border-t border-white/5 pt-4 space-y-1">
                      <span className="text-xs text-slate-500 block">Notes & Review</span>
                      <p className="text-slate-300 text-xs leading-relaxed italic bg-black/20 p-3 border border-white/5 rounded-xl">
                        "{selectedBook.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Footer Actions (Edit option at last!) */}
              <div className="flex gap-3 justify-end border-t border-white/5 pt-5 mt-6">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4.5 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const bookToEdit = selectedBook;
                    setSelectedBook(null); // Close details modal
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
