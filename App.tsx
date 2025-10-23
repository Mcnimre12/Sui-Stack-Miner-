
import React, { useState, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.Start);
  const [score, setScore] = useState(0);

  const startGame = useCallback(() => {
    setScore(0);
    setGameState(GameState.Playing);
  }, []);

  const endGame = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameState(GameState.GameOver);
  }, []);

  const restartGame = useCallback(() => {
    setGameState(GameState.Start);
  }, []);

  const renderScreen = () => {
    switch (gameState) {
      case GameState.Start:
        return <StartScreen onStart={startGame} />;
      case GameState.Playing:
        return <GameScreen onEndGame={endGame} />;
      case GameState.GameOver:
        return <GameOverScreen score={score} onRestart={restartGame} />;
      default:
        return <StartScreen onStart={startGame} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center font-press-start select-none p-4">
      <div className="w-full max-w-4xl aspect-[4/3] border-8 border-yellow-900/50 shadow-2xl relative overflow-hidden bg-[#6b4226]">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-sky-400 to-sky-600 z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-[85%] bg-gradient-to-b from-[#a05a2c] to-[#5e3414] z-0"></div>
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;