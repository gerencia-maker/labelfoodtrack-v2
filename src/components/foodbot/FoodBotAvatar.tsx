"use client";

import { Lightbulb } from "lucide-react";

const SIZES = {
  sm: 40,
  md: 56,
  lg: 80,
  xl: 120,
};

export function FoodBotAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const px = SIZES[size];

  return (
    <div className="relative inline-flex" style={{ width: px, height: px }}>
      <svg
        viewBox="0 0 120 120"
        width={px}
        height={px}
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          {/* 3D Shadow */}
          <filter id="shadow3d">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.3" />
          </filter>
          {/* Skin gradient */}
          <radialGradient id="skin3d" cx="35%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#FFF0E0" />
            <stop offset="30%" stopColor="#FFE4C9" />
            <stop offset="60%" stopColor="#F5D0B0" />
            <stop offset="100%" stopColor="#D4A07A" />
          </radialGradient>
          {/* Hair gradient */}
          <radialGradient id="hair3d" cx="50%" cy="25%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#F8F8F8" />
            <stop offset="60%" stopColor="#E0E0E0" />
            <stop offset="100%" stopColor="#A8A8A8" />
          </radialGradient>
          {/* Eye gradient */}
          <radialGradient id="eye3d" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#8B6914" />
            <stop offset="70%" stopColor="#5C4008" />
            <stop offset="100%" stopColor="#3A2805" />
          </radialGradient>
          {/* Background gradient */}
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="50%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle cx="60" cy="60" r="58" fill="url(#bgGrad)" filter="url(#shadow3d)" />
        <circle cx="60" cy="60" r="55" fill="url(#bgGrad)" opacity="0.9" />

        {/* Lab coat collar */}
        <path d="M35 105 Q40 88 60 85 Q80 88 85 105" fill="#FFFFFF" opacity="0.95" />
        <path d="M38 105 Q42 92 60 89 Q78 92 82 105" fill="#F0F0F0" />
        {/* Collar V */}
        <path d="M50 89 L60 100 L70 89" fill="none" stroke="#DDD" strokeWidth="1.5" />

        {/* Neck */}
        <ellipse cx="60" cy="86" rx="10" ry="6" fill="url(#skin3d)" />

        {/* Face */}
        <ellipse cx="60" cy="62" rx="28" ry="30" fill="url(#skin3d)" />
        {/* Jaw shadow */}
        <ellipse cx="60" cy="78" rx="22" ry="8" fill="#D4A07A" opacity="0.3" />
        {/* Cheek highlight left */}
        <ellipse cx="42" cy="55" rx="8" ry="6" fill="#FFFFFF" opacity="0.15" />

        {/* Hair - wild Einstein style */}
        {/* Back hair volume */}
        <ellipse cx="60" cy="38" rx="36" ry="28" fill="url(#hair3d)" />
        {/* Wild tufts left */}
        <ellipse cx="28" cy="42" rx="14" ry="10" fill="url(#hair3d)" transform="rotate(-20 28 42)" />
        <ellipse cx="24" cy="35" rx="10" ry="8" fill="#F0F0F0" transform="rotate(-30 24 35)" />
        {/* Wild tufts right */}
        <ellipse cx="92" cy="42" rx="14" ry="10" fill="url(#hair3d)" transform="rotate(20 92 42)" />
        <ellipse cx="96" cy="35" rx="10" ry="8" fill="#F0F0F0" transform="rotate(30 96 35)" />
        {/* Top tufts */}
        <ellipse cx="50" cy="22" rx="12" ry="10" fill="#F5F5F5" transform="rotate(-10 50 22)" />
        <ellipse cx="70" cy="22" rx="12" ry="10" fill="#F5F5F5" transform="rotate(10 70 22)" />
        <ellipse cx="60" cy="18" rx="10" ry="9" fill="#FFFFFF" />
        {/* Hair highlight */}
        <ellipse cx="55" cy="26" rx="15" ry="6" fill="#FFFFFF" opacity="0.5" transform="rotate(-5 55 26)" />

        {/* Ears */}
        <ellipse cx="33" cy="62" rx="5" ry="7" fill="url(#skin3d)" />
        <ellipse cx="87" cy="62" rx="5" ry="7" fill="url(#skin3d)" />

        {/* Eyebrows - thick white */}
        <path d="M40 48 Q46 43 54 46" stroke="#E8E8E8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M66 46 Q74 43 80 48" stroke="#E8E8E8" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Eyes */}
        {/* Left eye white */}
        <ellipse cx="47" cy="56" rx="9" ry="8" fill="#FFFFFF" />
        <ellipse cx="47" cy="56" rx="9" ry="8" fill="none" stroke="#C9A882" strokeWidth="0.5" />
        {/* Left pupil */}
        <circle cx="48" cy="56" r="5" fill="url(#eye3d)" />
        <circle cx="48" cy="56" r="3" fill="#2A1A05" />
        {/* Left eye highlights */}
        <circle cx="46" cy="54" r="2" fill="#FFFFFF" opacity="0.9" />
        <circle cx="50" cy="57" r="1" fill="#FFFFFF" opacity="0.6" />

        {/* Right eye white */}
        <ellipse cx="73" cy="56" rx="9" ry="8" fill="#FFFFFF" />
        <ellipse cx="73" cy="56" rx="9" ry="8" fill="none" stroke="#C9A882" strokeWidth="0.5" />
        {/* Right pupil */}
        <circle cx="74" cy="56" r="5" fill="url(#eye3d)" />
        <circle cx="74" cy="56" r="3" fill="#2A1A05" />
        {/* Right eye highlights */}
        <circle cx="72" cy="54" r="2" fill="#FFFFFF" opacity="0.9" />
        <circle cx="76" cy="57" r="1" fill="#FFFFFF" opacity="0.6" />

        {/* Nose */}
        <ellipse cx="60" cy="66" rx="4" ry="3" fill="#E8C4A0" />
        <ellipse cx="59" cy="65" rx="2" ry="1.5" fill="#F5D8BF" opacity="0.6" />

        {/* Mustache - iconic Einstein */}
        <path
          d="M44 72 Q48 76 52 74 Q56 72 60 74 Q64 72 68 74 Q72 76 76 72"
          fill="#E8E8E8"
          stroke="#D0D0D0"
          strokeWidth="0.5"
        />
        <path
          d="M46 73 Q50 77 54 75 Q57 73 60 75 Q63 73 66 75 Q70 77 74 73"
          fill="#F0F0F0"
          opacity="0.7"
        />

        {/* Smile */}
        <path d="M48 78 Q60 86 72 78" fill="none" stroke="#C08060" strokeWidth="1.5" strokeLinecap="round" />
        {/* Lower lip hint */}
        <path d="M52 80 Q60 84 68 80" fill="#E8A080" opacity="0.3" />

        {/* Cheek blush */}
        <ellipse cx="38" cy="70" rx="6" ry="4" fill="#FFB0A0" opacity="0.25" />
        <ellipse cx="82" cy="70" rx="6" ry="4" fill="#FFB0A0" opacity="0.25" />

        {/* Glasses - thin wire */}
        <circle cx="47" cy="56" r="12" fill="none" stroke="#A08060" strokeWidth="1.2" opacity="0.6" />
        <circle cx="73" cy="56" r="12" fill="none" stroke="#A08060" strokeWidth="1.2" opacity="0.6" />
        <path d="M59 56 L61 56" stroke="#A08060" strokeWidth="1" opacity="0.6" />
        <path d="M35 56 L30 52" stroke="#A08060" strokeWidth="1" opacity="0.6" />
        <path d="M85 56 L90 52" stroke="#A08060" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Animated lightbulb badge */}
      {(size === "lg" || size === "xl") && (
        <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-yellow-500/50 animate-pulse">
          <Lightbulb className="h-4 w-4 text-yellow-900" fill="currentColor" />
        </div>
      )}
      {size === "md" && (
        <div className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md shadow-yellow-500/40 animate-pulse">
          <Lightbulb className="h-3 w-3 text-yellow-900" fill="currentColor" />
        </div>
      )}
    </div>
  );
}
