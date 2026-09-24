import React from 'react';
import { motion } from 'motion/react';

interface MessagingVectorIllustrationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MessagingVectorIllustration: React.FC<MessagingVectorIllustrationProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions =
    size === 'sm'
      ? { width: 140, height: 110 }
      : size === 'lg'
      ? { width: 340, height: 260 }
      : { width: 260, height: 200 };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-cyan-500/20 to-indigo-500/20 rounded-full blur-2xl transform scale-90 pointer-events-none" />

      <svg
        viewBox="0 0 320 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_15px_30px_rgba(6,182,212,0.25)]"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="mainBubbleGrad" x1="20" y1="30" x2="200" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="secBubbleGrad" x1="120" y1="80" x2="290" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="60%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>

          <linearGradient id="accentGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5eead4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="dropShadowGlow">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#06b6d4" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Dynamic Wave Signal Path Connecting Bubbles */}
        <motion.path
          d="M 100 120 C 140 70, 180 180, 220 130"
          stroke="url(#strokeGrad)"
          strokeWidth="3"
          strokeDasharray="6 6"
          fill="none"
          animate={{ strokeDashoffset: [0, -36] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          opacity="0.8"
        />

        {/* Orbit Signal Ring (Transmission) */}
        <motion.circle
          cx="160"
          cy="125"
          r="65"
          stroke="#06b6d4"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '160px 125px' }}
          opacity="0.4"
        />

        {/* Left Primary Floating Bubble (Emerald/Teal) */}
        <motion.g
          animate={{
            y: [-4, 5, -4],
            rotate: [-1, 1.5, -1],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Main Bubble Base */}
          <path
            d="M 40 50 
               C 40 33.4, 53.4 20, 70 20 
               L 180 20 
               C 196.6 20, 210 33.4, 210 50 
               L 210 115 
               C 210 131.6, 196.6 145, 180 145 
               L 85 145 
               L 50 170 
               L 55 145 
               C 46.5 142, 40 134, 40 125 
               Z"
            fill="url(#mainBubbleGrad)"
            stroke="url(#strokeGrad)"
            strokeWidth="2"
            filter="url(#dropShadowGlow)"
          />

          {/* Internal Message Lines (Visual Chat Preview) */}
          <rect x="65" y="45" width="85" height="9" rx="4.5" fill="#ffffff" fillOpacity="0.9" />
          <rect x="65" y="65" width="115" height="8" rx="4" fill="#ccfbf1" fillOpacity="0.75" />
          <rect x="65" y="83" width="70" height="8" rx="4" fill="#a7f3d0" fillOpacity="0.7" />

          {/* Voice Wave Graphic inside bubble */}
          <g transform="translate(65, 105)">
            <rect x="0" y="5" width="3.5" height="12" rx="1.75" fill="#ffffff" opacity="0.95" />
            <rect x="6" y="2" width="3.5" height="18" rx="1.75" fill="#ffffff" opacity="0.95" />
            <rect x="12" y="7" width="3.5" height="9" rx="1.75" fill="#ffffff" opacity="0.95" />
            <rect x="18" y="0" width="3.5" height="22" rx="1.75" fill="#ffffff" opacity="0.95" />
            <rect x="24" y="4" width="3.5" height="15" rx="1.75" fill="#ffffff" opacity="0.95" />
            <rect x="30" y="8" width="3.5" height="7" rx="1.75" fill="#ffffff" opacity="0.95" />
            <text x="42" y="16" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
              VOICE
            </text>
          </g>

          {/* Glowing 9-Digit Badge */}
          <g transform="translate(142, 38)">
            <rect width="52" height="20" rx="10" fill="#022c22" stroke="#34d399" strokeWidth="1.5" />
            <text x="7" y="14" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace">
              9-DIGIT
            </text>
          </g>
        </motion.g>

        {/* Right Secondary Floating Bubble (Indigo/Purple) */}
        <motion.g
          animate={{
            y: [5, -5, 5],
            rotate: [1, -1.5, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          {/* Secondary Bubble Base */}
          <path
            d="M 125 115 
               C 125 98.4, 138.4 85, 155 85 
               L 265 85 
               C 281.6 85, 295 98.4, 295 115 
               L 295 180 
               C 295 196.6, 281.6 210, 265 210 
               L 245 210 
               L 260 235 
               L 225 210 
               L 155 210 
               C 138.4 210, 125 196.6, 125 180 
               Z"
            fill="url(#secBubbleGrad)"
            stroke="#818cf8"
            strokeWidth="2"
            opacity="0.95"
          />

          {/* Internal Message Lines */}
          <rect x="150" y="112" width="105" height="8" rx="4" fill="#ffffff" fillOpacity="0.9" />
          <rect x="150" y="129" width="75" height="8" rx="4" fill="#c7d2fe" fillOpacity="0.75" />

          {/* Double Checkmark (Delivery indicator) */}
          <g transform="translate(255, 185)">
            <path
              d="M 2 8 L 6 12 L 14 3 M 7 8 L 11 12 L 19 3"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* Full Display Pill Tag */}
          <g transform="translate(148, 153)">
            <rect width="78" height="22" rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.2" />
            <circle cx="10" cy="11" r="3" fill="#38bdf8" />
            <text x="18" y="15" fill="#e0e7ff" fontSize="10" fontWeight="600" fontFamily="sans-serif">
              ফুল ডিসপ্লে
            </text>
          </g>
        </motion.g>

        {/* Floating Sparks & Security Shield Icons */}
        <motion.g
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          transform="translate(100, 15)"
        >
          <polygon
            points="12,0 15,9 24,12 15,15 12,24 9,15 0,12 9,9"
            fill="#34d399"
            filter="url(#softGlow)"
          />
        </motion.g>

        <motion.g
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          transform="translate(275, 55)"
        >
          <polygon
            points="10,0 12,7 19,10 12,12 10,19 7,12 0,10 7,7"
            fill="#38bdf8"
            filter="url(#softGlow)"
          />
        </motion.g>

        {/* Floating Mini Lock Badge (E2E Encrypted) */}
        <motion.g
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          transform="translate(25, 110)"
        >
          <circle cx="16" cy="16" r="16" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
          <path
            d="M 12 14 V 11 C 12 8.8, 13.8 7, 16 7 C 18.2 7, 20 8.8, 20 11 V 14 M 10 14 H 22 V 22 H 10 Z"
            stroke="#22d3ee"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>

        {/* Floating Offline Mesh Signal Icon */}
        <motion.g
          animate={{ y: [3, -3, 3] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          transform="translate(280, 140)"
        >
          <circle cx="14" cy="14" r="14" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
          <path
            d="M 8 18 L 14 10 L 20 18 M 11 15 L 17 15"
            stroke="#c084fc"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.g>
      </svg>
    </div>
  );
};
