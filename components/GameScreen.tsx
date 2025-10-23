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
  const [hook, setHook] = useState<HookState>({ status: 'swinging', angle: 0, length: HOOK_CONFIG.baseLength, caughtItem: null });
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();

  const generateItems = useCallback(() => {
    const newItems: PlacedItem[] = [];
    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const itemType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
      let placed = false;
      let attempts = 0;
      while(!placed && attempts < 100) { // Add attempt limit to prevent infinite loops
        attempts++;
        const newItem: PlacedItem = {
          ...itemType,
          id: i,
          x: 10 + Math.random() * 80, // % from left
          y: 40 + Math.random() * 55, // % from top
        };
        // Simple overlap check
        const overlap = newItems.some(existingItem => {
            const dx = (newItem.x/100 * (gameAreaRef.current?.clientWidth ?? 800)) - (existingItem.x/100 * (gameAreaRef.current?.clientWidth ?? 800));
            const dy = (newItem.y/100 * (gameAreaRef.current?.clientHeight ?? 600)) - (existingItem.y/100 * (gameAreaRef.current?.clientHeight ?? 600));
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < (newItem.size + existingItem.size) / 2;
        });
        if (!overlap) {
            newItems.push(newItem);
            placed = true;
        }
      }
    }
    setItems(newItems);
  }, []);
  
  useEffect(() => {
    // Generate items once the game area is mounted
    if (gameAreaRef.current) {
        generateItems();
    }
  }, [generateItems]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      onEndGame(score);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onEndGame, score]);

  const shootHook = useCallback(() => {
    if (hook.status === 'swinging') {
      setHook((prev) => ({ ...prev, status: 'extending' }));
    }
  }, [hook.status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        shootHook();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shootHook]);

  // This effect handles the 'scoring' state transition.
  // When the hook enters 'scoring' state, we award points, remove the item, and reset the hook to 'swinging'.
  useEffect(() => {
    if (hook.status === 'scoring' && hook.caughtItem) {
      const item = hook.caughtItem;
      // Award points and remove the item from the playfield
      setScore(s => s + item.points);
      setItems(its => its.filter(it => it.id !== item.id));
      
      // Immediately transition the hook back to swinging, with the item removed.
      setHook(h => ({
        ...h,
        status: 'swinging',
        caughtItem: null,
      }));
    }
  }, [hook]);


  // Main Game Loop
  useEffect(() => {
    const gameLogic = () => {
      setHook((prevHook) => {
        // Do not update visuals if we are in the middle of scoring
        if (prevHook.status === 'scoring') return prevHook;

        const newHook = { ...prevHook };
        const gameArea = gameAreaRef.current;
        if (!gameArea) return prevHook;
  
        const pivotPx = {
          x: gameArea.clientWidth * (HOOK_CONFIG.pivotX / 100),
          y: gameArea.clientHeight * (HOOK_CONFIG.pivotY / 100),
        };
  
        if (newHook.status === 'swinging') {
          newHook.angle = HOOK_CONFIG.swingAngleRange * Math.sin(Date.now() * HOOK_CONFIG.swingSpeed);
        } else if (newHook.status === 'extending') {
          newHook.length += HOOK_CONFIG.extendSpeed;
          const angleRad = newHook.angle * (Math.PI / 180);
          const tipX = pivotPx.x + newHook.length * Math.sin(angleRad);
          const tipY = pivotPx.y + newHook.length * Math.cos(angleRad);
          
          // Collision detection
          for (const item of items) {
              const itemPx = {
                  x: gameArea.clientWidth * (item.x / 100),
                  y: gameArea.clientHeight * (item.y / 100)
              }
              const distance = Math.sqrt(Math.pow(tipX - itemPx.x, 2) + Math.pow(tipY - itemPx.y, 2));
              if (distance < item.size / 2) {
                  newHook.status = 'retracting';
                  newHook.caughtItem = item;
                  break;
              }
          }
  
          // Check bounds
          if (tipX < 0 || tipX > gameArea.clientWidth || tipY > gameArea.clientHeight || newHook.length > HOOK_CONFIG.maxLength) {
              newHook.status = 'retracting';
          }
        } else if (newHook.status === 'retracting') {
          const retractSpeed = newHook.caughtItem 
            ? Math.max(1, HOOK_CONFIG.baseRetractSpeed - newHook.caughtItem.points / 10)
            : HOOK_CONFIG.baseRetractSpeed * 1.5;
          newHook.length -= retractSpeed;
  
          if (newHook.length <= HOOK_CONFIG.baseLength) {
            newHook.length = HOOK_CONFIG.baseLength;
            if (newHook.caughtItem) {
              newHook.status = 'scoring'; // Go to a temporary state to trigger scoring
            } else {
              newHook.status = 'swinging';
            }
          }
        }
        return newHook;
      });
    };

    const gameLoop = () => {
      gameLogic();
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [items]); // Rerun effect if items array changes to get fresh closure for collision detection
  
  const angleRad = hook.angle * (Math.PI / 180);
  const hookTipPosition = {
      x: HOOK_CONFIG.pivotX + (hook.length / (gameAreaRef.current?.clientWidth ?? 800) * 100) * Math.sin(angleRad),
      y: HOOK_CONFIG.pivotY + (hook.length / (gameAreaRef.current?.clientHeight ?? 600) * 100) * Math.cos(angleRad)
  }

  return (
    <div ref={gameAreaRef} className="w-full h-full relative text-white z-10">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between text-2xl z-20 bg-black/20" style={{ textShadow: '2px 2px #000' }}>
        <div>Time: <span className="text-yellow-300">{timeLeft}</span></div>
        <div>Score: <span className="text-yellow-300">{score}</span></div>
      </div>
      
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white/10 text-sm leading-relaxed p-4 rounded-lg hidden md:block">
        <p>[SPACE]: Shoot Hook</p>
      </div>

      {/* Miner */}
      <div className="absolute top-0 w-24 h-24 bg-gray-700 border-4 border-gray-900 rounded-b-full" style={{ left: `calc(${HOOK_CONFIG.pivotX}% - 48px)`, top: `calc(${HOOK_CONFIG.pivotY}% - 48px)` }}>
        <div className="w-8 h-8 bg-yellow-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Hook Group: rope and pickaxe tied together */}
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
        {/* Pickaxe at rope tip */}
        <div
          className="absolute text-3xl select-none"
          style={{
            left: 0,
            top: `${hook.length}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          ⛏️
        </div>
      </div>

      {/* Items */}

      {items.map(item => (
        <div key={item.id} className="absolute"
          style={{
            left: `${item.x}%`, top: `${item.y}%`,
            width: `${item.size}px`, height: `${item.size}px`,
            transform: `translate(-50%, -50%)`,
            visibility: hook.caughtItem?.id === item.id ? 'hidden' : 'visible'
          }}>
            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/60 text-yellow-300 text-[10px] font-bold px-1 py-0.5 rounded-md whitespace-nowrap">
              {item.points} pts
            </div>
        </div>
      ))}
      
       {/* Caught Item */}
       {hook.caughtItem && (
         <div className="absolute z-30"
          style={{
            left: `calc(${hookTipPosition.x}%)`, top: `calc(${hookTipPosition.y}%)`,
            width: `${hook.caughtItem.size}px`, height: `${hook.caughtItem.size}px`,
            transform: 'translate(-50%, -50%)'
          }}>
            <img src={hook.caughtItem.image} alt={hook.caughtItem.name} className="w-full h-full object-contain" />
        </div>
       )}

      {/* Mobile Shoot Button */}
      <button
        onClick={shootHook}
        onTouchStart={(e) => { e.preventDefault(); shootHook(); }}
        className="absolute bottom-4 right-4 md:hidden w-24 h-24 bg-red-500 rounded-full text-white text-4xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2"
        disabled={hook.status !== 'swinging'}
      >
        GO!
      </button>
    </div>
  );
};

export default GameScreen;