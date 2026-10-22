import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, X, Share2, Globe, Clock, Sparkles } from 'lucide-react';

interface FlipUnitProps {
  digit: string;
  subText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FlipUnit: React.FC<FlipUnitProps> = ({ digit, subText, size = 'md' }) => {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (digit !== current) {
      setPrevious(current);
      setCurrent(digit);
      setIsFlipping(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setIsFlipping(false);
      }, 580);
    }
  }, [digit, current]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Size configurations
  const sizeMap = {
    sm: {
      card: 'w-12 h-14 rounded-lg',
      fontSize: 'text-2xl',
      heightPx: 56,
      subTextPos: 'bottom-1 left-1.5 text-[8px]',
      notch: 'w-1 h-2',
    },
    md: {
      card: 'w-16 h-20 sm:w-20 sm:h-24 rounded-xl',
      fontSize: 'text-4xl sm:text-5xl',
      heightPx: 96,
      subTextPos: 'bottom-1.5 left-2 text-[9px] sm:text-[10px]',
      notch: 'w-1.5 h-3',
    },
    lg: {
      card: 'w-36 h-44 sm:w-52 sm:h-64 md:w-60 md:h-72 rounded-2xl',
      fontSize: 'text-7xl sm:text-9xl md:text-[10rem]',
      heightPx: 260,
      subTextPos: 'bottom-4 left-5 text-sm sm:text-base font-black',
      notch: 'w-2.5 h-5',
    },
  };

  const cfg = sizeMap[size];

  return (
    <div className={`relative ${cfg.card} select-none shadow-2xl perspective-1000 bg-[#161618] border border-black/60`}>
      {/* ── Background: Upper static half (shows NEW / current digit) ── */}
      <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-xl bg-gradient-to-b from-[#242428] via-[#202024] to-[#1c1c20] border-b border-black/40">
        <div
          className={`w-full h-full flex items-end justify-center font-sans font-black tracking-tight text-[#e2e8f0] ${cfg.fontSize}`}
          style={{ lineHeight: 0.95 }}
        >
          <span className="translate-y-[50%]">{current}</span>
        </div>
      </div>

      {/* ── Background: Lower static half (shows PREVIOUS digit while flipping, else CURRENT) ── */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-xl bg-gradient-to-b from-[#171719] via-[#1a1a1d] to-[#1e1e22] shadow-inner">
        <div
          className={`w-full h-full flex items-start justify-center font-sans font-black tracking-tight text-[#cbd5e1] ${cfg.fontSize}`}
          style={{ lineHeight: 0.95 }}
        >
          <span className="-translate-y-[50%]">{isFlipping ? previous : current}</span>
        </div>
        {subText && (
          <span className={`absolute ${cfg.subTextPos} font-black tracking-widest text-zinc-500 uppercase z-10`}>
            {subText}
          </span>
        )}
      </div>

      {/* ── 3D Animated Flap: Folding down upper half (shows PREVIOUS digit) ── */}
      {isFlipping && (
        <div
          key={`top-${previous}`}
          className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-xl bg-gradient-to-b from-[#242428] via-[#202024] to-[#1c1c20] z-20 flip-card-top-anim backface-hidden border-b border-black/40 shadow-lg"
        >
          <div
            className={`w-full h-full flex items-end justify-center font-sans font-black tracking-tight text-[#e2e8f0] ${cfg.fontSize}`}
            style={{ lineHeight: 0.95 }}
          >
            <span className="translate-y-[50%]">{previous}</span>
          </div>
        </div>
      )}

      {/* ── 3D Animated Flap: Unfolding lower half (shows CURRENT digit) ── */}
      {isFlipping && (
        <div
          key={`bottom-${current}`}
          className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-xl bg-gradient-to-b from-[#18181b] via-[#1a1a1d] to-[#1e1e22] z-20 flip-card-bottom-anim backface-hidden shadow-2xl"
        >
          <div
            className={`w-full h-full flex items-start justify-center font-sans font-black tracking-tight text-[#cbd5e1] ${cfg.fontSize}`}
            style={{ lineHeight: 0.95 }}
          >
            <span className="-translate-y-[50%]">{current}</span>
          </div>
          {subText && (
            <span className={`absolute ${cfg.subTextPos} font-black tracking-widest text-zinc-500 uppercase z-10`}>
              {subText}
            </span>
          )}
        </div>
      )}

      {/* ── Physical Center Split Line ── */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#0c0c0e] shadow-[0_1px_0_rgba(255,255,255,0.06)] z-30 pointer-events-none" />

      {/* ── Mechanical Hinge Notches (left & right) ── */}
      <div className={`absolute -left-[1px] top-1/2 -translate-y-1/2 ${cfg.notch} bg-[#101012] rounded-r-sm z-30 pointer-events-none border-y border-r border-black/60`} />
      <div className={`absolute -right-[1px] top-1/2 -translate-y-1/2 ${cfg.notch} bg-[#101012] rounded-l-sm z-30 pointer-events-none border-y border-l border-black/60`} />
    </div>
  );
};

interface FlipClockProps {
  size?: 'sm' | 'md' | 'lg';
  showSeconds?: boolean;
  showDate?: boolean;
  allowExpand?: boolean;
}

export const FlipClock: React.FC<FlipClockProps> = ({
  size = 'md',
  showSeconds = true,
  showDate = true,
  allowExpand = true,
}) => {
  const [time, setTime] = useState(new Date());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const rawHours = time.getHours();
  const hours12 = rawHours % 12 || 12;
  const hoursStr = String(hours12).padStart(2, '0');
  const minutesStr = String(time.getMinutes()).padStart(2, '0');
  const secondsStr = String(time.getSeconds()).padStart(2, '0');
  const ampm = rawHours >= 12 ? 'PM' : 'AM';

  const dateStr = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      {/* ── Compact / Banner Mode ── */}
      <div className="flex flex-col items-center sm:items-end">
        <div
          onClick={() => allowExpand && setExpanded(true)}
          className={`relative group inline-flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#0e0e11]/80 backdrop-blur-md border border-white/10 shadow-xl transition-all ${
            allowExpand ? 'cursor-pointer hover:border-blue-500/40 hover:bg-[#0e0e11]' : ''
          }`}
          title={allowExpand ? 'Click to expand retro split-flap clock' : undefined}
        >
          {/* Hours Flap */}
          <FlipUnit digit={hoursStr} subText={ampm} size={size} />

          {/* Minutes Flap */}
          <FlipUnit digit={minutesStr} size={size} />

          {/* Seconds Flap (Proportionately smaller, just like screenshot) */}
          {showSeconds && (
            <div className="ml-0.5 self-center">
              <FlipUnit digit={secondsStr} size="sm" />
            </div>
          )}

          {/* Expand hover indicator */}
          {allowExpand && (
            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>

        {showDate && (
          <div className="text-[11px] sm:text-xs text-slate-300 font-medium mt-1.5 text-center sm:text-right tracking-tight">
            {dateStr}
          </div>
        )}
      </div>

      {/* ── Fullscreen Split-Flap Clock Overlay (Matches Uploaded Screenshot) ── */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-[#121214] flex flex-col justify-between p-6 sm:p-10 select-none text-zinc-400 animate-fadeIn">
          {/* Top Header: "fff." or AM DEV Pro */}
          <div className="w-full flex items-center justify-between">
            <div className="flex-1" />
            <div className="text-center">
              <span className="font-serif italic text-xl tracking-wider text-zinc-300">fff.</span>
              <span className="block text-[10px] uppercase tracking-widest text-zinc-600 font-sans mt-0.5">
                AM DEV Pro Workplace Clock
              </span>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="w-10 h-10 rounded-full border border-zinc-700/80 hover:border-zinc-400 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center: Flip Clock with Social Circles on Left and Close on Right */}
          <div className="flex-1 flex items-center justify-center relative my-4">
            {/* Left Social Circle Icons (matching screenshot) */}
            <div className="hidden md:flex flex-col gap-3 absolute left-6 sm:left-12">
              {['f', 't', 'g+', 'pin'].map((network) => (
                <div
                  key={network}
                  className="w-9 h-9 rounded-full border border-zinc-700 hover:border-zinc-400 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                >
                  {network}
                </div>
              ))}
            </div>

            {/* Big Flip Clock Centerpiece */}
            <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
              {/* Large Hours Flap */}
              <FlipUnit digit={hoursStr} subText={ampm} size="lg" />

              {/* Large Minutes Flap */}
              <FlipUnit digit={minutesStr} size="lg" />

              {/* Smaller Seconds Flap beside minutes (matching screenshot) */}
              <div className="self-center translate-y-2 sm:translate-y-4">
                <FlipUnit digit={secondsStr} size="md" />
              </div>
            </div>
          </div>

          {/* Bottom Footer (matching screenshot) */}
          <div className="w-full text-center space-y-1">
            <div className="text-xs text-zinc-400 font-medium">about this workplace clock</div>
            <div className="text-[10px] text-zinc-600 tracking-wider">
              {dateStr} • live mechanical split-flap simulation • press ESC to exit
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FlipClock;
