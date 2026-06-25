import type { ReactNode } from "react";
import { motion } from "motion/react";

interface RevealProps {
  children: ReactNode;
  /** Direction the content slides in from. */
  from?: "up" | "down" | "left" | "right" | "none";
  /** Stagger delay in seconds. */
  delay?: number;
  /** Travel distance in px (8–24 reads as quiet and intentional). */
  distance?: number;
  className?: string;
  once?: boolean;
}

const offset = (from: RevealProps["from"], d: number) => {
  switch (from) {
    case "down": return { y: -d };
    case "left": return { x: d };
    case "right": return { x: -d };
    case "none": return {};
    default: return { y: d };
  }
};

/**
 * Quiet scroll-reveal wrapper. Subtle, intentional motion that respects
 * prefers-reduced-motion (durations are collapsed globally in app.css).
 */
export function Reveal({ children, from = "up", delay = 0, distance = 20, className, once = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset(from, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
