"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { db, Book, ReadingLog, ReadingGoals, isLocalSandbox, setSandboxMode } from "@/utils/db";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/components/Sidebar").then((mod) => mod.Sidebar), {
  loading: () => <div className="w-64 bg-slate-950 animate-pulse border-r border-white/5 hidden md:block" />,
  ssr: false,
});

const Dashboard = dynamic(() => import("@/components/Dashboard").then((mod) => mod.Dashboard), {
  loading: () => (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      <div className="h-32 bg-white/5 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-white/5 rounded-3xl md:col-span-2" />
        <div className="h-64 bg-white/5 rounded-3xl" />
      </div>
    </div>
  ),
  ssr: false,
});

const Library = dynamic(() => import("@/components/Library").then((mod) => mod.Library), {
  loading: () => <div className="w-full h-[60vh] bg-white/5 rounded-3xl animate-pulse" />,
  ssr: false,
});

const Wishlist = dynamic(() => import("@/components/Wishlist").then((mod) => mod.Wishlist), {
  loading: () => <div className="w-full h-[60vh] bg-white/5 rounded-3xl animate-pulse" />,
  ssr: false,
});

const History = dynamic(() => import("@/components/History").then((mod) => mod.History), {
  loading: () => <div className="w-full h-[60vh] bg-white/5 rounded-3xl animate-pulse" />,
  ssr: false,
});

const CalendarView = dynamic(() => import("@/components/CalendarView").then((mod) => mod.CalendarView), {
  loading: () => <div className="w-full h-[60vh] bg-white/5 rounded-3xl animate-pulse" />,
  ssr: false,
});

const Analytics = dynamic(() => import("@/components/Analytics").then((mod) => mod.Analytics), {
  loading: () => <div className="w-full h-[60vh] bg-white/5 rounded-3xl animate-pulse" />,
  ssr: false,
});

import { AuthPortal } from "@/components/AuthPortal";
import { AddBookModal, DailyLogModal } from "@/components/BookForms";
import { useNotifications } from "@/components/Notifications";
import { motion, AnimatePresence } from "framer-motion";
import { calculateStreak } from "@/components/Badges";

const supabase = createClient();

