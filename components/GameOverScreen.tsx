
import React from 'react';
import ReplayIcon from './icons/ReplayIcon';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestart }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/50 backdrop-blur-md text-white z-10 relative">
      <h1 className="text-6xl md:text-8xl mb-4 text-red-500" style={{ textShadow: '4px 4px #000' }}>
        Game Over
      </h1>
      <div className="text-4xl md:text-5xl mb-12">
        Score: <span className="text-yellow-300">{score}</span>
      </div>
      <button
        onClick={onRestart}
        className="px-10 py-5 bg-blue-500 text-white text-2xl rounded-lg border-b-8 border-blue-700 hover:bg-blue-600 active:border-b-0 active:translate-y-2 transition-all duration-150 flex items-center gap-4"
      >
        <ReplayIcon />
        Replay
      </button>
    </div>
  );
};

export default GameOverScreen;
