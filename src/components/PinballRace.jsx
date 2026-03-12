import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

const PinballRace = ({ ballConfigs, isPaused, onBallFinish, shuffleKey }) => {
  // 1. 물리 엔진 핵심 객체들을 useRef로 관리하여 리렌더링 시에도 상태를 유지합니다.
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const runnerRef = useRef(Matter.Runner.create());

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;
    const engine = engineRef.current;

    // 게임의 전반적인 속도감을 조절합니다 (0.5는 2배 느리게)
    engine.timing.timeScale = 0.5;

    // 새로운 게임 시작 시 이전의 물리 객체들을 모두 제거합니다.
    Composite.clear(engine.world, false);

    // 2. 렌더러 설정: 화면 크기, 배경색, 와이어프레임 여부 등
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

    // --- [팩토리 함수] 동일한 설정을 가진 객체 생성을 자동화합니다 ---

    // 일반적인 고정 벽 생성
    const createWall = (x, y, w, h) => 
      Bodies.rectangle(x, y, w, h, { isStatic: true, render: { fillStyle: '#334155' } });
    
    // 기울기를 가진 고정 장애물 생성
    const createStaticRect = (x, y, w, h, angle = 0) => 
      Bodies.rectangle(x, y, w, h, { isStatic: true, angle, render: { fillStyle: '#475569' } });

    // 3번 충돌 시 파괴되는 특수 블록 생성
    const createSpecial = (x, y, w = 60, h = 20) => 
      Bodies.rectangle(x, y, w, h, {
        isStatic: true, 
        label: 'special_block', 
        hitCount: 0, // 충돌 횟수 저장용 커스텀 속성
        render: { fillStyle: '#fbbf24', strokeStyle: '#ffffff', lineWidth: 2 }
      });

    // 움직이는 블록 생성 (좌우/위아래 공용)
    const createMover = (x, y, w, h, type, speed, range, color) => {
      const mover = Bodies.rectangle(x, y, w, h, { isStatic: true, label: type, render: { fillStyle: color } });
      mover.moveSpeed = speed;   // 이동 속도
      mover.moveRange = range;   // 이동 범위
      mover.initialPos = type === 'h_mover' ? x : y; // 기준 위치 저장
      mover.direction = 1;       // 현재 이동 방향 (1 또는 -1)
      return mover;
    };

    // 회전하는 막대 생성 함수
    const createSpinner = (x, y, w, h, speed, color) => {
      const spinner = Bodies.rectangle(x, y, w, h, { 
        isStatic: true, 
        label: 'spinner', 
        render: { fillStyle: color } 
      });
      spinner.rotationSpeed = speed; // 회전 속도 (양수면 시계방향, 음수면 반시계)
      return spinner;
    };

    // --- [데이터 정의] 실제 화면에 배치될 객체들의 리스트입니다 ---

    const walls = [
      // createWall(500, 2000, 1000, 40), // 바닥 (결승선 뒤쪽)
      createWall(0, 600, 20, 2750),    // 왼쪽 외곽 벽
      createWall(1000, 600, 20, 2750)  // 오른쪽 외곽 벽
    ];

    const staticObstacles = [
      // 상단 깔때기(Funnel) 구간 배치
      createStaticRect(120, 650, 200, 20, Math.PI * 0.1),
      createStaticRect(370, 650, 200, 20, -Math.PI * 0.1),
      createStaticRect(630, 650, 200, 20, Math.PI * 0.1),
      createStaticRect(880, 650, 200, 20, -Math.PI * 0.1),
      
      // 하단 지그재그 슬라이드 구간 (반복문을 통한 효율적 생성)
      ...Array.from({ length: 8 }).map((_, i) => {
        const x = i < 4 ? (i % 2 === 0 ? 120 : 330) : (i % 2 === 0 ? 630 : 880);
        const y = 800 + (i % 4 * 100);
        return createStaticRect(x, y, 150, 15, i % 2 === 0 ? 0.2 : -0.2);
      })
    ];

    // 무빙 블록 설정 (랜덤 속도 부여)
    const movingObstacles = [
      createMover(500, 1300, 200, 20, 'h_mover', Math.random() * 5 + 2, 200, '#34d399'),
      createMover(200, 1550, 200, 20, 'v_mover', Math.random() * 5 + 2, 150, '#60a5fa')
    ];

    // 특수 장애물 배치 (좌표 리스트를 기반으로 생성)
    const specialObstacles = [
      ...[380, 460, 540, 620, 700, 780, 860, 940].map(x => createSpecial(x, 1450)),
      ...[200, 400, 600, 800].map(x => createSpecial(x, 1750, 100, 25)),
      ...[100, 300, 500, 700, 900].map(x => createSpecial(x, 1850, 100, 25)),
      ...[100, 300, 500, 700, 900].map(x => createSpecial(x, 1950, 100, 25)),
    ];

    // 회전 장애물 설정
    const spinners = [
      createSpinner(100, 1300, 120, 15, -0.06, '#f472b6'), // 왼쪽 소형 (반시계)
      createSpinner(500, 900, 120, 15, -0.06, '#f472b6'), // 중앙 소형 (반시계)
      createSpinner(850, 1300, 120, 15, 0.06, '#f472b6'),   // 오른쪽 소형 (시계)
      createSpinner(750, 1650, 180, 15, 0.04, '#f472b6') // 중앙 대형 회전판 (시계)
    ];

    // 결승선 센서 (물리적 충돌은 없지만 이벤트만 감지)
    const sensor = Bodies.rectangle(500, 1980, 1000, 10, { 
      isStatic: true, isSensor: true, label: 'finish_line', render: { fillStyle: 'red' } 
    });

    // --- [공 생성 및 셔플] ---
    const colors = ['#ff4757', '#1e90ff', '#2ed573', '#ffa502', '#eccc68', '#a29bfe'];
    let pool = [];
    ballConfigs.forEach((c, i) => {
      for (let j = 0; j < c.count; j++) pool.push({ name: c.name, color: colors[i % colors.length] });
    });
    pool.sort(() => Math.random() - 0.5); // 낱개 단위 셔플

    // 공들을 화면 상단 중앙에 행렬 형태로 배치
    const balls = pool.map((data, i) => {
      const col = i % 25; 
      const row = Math.floor(i / 25);
      const currentRowCount = Math.min(pool.length - row * 25, 25);
      const startX = 500 - ((currentRowCount - 1) * 35 / 2); // 중앙 정렬 계산
      return Bodies.circle(startX + col * 35, 60 + row * 35, 10, {
        restitution: 0.7, // 탄성
        // friction: 0.001,  // 마찰
        stuckFrames: 0,
        label: data.name, 
        render: { fillStyle: data.color }
      });
    });

    // 모든 객체를 월드에 한 번에 추가하여 성능 최적화
    Composite.add(engine.world, [...walls, sensor, ...staticObstacles, ...movingObstacles, ...specialObstacles, ...balls, ...spinners]);

    // --- [이벤트 로직] ---

    // 1. 매 프레임 업데이트 전 실행 (무빙 블록의 움직임 제어)
    const onUpdate = () => {

      // --- 공 멈춤 방지 (Anti-Stuck) 로직 ---
      balls.forEach(ball => {
        // 공의 현재 속도 크기 계산 (피타고라스 정리)
        const speed = Math.sqrt(Math.pow(ball.velocity.x, 2) + Math.pow(ball.velocity.y, 2));

        // 속도가 아주 낮을 때 (0.2 미만)
        if (speed < 0.2) {
          ball.stuckFrames += 1;
        } else {
          ball.stuckFrames = 0; // 움직이고 있다면 카운트 리셋
        }

        // 약 2초(120프레임 기준) 동안 멈춰있다면 점프!
        if (ball.stuckFrames > 120) {
          // 1. 임의의 각도 설정 (예: -45도 ~ -135도 사이 = 위쪽 방향 위주)
          // 0도는 오른쪽, -90도(Math.PI / -2)가 정위쪽입니다.
          const randomAngle = (Math.random() * Math.PI) + Math.PI; // 180도 ~ 360도 (위쪽 반원)
          
          // 2. 힘의 크기 설정
          const forceMagnitude = 0.05; 
          
          // 3. 각도를 기반으로 X, Y 힘의 성분 계산
          const jumpForce = {
            x: Math.cos(randomAngle) * forceMagnitude,
            y: Math.sin(randomAngle) * forceMagnitude
          };
          
          // 4. 힘 적용
          Body.applyForce(ball, ball.position, jumpForce);
          
          // [추가] 회전력도 임의로 주어 더 역동적으로 보이게 함
          Body.setAngularVelocity(ball, (Math.random() - 0.5) * 0.2);
          ball.stuckFrames = 0; // 점프 후 카운트 리셋
          
          // [시각적 피드백] 점프할 때 살짝 반짝이게 할 수도 있습니다.
          ball.render.opacity = 0.5;
          setTimeout(() => { ball.render.opacity = 1; }, 200);
        }
      });

      movingObstacles.forEach(m => {
        const isH = m.label === 'h_mover';
        const currentPos = isH ? m.position.x : m.position.y;
        
        // 이동 범위 끝에 도달하면 방향 전환
        if (currentPos > m.initialPos + m.moveRange) m.direction = -1;
        else if (currentPos < m.initialPos - m.moveRange) m.direction = 1;

        const vel = m.moveSpeed * m.direction;
        if (isH) {
          Body.setPosition(m, { x: m.position.x + vel, y: m.position.y });
          Body.setVelocity(m, { x: vel, y: 0 }); // 속도를 명시해야 충돌이 자연스러움
        } else {
          Body.setPosition(m, { x: m.position.x, y: m.position.y + vel });
          Body.setVelocity(m, { x: 0, y: vel });
        }
      });

      // 회전 블록 업데이트
      spinners.forEach(s => {
        // 현재 각도에 회전 속도를 더함
        const newAngle = s.angle + s.rotationSpeed;
        Matter.Body.setAngle(s, newAngle);
        // 물리적 마찰력을 전달하기 위해 각속도(angularVelocity)도 설정해주는 것이 좋습니다.
        Matter.Body.setAngularVelocity(s, s.rotationSpeed);
      });
    };

    // 2. 충돌 이벤트 발생 시 처리
    const onCollision = (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        // 특수 장애물과 부딪힌 경우
        const isSpecial = bodyA.label === 'special_block' || bodyB.label === 'special_block';
        if (isSpecial) {
          const obs = bodyA.label === 'special_block' ? bodyA : bodyB;
          const ball = bodyA.label === 'special_block' ? bodyB : bodyA;
          
          if (ball.label && !ball.label.includes('Body')) {
            // 입사각 계산하여 공을 강력하게 튕겨냄 (반동 로직)
            const angle = Math.atan2(ball.position.y - obs.position.y, ball.position.x - obs.position.x);
            Body.setVelocity(ball, { x: Math.cos(angle) * 20, y: Math.sin(angle) * 20 });
            
            // 내구도 감소 및 투명도 변화 피드백
            obs.hitCount++;
            obs.render.opacity = 1 - (obs.hitCount * 0.3);
            if (obs.hitCount >= 3) Composite.remove(engine.world, obs); // 3번 충돌 시 제거
          }
        }

        // 결승선 통과 시 처리
        if (bodyA.label === 'finish_line' || bodyB.label === 'finish_line') {
          const ball = bodyA.label === 'finish_line' ? bodyB : bodyA;
          if (ball.label && !ball.label.includes('Body')) {
            ball.collisionFilter.mask = 0; // 한 번 골인하면 다른 물체와 충돌 안 함
            onBallFinish(ball.label);      // 부모 컴포넌트로 데이터 전달
          }
        }
      });
    };

    Events.on(engine, 'beforeUpdate', onUpdate);
    Events.on(engine, 'collisionStart', onCollision);
    
    // 3. 렌더링 직후 공 위에 이름 그리기 (Canvas API 직접 사용)
    Events.on(render, 'afterRender', () => {
      const { context } = render;
      context.font = 'bold 10px Arial';
      context.textAlign = 'center';
      context.fillStyle = 'white';
      
      Composite.allBodies(engine.world).forEach(b => {
        // 이름 표시가 필요한 객체(공)만 필터링
        if (b.label && !['Circle Body', 'Rectangle Body', 'finish_line', 'special_block', 'h_mover', 'v_mover', 'spinner'].includes(b.label)) {
          context.fillText(b.label, b.position.x, b.position.y - 15);
        }
      });
    });

    Render.run(render);

    // 컴포넌트가 사라지거나 재시작될 때 메모리 누수 방지를 위해 모든 리스너와 캔버스를 제거합니다.
    return () => {
      Events.off(engine, 'beforeUpdate', onUpdate);
      Events.off(engine, 'collisionStart', onCollision);
      Render.stop(render);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, [ballConfigs, shuffleKey]); // 설정이나 셔플키가 바뀔 때만 게임 재시작

  // 게임 일시정지/재개 제어
  useEffect(() => {
    isPaused ? Matter.Runner.stop(runnerRef.current) : Matter.Runner.run(runnerRef.current, engineRef.current);
  }, [isPaused]);

  return <div ref={sceneRef} />;
};

export default PinballRace;