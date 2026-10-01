"use client";

import { motion } from "framer-motion";

const orbitPaths = [
  "M120 525 C255 260 735 225 880 500 C715 735 300 790 120 525Z",
  "M85 470 C320 355 690 315 915 555 C680 665 325 690 85 470Z",
  "M250 160 C470 355 595 650 700 855",
  "M160 720 C360 560 590 420 845 280",
  "M175 300 C390 520 620 605 850 690"
];

const stars = Array.from({ length: 72 }, (_, index) => ({
  left: ((index * 37) % 97) + 1,
  top: ((index * 61) % 93) + 2,
  size: index % 11 === 0 ? 2.2 : index % 4 === 0 ? 1.4 : 0.8,
  delay: (index % 9) * 0.22
}));

export function AuthScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(22,38,72,.28),transparent_29%),radial-gradient(circle_at_18%_18%,rgba(143,0,0,.14),transparent_24%),radial-gradient(circle_at_82%_28%,rgba(58,76,125,.18),transparent_22%),linear-gradient(180deg,#010207_0%,#000_70%)]" />

      <div className="absolute inset-0 opacity-90">
        {stars.map((star, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size
            }}
            animate={{
              opacity: [0.16, 0.95, 0.2],
              scale: [0.8, 1.25, 0.82]
            }}
            transition={{
              duration: 2.6 + (index % 5) * 0.35,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.76, y: 34 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <motion.div
          animate={{
            y: [0, -7, 0],
            rotate: [-0.6, 0.7, -0.6]
          }}
          transition={{
            y: { duration: 7.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 18, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative h-[min(78vw,760px)] w-[min(78vw,760px)] min-h-[360px] min-w-[360px] sm:min-h-[520px] sm:min-w-[520px]"
        >
          <img
            src="/global-stock-earth.png"
            alt=""
            draggable={false}
            className="h-full w-full select-none object-contain drop-shadow-[0_0_46px_rgba(41,91,180,.22)]"
          />

          <div className="pointer-events-none absolute inset-[9%] rounded-full shadow-[inset_-44px_-22px_80px_rgba(0,0,0,.28),0_0_70px_rgba(66,128,255,.13)]" />
        </motion.div>
      </motion.div>

      <svg
        viewBox="0 0 1000 1000"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(92vw,900px)] w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="orbitGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="orbitStroke" x1="0" x2="1">
            <stop offset="0%" stopColor="#450000" stopOpacity="0.15" />
            <stop offset="35%" stopColor="#ff2c2c" stopOpacity="0.86" />
            <stop offset="70%" stopColor="#d90000" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#320000" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {orbitPaths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#orbitStroke)"
            strokeWidth={index < 2 ? 2.1 : 1.35}
            strokeLinecap="round"
            filter="url(#orbitGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1, 1],
              opacity: [0, 0.9, 0.22],
              strokeDashoffset: [0, -180]
            }}
            strokeDasharray={index % 2 ? "10 16" : "22 18"}
            transition={{
              pathLength: {
                duration: 2.4,
                delay: 0.35 + index * 0.12,
                ease: [0.16, 1, 0.3, 1]
              },
              opacity: {
                duration: 4.8,
                delay: index * 0.08,
                ease: "easeInOut"
              },
              strokeDashoffset: {
                duration: 7 + index,
                repeat: Infinity,
                ease: "linear"
              }
            }}
          />
        ))}

        {[
          [238, 355],
          [372, 276],
          [610, 298],
          [744, 415],
          [718, 660],
          [480, 735],
          [292, 650]
        ].map(([cx, cy], index) => (
          <motion.circle
            key={index}
            cx={cx}
            cy={cy}
            r={index % 3 === 0 ? 6 : 4}
            fill="#ff2a2a"
            filter="url(#orbitGlow)"
            animate={{ opacity: [0.25, 1, 0.25], r: [3, 6, 3] }}
            transition={{
              duration: 1.8 + index * 0.12,
              repeat: Infinity,
              delay: index * 0.16
            }}
          />
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.8, 0.18] }}
        transition={{ duration: 5.2, times: [0, 0.18, 0.55, 1] }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[74vw] max-w-[980px] -translate-x-1/2 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_24px_rgba(255,0,0,.55)]"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,.05)_48%,rgba(0,0,0,.68)_100%)]" />
    </div>
  );
}
