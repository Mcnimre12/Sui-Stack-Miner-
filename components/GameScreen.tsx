import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_DURATION_SECONDS, ITEM_TYPES, HOOK_CONFIG, TOTAL_ITEMS } from '../constants';
import type { PlacedItem, HookState } from '../types';

interface GameScreenProps {
  onEndGame: (finalScore: number) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ onEndGame }) => {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SECONDS);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [hook, setHook] = useState<HookState>({
    status: 'swinging',
    angle: 0,
    length: HOOK_CONFIG.baseLength,
    caughtItem: null,
  });

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  /** Place items (no overlap) */
  const generateItems = useCallback(() => {
    const area = gameAreaRef.current;
    if (!area) return;

    const placed: PlacedItem[] = [];
    const maxAttempts = 600;
    let id = 0;

    for (let i = 0; i < TOTAL_ITEMS; i++) {
      let ok = false, tries = 0;
      while (!ok && tries++ < maxAttempts) {
        const t = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        const margin = 6;
        const x = margin + Math.random() * (100 - margin * 2);
        // để sâu hơn pivot, giảm va chạm sớm với dây
        const y = HOOK_CONFIG.pivotY + 12 + Math.random() * (100 - (HOOK_CONFIG.pivotY + 18));
        const cand: PlacedItem = { ...t, id: id++, x, y };

        const overlap = placed.some(p => {
          const ax = (cand.x / 100) * area.clientWidth;
          const ay = (cand.y / 100) * area.clientHeight;
          const bx = (p.x / 100) * area.clientWidth;
          const by = (p.y / 100) * area.clientHeight;
          return Math.hypot(ax - bx, ay - by) < (cand.size + p.size) * 0.55;
        });

        if (!overlap) { placed.push(cand); ok = true; }
      }
    }

    setItems(placed);
  }, []);

  useEffect(() => { generateItems(); }, [generateItems]);

  /** Timer */
  useEffect(() => {
    if (timeLeft <= 0) {
      if (raf.current) cancelAnimationFrame(raf.current);
      onEndGame(score);
      return;
    }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, onEndGame, score]);

  /** Shoot */
  const shootHook = useCallback(() => {
    if (hook.status === 'swinging') {
      setHook(h => ({ ...h, status: 'extending' }));
    }
  }, [hook.status]);

  /** Keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); shootHook(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shootHook]);

  /** Scoring transition */
  useEffect(() => {
    if (hook.status === 'scoring' && hook.caughtItem) {
      const item = hook.caughtItem;
      setScore(s => s + item.points);
      setItems(arr => arr.filter(it => it.id !== item.id));
      setHook(h => ({ ...h, status: 'swinging', caughtItem: null }));
    }
  }, [hook]);

  /** Game loop (physics) */
  useEffect(() => {
    const tick = () => {
      setHook(prev => {
        if (prev.status === 'scoring') return prev;

        const next: HookState = { ...prev };
        const area = gameAreaRef.current;
        if (!area) return prev;

        const pivotX = (HOOK_CONFIG.pivotX / 100) * area.clientWidth;
        const pivotY = (HOOK_CONFIG.pivotY / 100) * area.clientHeight;

        if (next.status === 'swinging') {
          next.angle = HOOK_CONFIG.swingAngleRange * Math.sin(Date.now() * HOOK_CONFIG.swingSpeed);
        } else if (next.status === 'extending') {
          next.length += HOOK_CONFIG.extendSpeed;

          const ang = (next.angle * Math.PI) / 180;
          const tipX = pivotX + next.length * Math.sin(ang);
          const tipY = pivotY + next.length * Math.cos(ang);

          // collision
          for (const it of items) {
            const ix = (it.x / 100) * area.clientWidth;
            const iy = (it.y / 100) * area.clientHeight;
            const dist = Math.hypot(tipX - ix, tipY - iy);
            const hitRadius = Math.max(10, it.size * 0.55);
            if (!next.caughtItem && dist < hitRadius) {
              next.caughtItem = it;
              next.status = 'retracting';
              break;
            }
          }

          // bounds
          if (
            tipX < 0 || tipX > area.clientWidth ||
            tipY > area.clientHeight ||
            next.length > HOOK_CONFIG.maxLength
          ) {
            next.status = 'retracting';
          }
        } else if (next.status === 'retracting') {
          const retract = next.caughtItem
            ? Math.max(1, HOOK_CONFIG.baseRetractSpeed - next.caughtItem.points / 10)
            : HOOK_CONFIG.baseRetractSpeed * 1.5;
          next.length -= retract;

          if (next.length <= HOOK_CONFIG.baseLength) {
            next.length = HOOK_CONFIG.baseLength;
            next.status = next.caughtItem ? 'scoring' : 'swinging';
          }
        }

        return next;
      });

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [items]);

  return (
    <div ref={gameAreaRef} className="w-full h-full relative text-white">

      {/* Top Bar */}
      <div
        className="absolute top-0 left-0 w-full p-4 flex justify-between text-2xl z-20 bg-black/20"
        style={{ textShadow: '2px 2px #000' }}
      >
        <div>Time: <span className="text-yellow-300">{timeLeft}</span></div>
        <div>Score: <span className="text-yellow-300">{score}</span></div>
      </div>

      {/* Miner (pivot visual) */}
      <div
        className="absolute top-0 w-24 h-24 bg-gray-700 border-4 border-black/60 rounded-b-2xl"
        style={{
          left: `calc(${HOOK_CONFIG.pivotX}% - 48px)`,
          top: `calc(${HOOK_CONFIG.pivotY}% - 48px)`,
        }}
      >
        <div className="w-8 h-8 bg-yellow-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* === HOOK GROUP (ONLY RENDER HERE) ===
          Dây, cuốc, và item bị gắp đều trong cùng 1 nhóm xoay/thu kéo */}
      <div
        className="absolute z-30"
        style={{
          left: `${HOOK_CONFIG.pivotX}%`,
          top: `${HOOK_CONFIG.pivotY}%`,
          transform: `rotate(${hook.angle}deg)`,
          transformOrigin: 'top center',
          width: 0,
          height: 0,
        }}
      >
        {/* Rope */}
        <div
          className="absolute bg-gray-800"
          style={{
            left: 0,
            top: 0,
            width: '2px',
            height: `${hook.length}px`,
            transform: 'translateX(-50%)',
          }}
        />

        {/* Pickaxe at rope tip (rotate head downward) */}
        <div
          className="absolute text-3xl select-none"
          style={{
            left: 0,
            top: `${hook.length}px`,
            transform: 'translate(-50%, -50%) rotate(90deg)',
          }}
        >
          ⛏️
        </div>

        {/* Caught item attached to tip */}
        {hook.caughtItem && (
          <div
            className="absolute z-30"
            style={{
              left: 0,
              top: `${hook.length}px`,
              width: `${hook.caughtItem.size}px`,
              height: `${hook.caughtItem.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <img
              src={hook.caughtItem.image}
              alt={hook.caughtItem.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Items (ẩn item đang bị kéo) */}
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            transform: 'translate(-50%, -50%)',
            visibility: hook.caughtItem?.id === item.id ? 'hidden' : 'visible',
          }}
        >
          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
        </div>
      ))}

      {/* Mobile Shoot Button */}
      <button
        onClick={shootHook}
        onTouchStart={(e) => { e.preventDefault(); shootHook(); }}
        className="absolute bottom-4 right-4 md:hidden w-24 h-24 rounded-full bg-red-600 border-b-8 border-red-700 active:border-b-0 active:translate-y-2"
        disabled={hook.status !== 'swinging'}
      >
        GO!
      </button>
    </div>
  );
};

export default GameScreen;
