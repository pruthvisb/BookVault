"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 py-5 text-left font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-wider text-white hover:text-cyan-400 transition-colors cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown className={`h-4.5 w-4.5 text-slate-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-cyan-400" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.25 }, opacity: { duration: 0.2 } } }}
            exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } } }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-[10px] text-slate-450 leading-relaxed uppercase tracking-wider pl-1">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const faqs = [
  {
    question: "Do I need a cloud account to test BookVault?",
    answer: "No, BookVault features a local Sandbox mode accessible with one click from the landing page. All your catalog settings, progress rings, and contribution cells are stored instantly in your browser session without a database signup."
  },
  {
    question: "How does the cloud sync database coordinate offline activity?",
    answer: "If you register for an account and go offline, BookVault queues your reading session writes locally. The moment your browser recovers a network signal, the sync engine writes the backlog to Supabase PostgreSQL automatically."
  },
  {
    question: "Is BookVault completely open source and free to deploy?",
    answer: "Yes, BookVault is licensed under the MIT License. You can fork the repository, copy the SQL schemas, deploy the compilation on your own Vercel host, and configure custom auth redirect URLs for free."
  },
  {
    question: "What stats are calculated in the analytics charts?",
    answer: "The analytics engine calculates aggregate finished volumes, daily page count frequencies, and average reading speed (Pages Per Minute) based on the session times logged."
  }
];

export const FAQ: React.FC = () => {
  return (
    <section className="w-full py-28 border-b border-white/5 bg-transparent relative">
      <div className="w-full max-w-4xl mx-auto px-6 space-y-16">
        
        {/* Title Block */}
        <div className="text-center space-y-2">
          <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold">[ 05 / SUPPORT ]</span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white uppercase font-mono">Frequently Asked Questions</h2>
        </div>

        {/* FAQ List */}
        <div className="border-t border-white/10">
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>

      </div>
    </section>
  );
};
