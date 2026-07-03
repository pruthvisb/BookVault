"use client";

import React, { useState, useEffect } from "react";
import { Book, ReadingLog } from "@/utils/db";
import { X, Upload, BookOpen, Clock, Tag, Link2, IndianRupee, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const parseChapterString = (str: string) => {
  const types = ["Chapter", "Section", "Part", "Act", "Prologue", "Epilogue", "Appendix"];
  for (const t of types) {
    if (str.startsWith(t + " ")) {
      return { type: t, val: str.substring(t.length + 1) };
    }
    if (str === t) {
      return { type: t, val: "" };
    }
  }
  return { type: "Other", val: str };
};

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (book: any) => void;
  initialBook?: Book | null;
  allowedStatuses?: Book["status"][];
}

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (log: { bookId: string; pagesRead: number; readingTime: number; notes: string }) => void;
  books: Book[];
  preselectedBookId?: string | null;
}

const PRESET_COVERS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Purple/Indigo
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", // Sunset Pink
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // Warm Red/Pink
  "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)", // Mint/Violet
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // Blue Splash
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // Green Teal
];

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialBook,
  allowedStatuses,
}) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [status, setStatus] = useState<Book["status"]>(
    initialBook?.status || 
    (allowedStatuses && allowedStatuses.includes("Reading") ? "Reading" : (allowedStatuses ? allowedStatuses[0] : "Not Started"))
  );
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [chaptersList, setChaptersList] = useState<{ name: string; pages: number }[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [coverType, setCoverType] = useState<"preset" | "url" | "file">("preset");
  const [coverUrl, setCoverUrl] = useState(PRESET_COVERS[0]);
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState<Book["priority"]>("Medium");
  const [purchaseLink, setPurchaseLink] = useState("");
  const [source, setSource] = useState("Bought");

  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title);
      setAuthor(initialBook.author);
      setGenre(initialBook.genre || "");
      setTotalPages(initialBook.total_pages.toString());
      setStatus(initialBook.status);
      setIsbn(initialBook.isbn || "");
      setPublisher(initialBook.publisher || "");
      setPurchaseDate(initialBook.purchase_date || "");
      
      // Extract chapters metadata if present
      if (initialBook.notes) {
        const chaptersMatch = initialBook.notes.match(/\[CHAPTERS:(.*?)\]\s*([\s\S]*)/);
        if (chaptersMatch) {
          const rawChapters = chaptersMatch[1].split("|").filter(Boolean);
          const parsed = rawChapters.map((raw) => {
            const colonIdx = raw.lastIndexOf(":");
            if (colonIdx !== -1) {
              const name = raw.substring(0, colonIdx);
              const pages = parseInt(raw.substring(colonIdx + 1), 10);
              return { name, pages: isNaN(pages) ? 0 : pages };
            }
            return { name: raw, pages: 0 };
          });
          setChaptersList(parsed);
          setNotes(chaptersMatch[2]);
        } else {
          setChaptersList([]);
          setNotes(initialBook.notes);
        }
      } else {
        setChaptersList([]);
        setNotes("");
      }
      
      setIsFavorite(initialBook.is_favorite || false);
      setPrice(initialBook.price ? initialBook.price.toString() : "");
      setPriority(initialBook.priority || "Medium");
      setPurchaseLink(initialBook.purchase_link || "");
      setSource(initialBook.source || "Bought");

      if (initialBook.cover_url) {
        if (initialBook.cover_url.startsWith("linear-gradient")) {
          setCoverType("preset");
          setCoverUrl(initialBook.cover_url);
        } else if (initialBook.cover_url.startsWith("data:image")) {
          setCoverType("file");
          setCoverUrl(initialBook.cover_url);
        } else {
          setCoverType("url");
          setCoverUrl(initialBook.cover_url);
        }
      }
    } else {
      // Reset defaults
      setTitle("");
      setAuthor("");
      setGenre("");
      setTotalPages("");
      setStatus(allowedStatuses && allowedStatuses.includes("Reading") ? "Reading" : (allowedStatuses ? allowedStatuses[0] : "Not Started"));
      setIsbn("");
      setPublisher("");
      setPurchaseDate("");
      setNotes("");
      setChaptersList([]);
      setIsFavorite(false);
      setCoverType("preset");
      setCoverUrl(PRESET_COVERS[0]);
      setPrice("");
      setPriority("Medium");
      setPurchaseLink("");
      setSource("Bought");
    }
  }, [initialBook, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !totalPages) return;

    const validChapters = chaptersList.filter((c) => c.name.trim() !== "");
    const chaptersTag = validChapters.length > 0
      ? `[CHAPTERS:${validChapters.map((c) => `${c.name.trim()}:${c.pages}`).join("|")}] `
      : "";

    const bookData: any = {
      title,
      author,
      genre,
      total_pages: parseInt(totalPages, 10),
      status,
      isbn,
      publisher,
      purchase_date: purchaseDate || null,
      notes: `${chaptersTag}${notes}`,
      is_favorite: isFavorite,
      cover_url: coverUrl,
    };

    bookData.price = price ? parseFloat(price) : null;
    bookData.purchase_link = purchaseLink;
    bookData.source = source;

    if (status === "Wishlist") {
      bookData.priority = priority;
      bookData.current_page = 0;
    } else if (initialBook) {
      bookData.current_page = initialBook.current_page;
    } else {
      bookData.current_page = 0;
    }

    onSubmit(bookData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl p-6 rounded-3xl border border-white/10 glass-panel shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">
              {initialBook ? "Edit Book" : "Add Book to Vault"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Cover Picker Section */}
              <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                <div
                  style={{ background: coverUrl.startsWith("linear-gradient") ? coverUrl : "none", backgroundColor: coverUrl.startsWith("linear-gradient") ? "transparent" : "#1e293b" }}
                  className="w-32 h-44 rounded-xl border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden shrink-0"
                >
                  {!coverUrl.startsWith("linear-gradient") && coverUrl && (
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  )}
                  {(!coverUrl) && <BookOpen className="h-10 w-10 text-slate-500" />}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm py-1 rounded text-center text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                    Cover Preview
                  </div>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <span className="text-xs font-semibold text-slate-300">Book Cover Design</span>
                  <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5 text-xs">
                    {(["preset", "url", "file"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setCoverType(type);
                          if (type === "preset") setCoverUrl(PRESET_COVERS[0]);
                          else setCoverUrl("");
                        }}
                        className={`flex-1 py-1.5 rounded-lg capitalize font-medium transition-all ${coverType === type ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {coverType === "preset" && (
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_COVERS.map((gradient, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCoverUrl(gradient)}
                          style={{ background: gradient }}
                          className={`h-8 rounded-lg border-2 ${coverUrl === gradient ? "border-indigo-500 scale-105" : "border-transparent"
                            } transition-all`}
                        />
                      ))}
                    </div>
                  )}

                  {coverType === "url" && (
                    <input
                      type="url"
                      value={coverUrl.startsWith("linear-gradient") ? "" : coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or Google Books image link"
                      className="w-full px-4 py-2 text-xs glass-input"
                    />
                  )}

                  {coverType === "file" && (
                    <label className="flex items-center justify-center gap-2 border border-dashed border-white/10 hover:border-indigo-500/50 py-3 rounded-xl cursor-pointer text-xs text-slate-400 hover:text-white transition-all bg-black/20">
                      <Upload className="h-4 w-4" />
                      <span>Upload cover image</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Core Book Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Book Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Atomic Habits"
                    className="w-full px-4 py-2.5 text-sm glass-input"
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Author</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. James Clear"
                    className="w-full px-4 py-2.5 text-sm glass-input"
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Genre</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="e.g. Self-Help, Sci-Fi"
                    className="w-full px-4 py-2.5 text-sm glass-input"
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Total Pages</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={totalPages}
                    onChange={(e) => setTotalPages(e.target.value)}
                    placeholder="e.g. 320"
                    className="w-full px-4 py-2.5 text-sm glass-input"
                  />
                </div>
              </div>

              {/* Status and Favorite Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Library Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Book["status"])}
                    className="w-full px-4 py-2.5 text-sm glass-input bg-slate-900 border-white/10"
                  >
                    {(!allowedStatuses || allowedStatuses.includes("Not Started") || initialBook) && (
                      <option value="Not Started" className="bg-slate-900 text-white">Not Started</option>
                    )}
                    {(!allowedStatuses || allowedStatuses.includes("Reading") || initialBook) && (
                      <option value="Reading" className="bg-slate-900 text-white">Reading</option>
                    )}
                    {(!allowedStatuses || allowedStatuses.includes("Completed") || initialBook) && (
                      <option value="Completed" className="bg-slate-900 text-white">Completed</option>
                    )}
                    {(!allowedStatuses || allowedStatuses.includes("Wishlist") || initialBook) && (
                      <option value="Wishlist" className="bg-slate-900 text-white">Wishlist</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="isFavorite"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="h-5 w-5 rounded border-white/10 bg-black/40 accent-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="isFavorite" className="text-slate-300 text-sm font-semibold cursor-pointer select-none">
                    Pin as Favorite Book
                  </label>
                </div>
              </div>

              {/* Source & Price Paid for Library Books */}
              {status !== "Wishlist" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Source of Book</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm glass-input bg-slate-900 border-white/10"
                    >
                      <option value="Bought">Bought (Physical)</option>
                      <option value="Online">Online / E-Book</option>
                      <option value="Borrowed">Borrowed</option>
                      <option value="Library">Library</option>
                      <option value="Gift">Gift</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Price Paid (₹)</label>
                    <div className="relative">
                      <IndianRupee className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 12.50"
                        className="w-full pl-9 pr-4 py-2.5 text-sm glass-input"
                      />
                    </div>
                  </div>

                  {source === "Online" && (
                    <div>
                      <label className="text-slate-300 text-xs font-semibold block mb-1.5">Online Source URL</label>
                      <div className="relative">
                        <Link2 className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={purchaseLink}
                          onChange={(e) => setPurchaseLink(e.target.value)}
                          placeholder="e.g. Store or PDF URL"
                          className="w-full pl-9 pr-4 py-2.5 text-sm glass-input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Wishlist Fields */}
              {status === "Wishlist" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4"
                >
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="14.99"
                        className="w-full pl-9 pr-4 py-2 text-sm glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Buy Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Book["priority"])}
                      className="w-full px-4 py-2 text-sm glass-input bg-slate-900"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Purchase Link</label>
                    <div className="relative">
                      <Link2 className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={purchaseLink}
                        onChange={(e) => setPurchaseLink(e.target.value)}
                        placeholder="Amazon or Store URL"
                        className="w-full pl-9 pr-4 py-2 text-sm glass-input"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Optional Fields (Accordion style or standard) */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Optional Book Details</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">ISBN</label>
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="e.g. 9780132350884"
                      className="w-full px-4 py-2 text-xs glass-input"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Publisher</label>
                    <input
                      type="text"
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="e.g. Penguin Books"
                      className="w-full px-4 py-2 text-xs glass-input"
                    />
                  </div>

                  {status !== "Wishlist" && (
                    <div>
                      <label className="text-slate-300 text-xs font-semibold block mb-1.5">Purchase Date</label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full px-4 py-2 text-xs glass-input bg-slate-900"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Book Chapters (Optional)</label>
                  <div className="space-y-2 mb-3 max-h-56 overflow-y-auto pr-1">
                    {chaptersList.map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ch.name}
                          onChange={(e) => {
                            const updated = chaptersList.map((c, i) => i === idx ? { ...c, name: e.target.value } : c);
                            setChaptersList(updated);
                          }}
                          placeholder="e.g. Chapter 1: The Sparks"
                          className="flex-1 px-4 py-2.5 text-xs glass-input"
                        />
                        <input
                          type="number"
                          value={ch.pages || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updated = chaptersList.map((c, i) => i === idx ? { ...c, pages: isNaN(val) ? 0 : val } : c);
                            setChaptersList(updated);
                          }}
                          placeholder="Pages"
                          min="1"
                          className="w-20 px-3 py-2.5 text-xs glass-input"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setChaptersList(chaptersList.filter((_, i) => i !== idx));
                          }}
                          className="p-3 bg-black/40 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 rounded-xl transition-all cursor-pointer shrink-0"
                          title="Remove Chapter"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setChaptersList([...chaptersList, { name: "", pages: 0 }]);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all cursor-pointer w-fit"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Personal Notes & Reviews</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your thoughts or a short review about the book..."
                    className="w-full px-4 py-2 text-sm glass-input"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md glow-primary cursor-pointer"
                >
                  {initialBook ? "Save Changes" : "Add Book"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  books,
  preselectedBookId = null,
}) => {
  const activeBooks = books.filter((b) => b.status === "Reading" || b.status === "Not Started");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const [readingTime, setReadingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [chapters, setChapters] = useState<{ name: string; pages: number }[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const getBookChapters = (bookId: string) => {
    const book = books.find((b) => b.id === bookId);
    if (!book || !book.notes) return [];
    const match = book.notes.match(/\[CHAPTERS:(.*?)\]/);
    if (match) {
      return match[1].split("|").filter(Boolean).map((raw) => {
        const colonIdx = raw.lastIndexOf(":");
        if (colonIdx !== -1) {
          const name = raw.substring(0, colonIdx);
          const pages = parseInt(raw.substring(colonIdx + 1), 10);
          return { name, pages: isNaN(pages) ? 0 : pages };
        }
        return { name: raw, pages: 0 };
      });
    }
    return [];
  };

  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId);
    const bookChapters = getBookChapters(bookId);
    setChapters(bookChapters);
    setSelectedChapter(bookChapters[0]?.name || "");
  };

  useEffect(() => {
    if (isOpen) {
      const initialBookId = preselectedBookId || (activeBooks.length > 0 ? activeBooks[0].id : "");
      setSelectedBookId(initialBookId);
      const bookChapters = getBookChapters(initialBookId);
      setChapters(bookChapters);
      setSelectedChapter(bookChapters[0]?.name || "");
    } else {
      setSelectedBookId("");
      setChapters([]);
      setSelectedChapter("");
    }
    setPagesRead("");
    setReadingTime("");
    setNotes("");
    setValidationError(null);
  }, [isOpen, books, preselectedBookId]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedBookId || !pagesRead) return;

    const book = books.find((b) => b.id === selectedBookId);
    if (!book) return;

    const pages = parseInt(pagesRead, 10);
    const duration = readingTime ? parseInt(readingTime, 10) : 0;

    const chapterName = selectedChapter.trim();
    if (!chapterName) {
      setValidationError("Please select the chapter you read today.");
      return;
    }

    // Check bounds: current_page + pagesRead must not exceed total_pages
    const potentialPage = book.current_page + pages;
    if (potentialPage > book.total_pages) {
      setValidationError(
        `Pages read today (${pages}) will push the current page (${potentialPage}) past the book's total pages (${book.total_pages}). Please enter a lower page count.`
      );
      return;
    }

    if (pages <= 0) {
      setValidationError("Please enter a valid page number greater than 0.");
      return;
    }

    onSubmit({
      bookId: selectedBookId,
      pagesRead: pages,
      readingTime: duration,
      notes: chapterName ? `[CHAPTER:${chapterName}] ${notes}` : notes,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md p-6 rounded-3xl border border-white/10 glass-panel shadow-2xl text-slate-100"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Log Daily Reading Session</h3>

            {activeBooks.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">You don't have any books currently in progress.</p>
                <p className="text-xs text-slate-500 mt-1">Move a book from your Library or Wishlist to "Reading" to start logging.</p>
                <button
                  onClick={onClose}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all cursor-pointer"
                >
                  Okay
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {validationError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs">
                    {validationError}
                  </div>
                )}

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Select Book</label>
                  <select
                    required
                    value={selectedBookId}
                    onChange={(e) => handleBookChange(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm glass-input bg-slate-900 border-white/10"
                  >
                    {activeBooks.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        {b.title} ({b.current_page}/{b.total_pages} pages)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Pages Read Today</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pagesRead}
                      onChange={(e) => setPagesRead(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full px-4 py-2.5 text-sm glass-input"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 text-xs font-semibold block mb-1.5">Reading Time (mins)</label>
                    <div className="relative">
                      <Clock className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        value={readingTime}
                        onChange={(e) => setReadingTime(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full pl-9 pr-4 py-2.5 text-sm glass-input"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">
                    Chapter Read Today <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs glass-input bg-slate-900 border-white/10"
                  >
                    {chapters.length > 0 ? (
                      <>
                        <option value="" className="bg-slate-900 text-slate-500">-- Select Chapter --</option>
                        {chapters.map((ch) => (
                          <option key={ch.name} value={ch.name} className="bg-slate-900 text-white">
                            {ch.name} {ch.pages > 0 ? `(${ch.pages} pages)` : ""}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value="" className="bg-slate-900 text-rose-400 font-semibold" disabled>
                        -- No chapters defined (Define them in Library) --
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 text-xs font-semibold block mb-1.5">Session Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you think about today's chapters?"
                    className="w-full px-4 py-2 text-sm glass-input"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md glow-primary cursor-pointer"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
