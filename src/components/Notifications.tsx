"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";

export type NotificationType = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (
    title: string,
    description?: string,
    type?: NotificationType,
    duration?: number
  ) => void;
  toasts: ToastMessage[];
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback(
    (title: string, description?: string, type: NotificationType = "info", duration = 4000) => {
      const id = window.crypto.randomUUID();
      const newToast: ToastMessage = { id, title, description, type, duration };
      
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissNotification(id);
        }, duration);
      }
    },
    [dismissNotification]
  );

  return (
    <NotificationContext.Provider value={{ showNotification, toasts, dismissNotification }}>
      {children}
      {/* Toast Portal/Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${
                toast.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-100"
                  : toast.type === "error"
                  ? "bg-rose-950/40 border-rose-500/20 text-rose-100"
                  : toast.type === "warning"
                  ? "bg-amber-950/40 border-amber-500/20 text-amber-100"
                  : "bg-slate-900/60 border-slate-500/20 text-slate-100"
              }`}
            >
              {/* Icon */}
              <div className="mt-0.5">
                {toast.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                {toast.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400" />}
                {toast.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                {toast.type === "info" && <Info className="h-5 w-5 text-blue-400" />}
              </div>

              {/* Text details */}
              <div className="flex-1">
                <h4 className="font-semibold text-sm leading-tight text-white">{toast.title}</h4>
                {toast.description && (
                  <p className="mt-1 text-xs opacity-80 leading-normal">{toast.description}</p>
                )}
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => dismissNotification(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
