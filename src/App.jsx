import React, { useState } from 'react';
import PinballRace from './components/PinballRace';
import './App.css'; // 간단한 스타일링을 위해

function App() {
  const [gameState, setGameState] = useState('IDLE'); // IDLE, RACING, FINISHED
  const [winner, setWinner] = useState(null);
  const [gameId, setGameId] = useState(0); // 리셋을 위한 키값

  const startGame = () => {
    setWinner(null);
    setGameState('RACING');
    setGameId(prev => prev + 1); // key를 변경하여 PinballRace 재시작
  };

  const handleWinner = (ballLabel) => {
    // 이미 승자가 결정된 상태라면 무시 (첫 번째 공만 인정)
    if (gameState === 'FINISHED') return;

    setGameState('FINISHED');
    setWinner(ballLabel);
  };

  return (
    <div className="app-container">
      <header>
        <h1>🏆 MARBLE RACE 🏆</h1>
      </header>

      <main>
        <div className="game-screen">
          {/* 게임 시작 전이면 오버레이 표시 */}
          {gameState === 'IDLE' && (
            <div className="overlay">
              <button className="start-btn" onClick={startGame}>경기 시작!</button>
            </div>
          )}

          {/* 게임 컴포넌트 (key를 통해 리셋 가능하게 설정) */}
          {gameState !== 'IDLE' && (
            <PinballRace key={gameId} onWinner={handleWinner} />
          )}

          {/* 결과 발표 오버레이 */}
          {gameState === 'FINISHED' && (
            <div className="result-overlay">
              <h2 className="winner-text">🎉 {winner} 승리! 🎉</h2>
              <button className="retry-btn" onClick={startGame}>다시 하기</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;