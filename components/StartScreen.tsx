
import React from 'react';
import { ITEM_TYPES } from '../constants';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/30 backdrop-blur-sm text-white z-10 relative">
      <h1 className="text-6xl md:text-8xl mb-6 text-yellow-300" style={{ textShadow: '4px 4px #000' }}>
        Sui Miners
      </h1>
      
      <div className="bg-black/50 p-4 md:p-6 rounded-lg border-2 border-yellow-400/50 mb-8 max-w-lg w-full">
        <h2 className="text-xl md:text-2xl text-center mb-4 text-yellow-300">Stack Scores</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:text-base">
          {ITEM_TYPES.map((item) => (
            <div key={item.name} className="flex justify-between">
              <span>{item.name}:</span>
              <span className="text-yellow-400">{item.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="px-12 py-6 bg-green-500 text-white text-3xl rounded-lg border-b-8 border-green-700 hover:bg-green-600 active:border-b-0 active:translate-y-2 transition-all duration-150"
      >
        Play
      </button>
       <p className="mt-8 text-center text-sm md:text-base">
          Desktop: Press [SPACE] to shoot hook.
          <br />
          Mobile: Tap the button.
        </p>
    </div>
  );
};

export default StartScreen;
