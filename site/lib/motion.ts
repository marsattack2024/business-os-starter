import type { Variants } from "framer-motion";
import {
  motionDurations,
  motionEasings,
  motionOffsets,
  motionStagger,
} from "./motion.config";

const easeOut = motionEasings.out;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: motionOffsets.md },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDurations.lg, ease: easeOut },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: motionDurations.hero, ease: "easeOut" },
  },
};

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: motionStagger.base,
      delayChildren: motionStagger.sm,
    },
  },
};
