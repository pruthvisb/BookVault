import { createClient } from "./supabase/client";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  genre?: string;
  total_pages: number;
  current_page: number;
  status: "Not Started" | "Reading" | "Completed" | "Wishlist";
  rating?: number;
  date_started?: string;
  date_finished?: string;
  cover_url?: string;
  isbn?: string;
  publisher?: string;
  purchase_date?: string;
  notes?: string;
  is_favorite?: boolean;
  source?: string;
  // Wishlist specific
  price?: number;
  priority?: "Low" | "Medium" | "High";
  purchase_link?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReadingLog {
  id: string;
  user_id: string;
  book_id: string;
  date: string; // YYYY-MM-DD
  pages_read: number;
  current_page: number;
  reading_time?: number; // in minutes
  notes?: string;
  created_at?: string;
}

export interface ReadingGoals {
  id: string;
  user_id: string;
  pages_per_day: number;
  books_per_year: number;
  year: number;
}

const supabase = typeof window !== "undefined" ? createClient() : null;

// Helpers for LocalStorage
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Check if we should use local sandbox (no auth or explicit offline)
export const isLocalSandbox = (): boolean => {
  if (typeof window === "undefined") return true;
  const useLocal = localStorage.getItem("bookvault_use_local") === "true";
  const sessionActive = localStorage.getItem("bookvault_session_active") === "true";
  return useLocal || !sessionActive;
};

export const setSandboxMode = (active: boolean) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("bookvault_use_local", active ? "true" : "false");
    if (active) {
      localStorage.removeItem("bookvault_session_active");
    }
  }
};

