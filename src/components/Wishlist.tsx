"use client";

import React, { useState } from "react";
import { Book } from "@/utils/db";
import {
  Heart,
  Search,
  Trash2,
  DollarSign,
  ArrowUpRight,
  ShoppingCart,
  BookmarkPlus,
  BookOpen,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";

interface WishlistProps {
  books: Book[];
  onUpdateBook: (id: string, updates: Partial<Book>) => void;
  onDeleteBook: (id: string) => void;
  onOpenAddBook: () => void;
}

export const Wishlist: React.FC<WishlistProps> = ({
  books,
  onUpdateBook,
  onDeleteBook,
  onOpenAddBook,
}) => {
  const wishlistBooks = books.filter((b) => b.status === "Wishlist");
  const [search, setSearch] = useState("");

  const filteredBooks = wishlistBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(search.toLowerCase()))
  );

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
              <span className="text-2xl font-extrabold text-white mt-1 block">${totalCost.toFixed(2)}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-5 w-5" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-3xl border border-white/5 glass-card overflow-hidden flex flex-col justify-between h-full"
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
                    <h3 className="font-extrabold text-white text-sm truncate leading-snug" title={book.title}>
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
                    {book.price ? `$${book.price.toFixed(2)}` : "Not Specified"}
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

                {book.notes && (
                  <p className="text-[11px] text-slate-500 italic line-clamp-2 border-t border-white/5 pt-2">
                    "{book.notes}"
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3.5 bg-black/30 border-t border-white/5 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => onDeleteBook(book.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Remove Wishlist Item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveToLibrary(book.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    <span>Library</span>
                  </button>

                  <button
                    onClick={() => handleMoveToLibrary(book.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow glow-primary cursor-pointer"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Purchase</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
