"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface SortableGridProps<T extends { id: string }> {
  items: T[];
  onReorder: (sourceIndex: number, targetIndex: number) => void;
  onDragStart?: () => void;
  onDragEnd: () => void;
  renderItem: (
    item: T,
    index: number,
    isDragging: boolean,
    isOver: boolean,
    dragProps: any
  ) => React.ReactNode;
  gridClassName?: string;
  sortBy: string;
}

export function SortableGrid<T extends { id: string }>({
  items,
  onReorder,
  onDragStart,
  onDragEnd,
  renderItem,
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
  sortBy,
}: SortableGridProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [startPointerPos, setStartPointerPos] = useState({ x: 0, y: 0 });
  const [startScroll, setStartScroll] = useState({ x: 0, y: 0 });
  const [rects, setRects] = useState<{ id: string; rect: any }[]>([]);
  const [keyboardActiveId, setKeyboardActiveId] = useState<string | null>(null);
  const [successDropId, setSuccessDropId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const autoScrollTimer = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Refs for auto-scroll loop to avoid stale closure issues
  const draggedIndexRef = useRef<number | null>(null);
  const rectsRef = useRef<{ id: string; rect: any }[]>([]);
  const pointerPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    draggedIndexRef.current = draggedIndex;
  }, [draggedIndex]);

  useEffect(() => {
    rectsRef.current = rects;
  }, [rects]);

  useEffect(() => {
    pointerPosRef.current = pointerPos;
  }, [pointerPos]);

  // Measure bounding rects of all visible elements relative to the document
  const measureRects = () => {
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const newRects = items
      .map((item) => {
        const el = itemRefs.current[item.id];
        if (el) {
          const r = el.getBoundingClientRect();
          return {
            id: item.id,
            rect: {
              left: r.left + scrollX,
              right: r.right + scrollX,
              top: r.top + scrollY,
              bottom: r.bottom + scrollY,
              width: r.width,
              height: r.height,
            },
          };
        }
        return null;
      })
      .filter(Boolean) as { id: string; rect: any }[];
    setRects(newRects);
    return newRects;
  };

  // Keyboard accessibility handler
  const handleKeyDown = (e: React.KeyboardEvent, index: number, item: T) => {
    if (sortBy !== "custom") return;

    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (keyboardActiveId === item.id) {
        // Drop item
        setKeyboardActiveId(null);
        setSuccessDropId(item.id);
        setTimeout(() => setSuccessDropId(null), 600);
        onDragEnd();
      } else {
        // Pick up item
        setKeyboardActiveId(item.id);
        onDragStart?.();
        measureRects();
      }
    } else if (keyboardActiveId === item.id) {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (index > 0) {
          onReorder(index, index - 1);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (index < items.length - 1) {
          onReorder(index, index + 1);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setKeyboardActiveId(null);
      }
    }
  };

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent, index: number, item: T) => {
    if (sortBy !== "custom") return;
    if (e.button !== 0) return; // Only left click / primary touch

    // Prevent text selection during drag
    e.preventDefault();

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    setActiveId(item.id);
    setDraggedIndex(index);
    setStartPointerPos({ x: e.clientX, y: e.clientY });
    setPointerPos({ x: e.clientX, y: e.clientY });
    setStartScroll({ x: scrollX, y: scrollY });
    onDragStart?.();

    // Measure document-relative positions immediately
    measureRects();
  };

  // Auto-scroll loop
  const startAutoScroll = (y: number) => {
    if (autoScrollTimer.current) cancelAnimationFrame(autoScrollTimer.current);

    const threshold = 100;
    const speed = 12;
    const height = window.innerHeight;

    let scrollAmount = 0;
    if (y < threshold) {
      scrollAmount = -speed * ((threshold - y) / threshold);
    } else if (y > height - threshold) {
      scrollAmount = speed * ((y - (height - threshold)) / threshold);
    }

    if (scrollAmount !== 0) {
      const scroll = () => {
        window.scrollBy(0, scrollAmount);

        // Compute new document coordinates under cursor during auto-scroll
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;
        const pageX = pointerPosRef.current.x + scrollX;
        const pageY = pointerPosRef.current.y + scrollY;

        const currentRects = rectsRef.current.length > 0 ? rectsRef.current : measureRects();
        const currentDraggedIdx = draggedIndexRef.current;

        if (currentDraggedIdx !== null) {
          const hoverIdx = currentRects.findIndex(({ rect }) => {
            return (
              pageX >= rect.left &&
              pageX <= rect.right &&
              pageY >= rect.top &&
              pageY <= rect.bottom
            );
          });

          if (hoverIdx !== -1 && hoverIdx !== currentDraggedIdx) {
            setOverIndex(hoverIdx);
            onReorder(currentDraggedIdx, hoverIdx);
            setDraggedIndex(hoverIdx);
          }
        }

        autoScrollTimer.current = requestAnimationFrame(scroll);
      };
      autoScrollTimer.current = requestAnimationFrame(scroll);
    }
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      cancelAnimationFrame(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  };

  // Register window pointer events during active drag
  useEffect(() => {
    if (activeId === null || draggedIndex === null) return;

    const handlePointerMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
      startAutoScroll(e.clientY);

      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      const pageX = e.clientX + scrollX;
      const pageY = e.clientY + scrollY;

      const currentRects = rects.length > 0 ? rects : measureRects();
      const hoverIdx = currentRects.findIndex(({ rect }) => {
        return (
          pageX >= rect.left &&
          pageX <= rect.right &&
          pageY >= rect.top &&
          pageY <= rect.bottom
        );
      });

      if (hoverIdx !== -1 && hoverIdx !== draggedIndex) {
        setOverIndex(hoverIdx);
        onReorder(draggedIndex, hoverIdx);
        setDraggedIndex(hoverIdx);
      }
    };

    const handlePointerUp = () => {
      stopAutoScroll();
      setSuccessDropId(activeId);
      setTimeout(() => setSuccessDropId(null), 600);

      setActiveId(null);
      setDraggedIndex(null);
      setOverIndex(null);
      setRects([]);
      onDragEnd();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [activeId, draggedIndex, rects, onReorder, items, onDragEnd]);

  const activeRect = rects.find((r) => r.id === activeId)?.rect;
  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div ref={containerRef} className="relative select-none">
      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="assertive">
        {keyboardActiveId
          ? `Picked up book. Use arrow keys to reorder. Current index is ${items.findIndex((item) => item.id === keyboardActiveId) + 1} of ${items.length}.`
          : "Book dropped."}
      </div>

      <div className={gridClassName}>
        {items.map((item, index) => {
          const isDragging = activeId === item.id || keyboardActiveId === item.id;
          const isOver = overIndex === index;
          const isSuccess = successDropId === item.id;

          const dragProps = {
            onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, index, item),
            onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index, item),
            tabIndex: sortBy === "custom" ? 0 : undefined,
            role: "button",
            "aria-grabbed": isDragging,
            className: sortBy === "custom" ? "focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-3xl" : "",
          };

          return (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              style={{ touchAction: sortBy === "custom" ? "none" : "auto" }}
              className="h-full relative"
            >
              {/* Success drop ring ripple animation */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 1 }}
                    animate={{ scale: 1.08, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 rounded-3xl border-2 border-emerald-500 pointer-events-none z-20 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  />
                )}
              </AnimatePresence>

              {/* Glowing highlight border when actively dragging/keyboard reordering */}
              <div
                className={`h-full rounded-3xl transition-all duration-300 ${
                  isDragging
                    ? "ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] scale-98 opacity-40"
                    : isOver
                    ? "ring-2 ring-indigo-500/50 scale-102 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : ""
                }`}
              >
                {renderItem(item, index, isDragging, isOver, dragProps)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Drag Image Preview Portal / Fixed Container */}
      <AnimatePresence>
        {activeId && activeItem && activeRect && (
          <motion.div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: activeRect.width,
              height: activeRect.height,
              x: pointerPos.x - (startPointerPos.x - (activeRect.left - startScroll.x)),
              y: pointerPos.y - (startPointerPos.y - (activeRect.top - startScroll.y)),
              pointerEvents: "none",
              zIndex: 1000,
            }}
            initial={{ scale: 1, rotate: 0 }}
            animate={{
              scale: shouldReduceMotion ? 1 : 1.04,
              rotate: shouldReduceMotion ? 0 : 2,
              boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.6)",
            }}
            exit={{ scale: 1, rotate: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
          >
            <div className="h-full w-full pointer-events-none opacity-90 ring-2 ring-indigo-500/80 rounded-3xl shadow-[0_0_25px_rgba(99,102,241,0.35)] overflow-hidden">
              {renderItem(activeItem, items.indexOf(activeItem), false, false, {})}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