// Unified DB API
export const db = {
  // Books API
  async getBooks(): Promise<Book[]> {
    if (!isLocalSandbox() && supabase) {
      try {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as Book[];
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to LocalStorage:", err);
      }
    }
    return getLocalStorage<Book[]>("bookvault_books", []);
  },

  async addBook(book: Omit<Book, "id" | "user_id" | "created_at" | "updated_at">): Promise<Book> {
    const id = typeof window !== "undefined" ? window.crypto.randomUUID() : Math.random().toString();
    const now = new Date().toISOString();
    let userId = "local-user";

    if (!isLocalSandbox() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const { data, error } = await supabase
            .from("books")
            .insert([{ ...book, user_id: userId }])
            .select()
            .single();
          if (!error && data) return data as Book;
          console.error("Supabase insert error:", error);
        }
      } catch (err) {
        console.warn("Supabase insert failed, storing locally first:", err);
      }
    }

    const newBook: Book = {
      ...book,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    const localBooks = getLocalStorage<Book[]>("bookvault_books", []);
    localBooks.unshift(newBook);
    setLocalStorage("bookvault_books", localBooks);

    // Save sync queue for when online
    if (!isLocalSandbox()) {
      const queue = getLocalStorage<string[]>("bookvault_sync_queue", []);
      queue.push(`add_book:${newBook.id}`);
      setLocalStorage("bookvault_sync_queue", queue);
    }

    return newBook;
  },

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    const now = new Date().toISOString();

    if (!isLocalSandbox() && supabase) {
      try {
        const { data, error } = await supabase
          .from("books")
          .update({ ...updates, updated_at: now })
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data as Book;
        console.error("Supabase update error:", error);
      } catch (err) {
        console.warn("Supabase update failed, storing locally first:", err);
      }
    }

    const localBooks = getLocalStorage<Book[]>("bookvault_books", []);
    const idx = localBooks.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const updatedBook = {
      ...localBooks[idx],
      ...updates,
      updated_at: now,
    };
    localBooks[idx] = updatedBook;
    setLocalStorage("bookvault_books", localBooks);

    if (!isLocalSandbox()) {
      const queue = getLocalStorage<string[]>("bookvault_sync_queue", []);
      queue.push(`update_book:${id}`);
      setLocalStorage("bookvault_sync_queue", queue);
    }

    return updatedBook;
  },

  async deleteBook(id: string): Promise<boolean> {
    if (!isLocalSandbox() && supabase) {
      try {
        const { error } = await supabase.from("books").delete().eq("id", id);
        if (!error) return true;
        console.error("Supabase delete error:", error);
      } catch (err) {
        console.warn("Supabase delete failed, queuing offline:", err);
      }
    }

    const localBooks = getLocalStorage<Book[]>("bookvault_books", []);
    const filtered = localBooks.filter((b) => b.id !== id);
    setLocalStorage("bookvault_books", filtered);

    // Clean reading logs associated
    const localLogs = getLocalStorage<ReadingLog[]>("bookvault_reading_logs", []);
    setLocalStorage("bookvault_reading_logs", localLogs.filter((l) => l.book_id !== id));

    if (!isLocalSandbox()) {
      const queue = getLocalStorage<string[]>("bookvault_sync_queue", []);
      queue.push(`delete_book:${id}`);
      setLocalStorage("bookvault_sync_queue", queue);
    }

    return true;
  },

  // Reading Logs API
  async getReadingLogs(): Promise<ReadingLog[]> {
    if (!isLocalSandbox() && supabase) {
      try {
        const { data, error } = await supabase
          .from("reading_logs")
          .select("*")
          .order("date", { ascending: false });
        if (error) throw error;
        return data as ReadingLog[];
      } catch (err) {
        console.warn("Supabase logs fetch failed, using local:", err);
      }
    }
    return getLocalStorage<ReadingLog[]>("bookvault_reading_logs", []);
  },

  async addReadingLog(log: Omit<ReadingLog, "id" | "user_id" | "created_at">): Promise<ReadingLog> {
    const id = typeof window !== "undefined" ? window.crypto.randomUUID() : Math.random().toString();
    const now = new Date().toISOString();
    let userId = "local-user";

    if (!isLocalSandbox() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          const { data, error } = await supabase
            .from("reading_logs")
            .insert([{ ...log, user_id: userId }])
            .select()
            .single();
          if (!error && data) return data as ReadingLog;
          console.error("Supabase log insert error:", error);
        }
      } catch (err) {
        console.warn("Supabase log insert failed, saving locally:", err);
      }
    }

    const newLog: ReadingLog = {
      ...log,
      id,
      user_id: userId,
      created_at: now,
    };

    const localLogs = getLocalStorage<ReadingLog[]>("bookvault_reading_logs", []);
    localLogs.unshift(newLog);
    setLocalStorage("bookvault_reading_logs", localLogs);

    if (!isLocalSandbox()) {
      const queue = getLocalStorage<string[]>("bookvault_sync_queue", []);
      queue.push(`add_log:${newLog.id}`);
      setLocalStorage("bookvault_sync_queue", queue);
    }

    return newLog;
  },

  async deleteReadingLog(id: string): Promise<boolean> {
    if (!isLocalSandbox() && supabase) {
      try {
        const { error } = await supabase.from("reading_logs").delete().eq("id", id);
        if (!error) return true;
        console.error("Supabase log delete error:", error);
      } catch (err) {
        console.warn("Supabase log delete failed, queueing offline:", err);
      }
    }

    const localLogs = getLocalStorage<ReadingLog[]>("bookvault_reading_logs", []);
    setLocalStorage("bookvault_reading_logs", localLogs.filter((l) => l.id !== id));

    return true;
  },

  // Reading Goals API
  async getGoals(): Promise<ReadingGoals> {
    const currentYear = new Date().getFullYear();
    const defaultGoals: ReadingGoals = {
      id: "local-goal",
      user_id: "local-user",
      pages_per_day: 20,
      books_per_year: 12,
      year: currentYear,
    };

    if (!isLocalSandbox() && supabase) {
      try {
        const { data, error } = await supabase
          .from("reading_goals")
          .select("*")
          .eq("year", currentYear)
          .maybeSingle();
        if (!error && data) return data as ReadingGoals;
        
        // If not found in db, create default
        if (!error && !data) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newDbGoal, error: insError } = await supabase
              .from("reading_goals")
              .insert([{ user_id: user.id, year: currentYear, pages_per_day: 20, books_per_year: 12 }])
              .select()
              .single();
            if (!insError && newDbGoal) return newDbGoal as ReadingGoals;
          }
        }
      } catch (err) {
        console.warn("Supabase goals fetch failed, using local:", err);
      }
    }

    return getLocalStorage<ReadingGoals>("bookvault_reading_goals", defaultGoals);
  },

  async updateGoals(goals: Partial<ReadingGoals>): Promise<ReadingGoals> {
    const currentYear = new Date().getFullYear();
    const existing = await this.getGoals();
    const updated = { ...existing, ...goals };

    if (!isLocalSandbox() && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("reading_goals")
            .upsert({
              user_id: user.id,
              year: currentYear,
              pages_per_day: updated.pages_per_day,
              books_per_year: updated.books_per_year,
            }, { onConflict: "user_id,year" })
            .select()
            .single();
          if (!error && data) return data as ReadingGoals;
          console.error("Supabase goals update error:", error);
        }
      } catch (err) {
        console.warn("Supabase goals update failed, saving locally:", err);
      }
    }

    setLocalStorage("bookvault_reading_goals", updated);
    return updated;
  },

  // Sync Offline Queue to Supabase once online
  async syncOfflineData(): Promise<void> {
    if (isLocalSandbox() || !supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localBooks = getLocalStorage<Book[]>("bookvault_books", []);
      const localLogs = getLocalStorage<ReadingLog[]>("bookvault_reading_logs", []);
      const localGoals = getLocalStorage<ReadingGoals>("bookvault_reading_goals", {} as ReadingGoals);

      // Simple strategy: Upload all local books & logs that do not exist or are different.
      // 1. Fetch Supabase books
      const { data: dbBooks } = await supabase.from("books").select("id");
      const dbBookIds = new Set(dbBooks?.map((b) => b.id) || []);

      const booksToInsert = localBooks.filter((b) => !dbBookIds.has(b.id)).map(b => ({ ...b, user_id: user.id }));
      if (booksToInsert.length > 0) {
        await supabase.from("books").insert(booksToInsert);
      }

      // Upsert modified ones
      const booksToUpdate = localBooks.filter((b) => dbBookIds.has(b.id));
      for (const b of booksToUpdate) {
        await supabase.from("books").update({ ...b, user_id: user.id }).eq("id", b.id);
      }

      // 2. Fetch Supabase logs
      const { data: dbLogs } = await supabase.from("reading_logs").select("id");
      const dbLogIds = new Set(dbLogs?.map((l) => l.id) || []);

      const logsToInsert = localLogs.filter((l) => !dbLogIds.has(l.id)).map(l => ({ ...l, user_id: user.id }));
      if (logsToInsert.length > 0) {
        await supabase.from("reading_logs").insert(logsToInsert);
      }

      // 3. Upsert Goals
      if (localGoals.pages_per_day) {
        await supabase.from("reading_goals").upsert({
          user_id: user.id,
          year: localGoals.year || new Date().getFullYear(),
          pages_per_day: localGoals.pages_per_day,
          books_per_year: localGoals.books_per_year,
        }, { onConflict: "user_id,year" });
      }

      // Fetch fresh from Supabase and replace local cache
      const { data: freshBooks } = await supabase.from("books").select("*").order("created_at", { ascending: false });
      const { data: freshLogs } = await supabase.from("reading_logs").select("*").order("date", { ascending: false });
      const { data: freshGoals } = await supabase.from("reading_goals").select("*").eq("year", new Date().getFullYear()).maybeSingle();

      if (freshBooks) setLocalStorage("bookvault_books", freshBooks);
      if (freshLogs) setLocalStorage("bookvault_reading_logs", freshLogs);
      if (freshGoals) setLocalStorage("bookvault_reading_goals", freshGoals);

      localStorage.removeItem("bookvault_sync_queue");
      console.log("Offline sync completed successfully!");
    } catch (err) {
      console.error("Failed to sync offline data:", err);
    }
  }
};

// Listen to online events to sync automatically
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    db.syncOfflineData();
  });
}
