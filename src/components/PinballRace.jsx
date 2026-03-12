import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const PinballRace = ({ ballConfigs, isPaused, onBallFinish, shuffleKey }) => {
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const runnerRef = useRef(Matter.Runner.create());

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;
    const engine = engineRef.current;

    // [추가] 공의 속도를 전체적으로 반(0.5)으로 줄입니다. (기본값 1)
    engine.timing.timeScale = 0.5;
    
    // 1. 월드 비우기 (중복 생성 방지)
    Composite.clear(engine.world, false);

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { 
        width: 1000, 
        height: 2000, 
        wireframes: false, 
        background: '#1e293b' 
      }
    });

    // 벽 설정 (높이에 맞춰 조정)
    const ground = Bodies.rectangle(500, 2000, 1000, 40, { isStatic: true, render: { fillStyle: '#334155' } });
    const leftWall = Bodies.rectangle(0, 600, 20, 2750, { isStatic: true, render: { fillStyle: '#334155' } });
    const rightWall = Bodies.rectangle(1000, 600, 20, 2750, { isStatic: true, render: { fillStyle: '#334155' } });
    const sensor = Bodies.rectangle(500, 1980, 1000, 10, { 
      isStatic: true, 
      isSensor: true, 
      label: 'finish_line', // 라벨 부여
      render: { fillStyle: 'red' } 
    });
    // const sensor = Bodies.rectangle(225, 1180, 450, 10, { isStatic: true, isSensor: true, render: { fillStyle: 'transparent' } });
    
    // 2. 다양한 장애물 배치 (다양한 레이아웃)
    const obstacles = [];
    
    // 섹션 1: 기본 핀볼 구역 (상단)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 19; c++) {
        obstacles.push(Bodies.circle(c * 50 + (r % 2 === 0 ? 25 : 50), r * 60 + 250, 6, { isStatic: true, render: { fillStyle: '#94a3b8' } }));
      }
    }

    // 섹션 2: 중앙 깔때기 구간
    obstacles.push(Bodies.rectangle(120, 650, 200, 20, { isStatic: true, angle: Math.PI * 0.1, render: { fillStyle: '#475569' } }));
    obstacles.push(Bodies.rectangle(370, 650, 200, 20, { isStatic: true, angle: -Math.PI * 0.1, render: { fillStyle: '#475569' } }));
    obstacles.push(Bodies.rectangle(630, 650, 200, 20, { isStatic: true, angle: Math.PI * 0.1, render: { fillStyle: '#475569' } }));
    obstacles.push(Bodies.rectangle(880, 650, 200, 20, { isStatic: true, angle: -Math.PI * 0.1, render: { fillStyle: '#475569' } }));

    // 섹션 3: 지그재그 슬라이드 구간 (하단)
    for (let i = 0; i < 8; i++) {
      let xPos, yPos;
      if(i < 4){
        xPos = i % 2 === 0 ? 120 : 330;
        yPos = 800 + (i * 100);
      } else{
        xPos = i % 2 === 0 ? 630 : 880;
        yPos = 800 + ((i - 4) * 100);
      }
      obstacles.push(Bodies.rectangle(xPos, yPos, 150, 15, { isStatic: true, angle: i % 2 === 0 ? 0.2 : -0.2, render: { fillStyle: '#64748b' } }));
    }

    // 공 생성 (낱개 랜덤 셔플 로직 유지)
    const colors = ['#ff4757', '#1e90ff', '#2ed573', '#ffa502', '#eccc68', '#a29bfe'];
    let allBallsPool = [];
    ballConfigs.forEach((conf, idx) => {
      for (let i = 0; i < conf.count; i++) {
        allBallsPool.push({ name: conf.name, color: colors[idx % colors.length] });
      }
    });
    // Fisher-Yates Shuffle
    for (let i = allBallsPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allBallsPool[i], allBallsPool[j]] = [allBallsPool[j], allBallsPool[i]];
    }

    // 가로 배치
    const balls = allBallsPool.map((ballData, i) => {
      const ballsPerRow = 25; // 한 줄에 배치할 공의 개수
      const ballGap = 35;     // 공 사이의 가로/세로 간격
      
      const col = i % ballsPerRow;        // 현재 줄에서 몇 번째인지
      const row = Math.floor(i / ballsPerRow); // 몇 번째 줄인지
    
      // 1. 현재 줄의 전체 폭 계산
      // (현재 줄에 공이 몇 개 있는지 확인하여 정중앙을 맞춥니다)
      const currentRowCount = Math.min(allBallsPool.length - row * ballsPerRow, ballsPerRow);
      const rowWidth = (currentRowCount - 1) * ballGap;
      
      // 2. 시작 X 좌표 계산 (중앙인 500에서 줄 폭의 절반만큼 왼쪽으로)
      const startX = 500 - (rowWidth / 2);
    
      return Bodies.circle(
        startX + (col * ballGap), // X 위치: 시작점 + (열 인덱스 * 간격)
        60 + (row * ballGap),    // Y 위치: 상단 여백 100 + (행 인덱스 * 간격)
        10, 
        {
          restitution: 0.7,
          friction: 0.001,
          label: ballData.name,
          render: { fillStyle: ballData.color }
        }
      );
    });

    // --- 특수 장애물 (3번 부딪히면 사라짐) 생성 ---
    const specialObstacles = [];
    const createSpecialObstacle = (x, y, width = 60, height = 20) => {
      const obstacle = Bodies.rectangle(x, y, width, height, {
        isStatic: true,
        label: 'special_block',
        hitCount: 0,
        render: {
          fillStyle: '#fbbf24', // 노란색(황금색) 유지
          strokeStyle: '#ffffff',
          lineWidth: 2
        }
      });
      return obstacle;
    };

    // 위치에 맞게 가로형 직사각형 배치
    specialObstacles.push(createSpecialObstacle(60, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(140, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(220, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(300, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(380, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(460, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(540, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(620, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(700, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(780, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(860, 1450, 60, 20));
    specialObstacles.push(createSpecialObstacle(940, 1450, 60, 20));

    specialObstacles.push(createSpecialObstacle(125, 1850, 100, 25));
    specialObstacles.push(createSpecialObstacle(325, 1850, 100, 25));
    specialObstacles.push(createSpecialObstacle(525, 1850, 100, 25));
    specialObstacles.push(createSpecialObstacle(725, 1850, 100, 25));
    specialObstacles.push(createSpecialObstacle(925, 1850, 100, 25));

    Composite.add(engine.world, [ground, leftWall, rightWall, sensor, ...obstacles, ...balls, ...specialObstacles]);

    // 충돌 감지
    const collisionHandler = (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // 특수 장애물 충돌 체크
        const isSpecial = bodyA.label === 'special_block' || bodyB.label === 'special_block';
        if (isSpecial) {
          const obstacle = bodyA.label === 'special_block' ? bodyA : bodyB;
          const ball = bodyA.label === 'special_block' ? bodyB : bodyA;

          if (ball.label && !ball.label.includes('Body')) {
            // 1. 공을 멀리 날려보내기 (반동 효과)
            const forceMagnitude = 20; 
            // 튕겨나가는 속도 크기 (숫자가 클수록 더 멀리 날아갑니다. 15~25 사이 추천)
            const speed = 20;
            const angle = Math.atan2(ball.position.y - obstacle.position.y, ball.position.x - obstacle.position.x);
            // 속도 직접 부여
            Body.setVelocity(ball, {
              x: Math.cos(angle) * speed,
              y: Math.sin(angle) * speed
            });
            // Body.applyForce(ball, ball.position, {
            //   x: Math.cos(angle) * forceMagnitude,
            //   y: Math.sin(angle) * forceMagnitude
            // });

            // [추가] 회전력까지 주면 더 역동적입니다.
            Body.setAngularVelocity(ball, (Math.random() - 0.5) * 0.5);
            // 2. 충돌 횟수 증가 및 파괴
            obstacle.hitCount += 1;
            
            // 시각적 피드백 (부딪힐 때마다 투명도 변경)
            obstacle.render.opacity = 1 - (obstacle.hitCount * 0.3);

            if (obstacle.hitCount >= 3) {
              Composite.remove(engine.world, obstacle);
            }
          }
        }

        // 한쪽이 센서(finish_line)인 경우
        if (bodyA.label === 'finish_line' || bodyB.label === 'finish_line') {
          const ball = bodyA.label === 'finish_line' ? bodyB : bodyA;
          
          // 공인 경우에만 처리
          if (ball.label && !ball.label.includes('Body')) {
            ball.collisionFilter.mask = 0; // 중복 카운트 방지 위해 충돌 무시
            onBallFinish(ball.label);

            // [추가] 공이 골인하면 자동으로 화면을 결승점 쪽으로 스크롤
            // sceneRef.current.parentElement.scrollTo({
            //   top: 1300,
            //   behavior: 'smooth'
            // });
          }
        }
      });
    };
    // 충돌 센서
    Events.on(engine, 'collisionStart', collisionHandler);

    Events.on(render, 'afterRender', () => {
      const context = render.context;
      context.font = 'bold 10px Arial';
      context.textAlign = 'center';
      context.fillStyle = 'white';

      // 월드의 모든 바디 중 공(Circle)인 것만 찾아 텍스트를 입힙니다.
      const allBodies = Composite.allBodies(engine.world);
      allBodies.forEach(body => {
        if (body.label && body.label !== 'Circle Body' && body.label !== 'Rectangle Body' && body.label !==  'finish_line' && body.label !== 'special_block') {
          context.fillText(body.label, body.position.x, body.position.y - 15); // 공 살짝 위에 이름 표시
        }
      });
    });
    Render.run(render);

    return () => {
      Events.off(engine, 'collisionStart', collisionHandler);
      Render.stop(render);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, [ballConfigs, shuffleKey]);

  useEffect(() => {
    if (isPaused) {
      Matter.Runner.stop(runnerRef.current);
    } else {
      Matter.Runner.run(runnerRef.current, engineRef.current);
    }
  }, [isPaused]);

  return <div ref={sceneRef} />;
};

export default PinballRace;