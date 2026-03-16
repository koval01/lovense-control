'use client';

import { motion } from 'motion/react';

export function SplashLogo() {
  return (
    <motion.svg
      viewBox="0 0 940 240"
      className="w-full max-w-[980px] h-auto overflow-visible"
      fill="none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-label="Lovense splash logo"
      role="img"
    >
      <defs>
        <linearGradient id="lovenseGhostFill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--app-bg)" />
          <stop offset="100%" stopColor="var(--app-bg)" />
        </linearGradient>
        <linearGradient
          id="lovenseChromeSweepText"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="940"
          y2="0"
          gradientTransform="translate(-940 0)"
        >
          <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.44" stopColor="#ffd4ea" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#f20c7f" stopOpacity="0.98" />
          <stop offset="0.56" stopColor="#ffd4ea" stopOpacity="0.22" />
          <stop offset="0.65" stopColor="#ffffff" stopOpacity="0" />
          <animateTransform attributeName="gradientTransform" type="translate" from="-940 0" to="940 0" dur="1.8s" begin="0.22s" fill="freeze" />
        </linearGradient>
      </defs>

      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2, times: [0, 0.16, 0.78, 1], ease: [0.22, 1, 0.36, 1] }}
      >
        <text
          x="470" y="134" textAnchor="middle" fill="url(#lovenseGhostFill)" fontSize="96" fontWeight="600" letterSpacing="0.17em"
          style={{ fontFamily: '"Avenir Next", "SF Pro Display", Inter, system-ui, sans-serif', textTransform: 'uppercase', opacity: 0.006 }}
        >
          LOVENSE
        </text>
        <text
          x="470" y="134" textAnchor="middle" fill="url(#lovenseChromeSweepText)" fontSize="96" fontWeight="600" letterSpacing="0.17em"
          style={{ fontFamily: '"Avenir Next", "SF Pro Display", Inter, system-ui, sans-serif', textTransform: 'uppercase', filter: 'drop-shadow(0 0 10px rgba(242, 12, 127, 0.38))' }}
        >
          LOVENSE
        </text>
      </motion.g>
    </motion.svg>
  );
}
