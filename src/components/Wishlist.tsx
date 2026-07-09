"use client";

import React, { useState, useEffect } from "react";
import { Book, parseBookOrder, formatBookOrder, cleanNotesFromOrder } from "@/utils/db";
import { SortableGrid } from "./SortableGrid";
import {
  Heart,
  Search,
  Trash2,
  IndianRupee,
  ArrowUpRight,
  ShoppingCart,
  BookmarkPlus,
  BookOpen,
  Tag,
  Clock,
  X,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WishlistProps {
  books: Book[];
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onDeleteBook: (id: string) => void;
  onOpenAddBook: () => void;
  onOpenEditBook?: (book: Book) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({
  books,
  onUpdateBook,
  onDeleteBook,
  onOpenAddBook,
  onOpenEditBook,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (!isDragging) {
      setLocalBooks(books);
    }
  }, [books, isDragging]);

  const wishlistBooks = localBooks.filter((b) => b.status === "Wishlist");
  const [sortBy, setSortBy] = useState<"title" | "recent" | "custom" | "priority">("custom");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedOrderBook, setSelectedOrderBook] = useState<Book | null>(null);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");

  const handleDragEnd = async () => {
    setIsDragging(false);

    // Sync changes to Supabase at drag end
    for (const localBook of localBooks) {
      const originalBook = books.find((b) => b.id === localBook.id);
      if (originalBook && originalBook.notes !== localBook.notes) {
        await onUpdateBook(localBook.id, { notes: localBook.notes });
      }
    }
  };

  const filteredBooks = wishlistBooks
    .filter(
      (book) =>
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        (book.genre && book.genre.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "priority") {
        const wA = a.priority === "High" ? 3 : a.priority === "Medium" ? 2 : 1;
        const wB = b.priority === "High" ? 3 : b.priority === "Medium" ? 2 : 1;
        return wB - wA;
      }
      if (sortBy === "custom") {
        const orderA = parseBookOrder(a.notes);
        const orderB = parseBookOrder(b.notes);
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  // Wishlist metrics
  const totalCost = wishlistBooks.reduce((acc, book) => acc + (book.price || 0), 0);
  const highPriorityCount = wishlistBooks.filter((b) => b.priority === "High").length;

  const getPriorityBadgeClass = (priority: Book["priority"]) => {
    switch (priority) {
      case "High":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/25";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
      default:
        return "bg-slate-500/15 text-slate-400 border border-white/5";
    }
  };

  const handleMoveToLibrary = (id: string) => {
    onUpdateBook(id, {
      status: "Not Started",
      current_page: 0,
      date_started: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header sections */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Wishlist</h1>
          <p className="text-slate-400 text-sm mt-1">Keep track of books you would like to buy and read next.</p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4.5 w-4.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wishlist..."
              className="w-full pl-9 pr-4 py-2.5 text-sm glass-input placeholder-slate-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 text-sm glass-input bg-slate-900 border-white/5 font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            <option value="custom">Sort: Drag & Drop</option>
            <option value="recent">Sort: Recent</option>
            <option value="title">Sort: Title</option>
            <option value="priority">Sort: Priority</option>
          </select>

          <button
            onClick={onOpenAddBook}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md glow-primary cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Add Wanted Book</span>
          </button>
        </div>
      </div>

      {/* Stats metrics block */}
      {wishlistBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl glass-card border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Total Wishlist Books</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{wishlistBooks.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Heart className="h-5 w-5 fill-indigo-500" />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Estimated Cost</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">₹{totalCost.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">High Priority Buy</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{highPriorityCount} items</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-white/5">
          <Heart className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Your wishlist is empty</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Click "Add Wanted Book" to start saving books you plan to purchase next.
          </p>
        </div>
      ) : (
        <SortableGrid
          items={filteredBooks}
          sortBy={sortBy}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          onReorder={(sourceIndex, targetIndex) => {
            const sourceBook = filteredBooks[sourceIndex];
            const targetBook = filteredBooks[targetIndex];

            const sourceOrder = parseBookOrder(sourceBook.notes);
            const targetOrder = parseBookOrder(targetBook.notes);

            const cleanSourceNotes = cleanNotesFromOrder(sourceBook.notes);
            const cleanTargetNotes = cleanNotesFromOrder(targetBook.notes);

            const newSourceNotes = `${formatBookOrder(targetOrder)} ${cleanSourceNotes}`.trim();
            const newTargetNotes = `${formatBookOrder(sourceOrder)} ${cleanTargetNotes}`.trim();

            setLocalBooks((prev) =>
              prev.map((b) => {
                if (b.id === sourceBook.id) return { ...b, notes: newSourceNotes };
                if (b.id === targetBook.id) return { ...b, notes: newTargetNotes };
                return b;
              })
            );
          }}
          renderItem={(book, index, isDraggingItem, isOver, dragProps) => {
            const matchOrder = book.notes ? book.notes.match(/\[ORDER_INFO:(.*?)\|(.*?)\]/) : null;
            const isOrdered = !!matchOrder;
            const orderDateVal = matchOrder ? matchOrder[1] : "";
            const estDeliveryDate = matchOrder ? matchOrder[2] : "";
            const cleanNotes = book.notes ? book.notes.replace(/\[ORDER_INFO:.*?\]\s*/, "").replace(/\[ORDER:\d+\]\s*/, "") : "";

            return (
              <motion.div
                layout
                {...dragProps}
                className={`rounded-3xl border glass-card overflow-hidden flex flex-col justify-between h-full relative transition-all duration-350 ${
                  isOver
                    ? "border-indigo-500 bg-indigo-500/10 scale-102 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse"
                    : "border-white/5"
                } ${isDraggingItem ? "opacity-30 scale-95" : ""} ${sortBy === "custom" ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                {/* Cover & details */}
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
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityBadgeClass(book.priority)}`}>
                        {book.priority || "Medium"} Priority
                      </span>
                      {book.genre && (
                        <span className="text-[9px] bg-slate-500/10 text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-white/5">
                          {book.genre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing and links */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Target Price</span>
                    <span className="text-white flex items-center">
                      {book.price ? `₹${book.price.toFixed(2)}` : "Not Specified"}
                    </span>
                  </div>

                  {book.purchase_link && (
                    <a
                      href={book.purchase_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 hover:border-indigo-500/30 transition-all text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      <span>Shop Online</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {cleanNotes && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-2 border-t border-white/5 pt-2">
                      "{cleanNotes}"
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="px-5 py-3.5 bg-black/30 border-t border-white/5 flex items-center justify-between gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBook(book.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Remove Wishlist Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex gap-2">
                    {isOrdered ? (
                      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20" title={`Ordered on ${orderDateVal}`}>
                        <Clock className="h-3.5 w-3.5 text-emerald-400 mr-1 animate-pulse" />
                        <span>Est: {estDeliveryDate}</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToLibrary(book.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
                        >
                          <BookmarkPlus className="h-3.5 w-3.5" />
                          <span>Library</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderBook(book);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow glow-primary cursor-pointer"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>Purchase</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }}
        />
      )}

      {/* Purchase Order Details Modal */}
      <AnimatePresence>
        {selectedOrderBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md p-6 rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedOrderBook(null);
                  setOrderDate(new Date().toISOString().split("T")[0]);
                  setDeliveryDate("");
                }}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4 mt-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-400" />
                  <span>Track Purchase Order</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter the purchase details for <strong className="text-white">"{selectedOrderBook.title}"</strong>. The book will remain in your wishlist and automatically move to your library once the delivery date is reached.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Date of Order</label>
                    <div className="relative">
                      <Calendar className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm glass-input bg-slate-900 border-white/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Estimated Delivery Date</label>
                    <div className="relative">
                      <Calendar className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm glass-input bg-slate-900 border-white/10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex gap-3 justify-end border-t border-white/5 pt-4.5 mt-5">
                <button
                  onClick={() => {
                    setSelectedOrderBook(null);
                    setOrderDate(new Date().toISOString().split("T")[0]);
                    setDeliveryDate("");
                  }}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!deliveryDate) return;
                    const cleanNotes = selectedOrderBook.notes ? selectedOrderBook.notes.replace(/\[ORDER_INFO:.*?\]\s*/, "") : "";
                    const updatedNotes = `[ORDER_INFO:${orderDate}|${deliveryDate}] ${cleanNotes}`;
                    onUpdateBook(selectedOrderBook.id, { notes: updatedNotes });
                    setSelectedOrderBook(null);
                    setOrderDate(new Date().toISOString().split("T")[0]);
                    setDeliveryDate("");
                  }}
                  disabled={!deliveryDate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow glow-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    <div className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-white/5 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider ${getPriorityBadgeClass(selectedBook.priority)}`}>
                      <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                      <span className="ml-1">{selectedBook.priority || "Medium"} Priority</span>
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

                  {/* Details Grid Table */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-xs border-t border-white/5 pt-4">
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <span className="text-slate-200 font-semibold">{selectedBook.status}</span>
                    </div>
                    {selectedBook.priority && (
                      <div>
                        <span className="text-slate-500 block">Priority</span>
                        <span className="text-slate-200 font-semibold">{selectedBook.priority}</span>
                      </div>
                    )}
                    {selectedBook.price !== undefined && selectedBook.price !== null && (
                      <div>
                        <span className="text-slate-500 block">Target Price</span>
                        <span className="text-slate-200 font-semibold">₹{Number(selectedBook.price).toFixed(2)}</span>
                      </div>
                    )}
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
                    {selectedBook.created_at && (
                      <div>
                        <span className="text-slate-500 block">Added on</span>
                        <span className="text-slate-200 font-semibold">{new Date(selectedBook.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedBook.purchase_link && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Purchase Link</span>
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
                      <span className="text-xs text-slate-500 block">Wishlist Notes</span>
                      <p className="text-slate-300 text-xs leading-relaxed italic bg-black/20 p-3 border border-white/5 rounded-xl">
                        "{selectedBook.notes.replace(/\[ORDER_INFO:.*?\]\s*/, "").replace(/\[ORDER:\d+\]\s*/, "")}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="flex gap-3 justify-end border-t border-white/5 pt-5 mt-6">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4.5 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                {onOpenEditBook && (
                  <button
                    onClick={() => {
                      const bookToEdit = selectedBook;
                      setSelectedBook(null); // Close details modal
                      onOpenEditBook(bookToEdit); // Open edit modal
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow glow-primary cursor-pointer"
                  >
                    <Heart className="h-4 w-4" />
                    <span>Edit Wishlist Details</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
