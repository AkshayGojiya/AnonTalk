"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function Toast({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-success-light px-5 py-3 shadow-[0_12px_30px_-10px_rgba(10,10,20,.3)]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span className="text-sm font-bold whitespace-nowrap text-success-text">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