export default function RootPage() {
  const { showNotification } = useNotifications();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Core Library State
  const [books, setBooks] = useState<Book[]>([]);
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);
  const [goals, setGoals] = useState<ReadingGoals>({
    id: "local-goal",
    user_id: "local-user",
    pages_per_day: 20,
    books_per_year: 12,
    year: new Date().getFullYear(),
  });
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // App Routing Tab State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Modals state
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Redirect to auth callback if code is present in URL query params (e.g. from email verification link)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        window.location.href = `/auth/callback?code=${code}`;
      }
    }
  }, []);

  // Auth State Listener
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const explicitSandbox = sessionStorage.getItem("bookvault_sandbox_active") === "true";
      
      if (session) {
        localStorage.setItem("bookvault_session_active", "true");
        setSandboxMode(false);
        setAuthenticated(true);
      } else if (explicitSandbox) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
      setAuthLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const explicitSandbox = sessionStorage.getItem("bookvault_sandbox_active") === "true";
      if (session) {
        localStorage.setItem("bookvault_session_active", "true");
        setSandboxMode(false);
        setAuthenticated(true);
        loadAppData();
      } else {
        // If logged out but NOT explicitly using sandbox
        if (!explicitSandbox) {
          setAuthenticated(false);
        }
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch App Data
  const loadAppData = async () => {
    setLoadingData(true);
    try {
      const loadedBooks = await db.getBooks();
      const loadedLogs = await db.getReadingLogs();
      const loadedGoals = await db.getGoals();

      // Check for ordered books that reached estimated delivery date
      const localDate = new Date();
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const updatedBooksList = [...loadedBooks];
      let didUpdate = false;

      for (let i = 0; i < updatedBooksList.length; i++) {
        const book = updatedBooksList[i];
        if (book.status === "Wishlist" && book.notes) {
          const match = book.notes.match(/\[ORDER_INFO:(.*?)\|(.*?)\]/);
          if (match) {
            const orderDateVal = match[1];
            const estDelivery = match[2];
            // If today is on or after the estimated delivery date
            if (estDelivery && todayStr >= estDelivery) {
              const cleanNotes = book.notes.replace(/\[ORDER_INFO:.*?\]\s*/, "");
              const updatedBook = await db.updateBook(book.id, {
                status: "Not Started",
                current_page: 0,
                purchase_date: estDelivery,
                notes: cleanNotes,
                date_started: todayStr,
              });
              if (updatedBook) {
                updatedBooksList[i] = updatedBook;
                didUpdate = true;
              }
            }
          }
        }
      }

      if (didUpdate) {
        setBooks(updatedBooksList);
      } else {
        setBooks(loadedBooks);
      }
      setReadingLogs(loadedLogs);
      setGoals(loadedGoals);
    } catch (err) {
      console.error("Failed to load application library data:", err);
      showNotification("Error loading library data", "Data fallback active", "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadAppData();
    }
  }, [authenticated]);

  // Auth triggers
  const handleAuthSuccess = () => {
    setAuthenticated(true);
    loadAppData();
    showNotification(
      isLocalSandbox() ? "Sandbox Mode Active" : "Logged in successfully",
      isLocalSandbox()
        ? "Your library is stored locally. Click cloud icon to sync."
        : "Welcome back! Your database sync is active.",
      "success"
    );
  };

  const handleLogout = async () => {
    if (isLocalSandbox()) {
      // Clear all local sandbox data
      localStorage.removeItem("bookvault_books");
      localStorage.removeItem("bookvault_reading_logs");
      localStorage.removeItem("bookvault_reading_goals");
      localStorage.removeItem("bookvault_profile_name");
      localStorage.removeItem("bookvault_profile_role");
      localStorage.removeItem("bookvault_profile_dob");
      localStorage.removeItem("bookvault_use_local");
      localStorage.removeItem("bookvault_sync_queue");
      
      // Reset state variables to prevent leakage
      setBooks([]);
      setReadingLogs([]);
    } else {
      await supabase.auth.signOut();
      localStorage.removeItem("bookvault_session_active");
    }
    setSandboxMode(true);
    setAuthenticated(false);
    showNotification("Logged out", "You have exited your active library vault session.", "info");
  };

  // Database operations callbacks
  const handleCreateBook = async (bookData: any) => {
    try {
      const newBook = await db.addBook(bookData);
      setBooks((prev) => [newBook, ...prev]);
      setIsAddBookOpen(false);
      showNotification(
        bookData.status === "Wishlist" ? "Wishlist updated" : "Book added",
        `"${bookData.title}" was successfully saved.`,
        "success"
      );
    } catch (err) {
      showNotification("Action failed", "Could not save book record.", "error");
    }
  };

  const handleUpdateBook = async (id: string, updates: Partial<Book>) => {
    try {
      const updated = await db.updateBook(id, updates);
      if (updated) {
        setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
        showNotification("Library updated", "Book changes saved.", "success");
      }
    } catch (err) {
      showNotification("Action failed", "Could not update book.", "error");
    }
  };

  const handleDeleteBook = async (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      try {
        await db.deleteBook(id);
        setBooks((prev) => prev.filter((b) => b.id !== id));
        // Remove associated logs locally
        setReadingLogs((prev) => prev.filter((l) => l.book_id !== id));
        showNotification("Book deleted", `"${book.title}" was deleted.`, "info");
      } catch (err) {
        showNotification("Action failed", "Could not delete book.", "error");
      }
    }
  };

  const handleCreateReadingLog = async (logData: {
    bookId: string;
    pagesRead: number;
    readingTime: number;
    notes: string;
  }) => {
    const book = books.find((b) => b.id === logData.bookId);
    if (!book) return;

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const pagesBeforeToday = readingLogs
        .filter((l) => l.date === todayStr)
        .reduce((sum, l) => sum + l.pages_read, 0);

      const newPage = book.current_page + logData.pagesRead;
      let statusUpdates: Partial<Book> = { current_page: newPage };

      // Transition reading statuses
      if (newPage >= book.total_pages) {
        statusUpdates.status = "Completed";
        statusUpdates.date_finished = todayStr;
        showNotification("Book Completed!", `🎉 Congratulations on finishing "${book.title}"!`, "success", 6000);
      } else if (book.status === "Not Started") {
        statusUpdates.status = "Reading";
        statusUpdates.date_started = todayStr;
      }

      // Update book progress
      const updatedBook = await db.updateBook(logData.bookId, statusUpdates);
      if (updatedBook) {
        setBooks((prev) => prev.map((b) => (b.id === logData.bookId ? updatedBook : b)));
      }

      // Log progress log
      const newLog = await db.addReadingLog({
        book_id: logData.bookId,
        date: todayStr,
        pages_read: logData.pagesRead,
        current_page: newPage,
        reading_time: logData.readingTime,
        notes: logData.notes,
      });

      setReadingLogs((prev) => [newLog, ...prev]);
      setIsDailyLogOpen(false);

      // Check daily reading goal
      const pagesAfterToday = pagesBeforeToday + logData.pagesRead;
      if (pagesBeforeToday < goals.pages_per_day && pagesAfterToday >= goals.pages_per_day) {
        showNotification("Goal Achieved!", "🔥 Incredible! You reached your daily reading goal!", "success");
      } else {
        showNotification("Progress Saved", `Logged ${logData.pagesRead} pages for "${book.title}".`, "success");
      }

      // Check for unlock achievements triggers (streak alert)
      const freshLogs = [newLog, ...readingLogs];
      const currentStreak = calculateStreak(freshLogs);
      if (currentStreak === 3 || currentStreak === 7) {
        showNotification("Streak Milestone!", `🔥 You are on a ${currentStreak}-day reading streak!`, "success");
      }
    } catch (err) {
      showNotification("Action failed", "Could not record reading log.", "error");
    }
  };

  const handleDeleteReadingLog = async (id: string) => {
    const log = readingLogs.find((l) => l.id === id);
    if (!log) return;

    if (confirm("Delete this session log? Note: This will revert the book's page progress.")) {
      try {
        const book = books.find((b) => b.id === log.book_id);
        if (book) {
          // Subtract progress
          const revertedPage = Math.max(0, book.current_page - log.pages_read);
          const updates: Partial<Book> = { current_page: revertedPage };
          if (book.status === "Completed" && revertedPage < book.total_pages) {
            updates.status = "Reading";
            updates.date_finished = undefined;
          }
          const updatedBook = await db.updateBook(log.book_id, updates);
          if (updatedBook) {
            setBooks((prev) => prev.map((b) => (b.id === log.book_id ? updatedBook : b)));
          }
        }

        await db.deleteReadingLog(id);
        setReadingLogs((prev) => prev.filter((l) => l.id !== id));
        showNotification("Log deleted", "Reading session removed.", "info");
      } catch (err) {
        showNotification("Action failed", "Could not remove log.", "error");
      }
    }
  };

  const handleUpdateGoals = async (goalsData: Partial<ReadingGoals>) => {
    try {
      const updated = await db.updateGoals(goalsData);
      setGoals(updated);
      showNotification("Goals Saved", "Your daily reading goals are updated.", "success");
    } catch (err) {
      showNotification("Action failed", "Could not save goals.", "error");
    }
  };

  // Auth Routing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0d12]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-t-2 border-indigo-500 border-solid rounded-full animate-spin" />
          <span className="text-slate-400 text-xs font-semibold">Opening Vault...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <AuthPortal onAuthSuccess={handleAuthSuccess} />;
  }

  const currentStreak = calculateStreak(readingLogs);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0d0f14] dark:bg-[#0b0d12] text-slate-100 transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={currentStreak}
        onLogout={handleLogout}
      />

      {/* Main page content container */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {loadingData ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-t-2 border-indigo-500 rounded-full animate-spin" />
              <span className="text-slate-400 text-xs font-semibold">Syncing library...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "dashboard" && (
                <Dashboard
                  books={books}
                  readingLogs={readingLogs}
                  goals={goals}
                  onUpdateGoals={handleUpdateGoals}
                  onOpenAddBook={() => {
                    setEditingBook(null);
                    setIsAddBookOpen(true);
                  }}
                  onOpenDailyLog={() => setIsDailyLogOpen(true)}
                  onSelectTab={setActiveTab}
                />
              )}

              {activeTab === "library" && (
                <Library
                  books={books}
                  onUpdateBook={handleUpdateBook}
                  onDeleteBook={handleDeleteBook}
                  onOpenEditBook={(book) => {
                    setEditingBook(book);
                    setIsAddBookOpen(true);
                  }}
                  onOpenDailyLog={() => setIsDailyLogOpen(true)}
                  onOpenAddBook={() => {
                    setEditingBook(null);
                    setIsAddBookOpen(true);
                  }}
                />
              )}

              {activeTab === "wishlist" && (
                <Wishlist
                  books={books}
                  onUpdateBook={handleUpdateBook}
                  onDeleteBook={handleDeleteBook}
                  onOpenAddBook={() => {
                    setEditingBook(null);
                    setIsAddBookOpen(true);
                  }}
                />
              )}

              {activeTab === "history" && (
                <History
                  readingLogs={readingLogs}
                  books={books}
                  onDeleteLog={handleDeleteReadingLog}
                />
              )}

              {activeTab === "calendar" && (
                <CalendarView
                  readingLogs={readingLogs}
                  books={books}
                  streak={currentStreak}
                />
              )}

              {activeTab === "analytics" && (
                <Analytics
                  books={books}
                  readingLogs={readingLogs}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Book Forms Modals */}
      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => {
          setIsAddBookOpen(false);
          setEditingBook(null);
        }}
        onSubmit={async (bookData) => {
          if (editingBook) {
            await handleUpdateBook(editingBook.id, bookData);
            setIsAddBookOpen(false);
            setEditingBook(null);
          } else {
            await handleCreateBook(bookData);
          }
        }}
        initialBook={editingBook}
        allowedStatuses={activeTab === "wishlist" ? ["Wishlist"] : ["Reading", "Completed", "Not Started"]}
      />

      <DailyLogModal
        isOpen={isDailyLogOpen}
        onClose={() => setIsDailyLogOpen(false)}
        onSubmit={handleCreateReadingLog}
        books={books}
      />
    </div>
  );
}
