import { motion, AnimatePresence } from "framer-motion"

export function DeathCounter({ count }: { count: number }) {
  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text3)]">
        Total Interred
      </div>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 block font-display text-5xl leading-none tracking-tight text-[var(--text)]"
        >
          {count.toLocaleString()}
        </motion.span>
      </AnimatePresence>
      <div className="mt-5 h-14 rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] p-2">
        <div className="relative h-full w-full overflow-hidden rounded-[10px] border border-[var(--border)]">
          <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border)]" />
          <svg viewBox="0 0 100 40" className="h-full w-full">
            <defs>
              <linearGradient id="counter-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <path
              d="M0 28 C10 24, 14 32, 24 20 S45 30, 55 17 S74 14, 82 26 S92 18, 100 15"
              fill="none"
              stroke="url(#counter-line)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
