'use client';

import { motion } from 'motion/react';
import { SplashLogo } from '@/components/home/SplashLogo';

export function SplashScreen() {
  return (
    <motion.div
      key="splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.34 }}
      className="fixed inset-0 z-[1000] overflow-hidden bg-[var(--app-bg)]"
    >
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[360px] h-[220px] pointer-events-none rounded-full"
        initial={{ opacity: 0, x: '-34vw' }}
        animate={{ opacity: [0, 0.16, 0], x: ['-40vw', '38vw', '115vw'] }}
        transition={{ duration: 1.8, delay: 0.22, times: [0, 0.56, 1], ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255, 91, 171, 0.24) 0%, rgba(255, 91, 171, 0.09) 35%, rgba(255, 255, 255, 0) 72%)',
          filter: 'blur(34px)',
          mixBlendMode: 'screen',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-10">
        <SplashLogo />
      </div>
    </motion.div>
  );
}
