import React, { useState } from 'react';
import PinballRace from './components/PinballRace';
import './App.css';

function App() {
  const [gameState, setGameState] = useState('IDLE');
  const [gameId, setGameId] = useState(0);
  const [ballConfigs, setBallConfigs] = useState([
    { id: 1, name: '레드 팀', count: 3 },
    { id: 2, name: '블루 팀', count: 2 },
    { id: 3, name: '그린 팀', count: 2 }
  ]);
  const [targetRank, setTargetRank] = useState(1);
  const [finishers, setFinishers] = useState([]);
  const [winner, setWinner] = useState(null);

  // --- 추가된 기능: 순서 랜덤 섞기 ---
  const [shuffleKey, setShuffleKey] = useState(0);

  const shuffleConfigs = () => {
    setShuffleKey(Math.random()); // 랜덤 값을 생성하여 변화를 줌
    setGameState('IDLE');         // 섞을 때는 대기 상태로
    setFinishers([]);             // 기존 순위 초기화
  };

  const startGame = () => {
    if (gameState === 'FINISHED') {
      resetGame();
      setTimeout(() => setGameState('RACING'), 10);
    } else {
      setGameState('RACING');
    }
  };

  const resetGame = () => {
    setFinishers([]);
    setWinner(null);
    setGameState('IDLE');
    setGameId(prev => prev + 1);
  };

  const handleBallFinish = (name) => {
    setFinishers((prev) => {
      const updated = [...prev, name];
      if (updated.length === Number(targetRank)) {
        setWinner(name);
        setGameState('FINISHED');
      }
      return updated;
    });
  };

  const updateConfig = (id, field, value) => {
    setBallConfigs(ballConfigs.map(conf => 
      conf.id === id ? { ...conf, [field]: field === 'count' ? Number(value) : value } : conf
    ));
    setGameId(prev => prev + 1);
  };

  return (
    <div className="app-layout">
      

      <main className="main-content">
        <header><h1>새벽이슬 청년부 핀볼겜</h1></header>
        <div className="game-screen">
          <PinballRace 
            key={gameId} 
            ballConfigs={ballConfigs} 
            shuffleKey={shuffleKey} // 이 값을 추가!
            isPaused={gameState === 'IDLE'} 
            onBallFinish={handleBallFinish}
          />
        </div>
      </main>

      {/* 순위표 사이드바 */}
    <aside className="side-panel leaderboard">
      <h3>📊 실시간 순위</h3>
      <div className="rank-list">
        {finishers.map((name, i) => (
          <div key={i} className={`rank-item ${winner === name && i+1 === Number(targetRank) ? 'is-winner' : ''}`}>
            {i + 1}위: {name}
          </div>
        ))}
      </div>
    </aside>

      <aside className="side-panel settings">
        <h3>⚙️ 설정 및 제어</h3>
        <div className="setting-item">
          <label>우승 등수 설정</label>
          <input type="number" min="1" value={targetRank} onChange={(e) => setTargetRank(e.target.value)} />
        </div>

        <div className="config-header">
          <h4>공 그룹 설정</h4>
          <button className="add-btn" onClick={() => setBallConfigs([...ballConfigs, { id: Date.now(), name: '신규', count: 1 }])}>+</button>
        </div>

        <div className="config-list">
          {ballConfigs.map(conf => (
            <div key={conf.id} className="config-row">
              <input value={conf.name} onChange={e => updateConfig(conf.id, 'name', e.target.value)} />
              <input type="number" value={conf.count} onChange={e => updateConfig(conf.id, 'count', e.target.value)} />
              <button className="del-btn" onClick={() => setBallConfigs(ballConfigs.filter(c => c.id !== conf.id))}>×</button>
            </div>
          ))}
        </div>

        <div className="control-buttons">
          {gameState === 'IDLE' ? (
            <>
              <button className="main-start-btn" onClick={startGame}>경기 시작</button>
              {/* 리셋 버튼 아래에 랜덤 셔플 버튼 추가 */}
              <button className="shuffle-btn" onClick={shuffleConfigs}>공 위치 섞기 🎲</button>
            </>
          ) : (
            <button className="main-reset-btn" onClick={resetGame}>전체 리셋</button>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;