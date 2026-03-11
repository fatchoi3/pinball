import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

const PinballRace = ({ onWinner }) => {
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;
    const engine = engineRef.current;
    const world = engine.world;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { width: 500, height: 700, wireframes: false, background: '#0f172a' }
    });

    // 1. 외곽 벽 및 바닥 센서
    const leftWall = Bodies.rectangle(0, 350, 20, 700, { isStatic: true });
    const rightWall = Bodies.rectangle(500, 350, 20, 700, { isStatic: true });
    const sensor = Bodies.rectangle(250, 690, 500, 20, { 
      isStatic: true, 
      isSensor: true, // 물리적 충돌은 없지만 감지만 함
      render: { fillStyle: 'transparent' } 
    });

    // 2. 장애물(못) 배치 - 지그재그 격자
    const pegs = [];
    const rows = 8;
    const cols = 9;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * 50 + (r % 2 === 0 ? 50 : 25);
        const y = r * 60 + 150;
        pegs.push(Bodies.circle(x, y, 5, { isStatic: true, restitution: 0.8, render: { fillStyle: '#64748b' } }));
      }
    }

    // 3. 레이싱 공 생성 (3개 예시)
    const colors = ['#f87171', '#60a5fa', '#4ade80'];
    const balls = colors.map((color, i) => {
      return Bodies.circle(230 + i * 20, 50, 10, {
        restitution: 0.5,
        friction: 0.001,
        label: `Ball-${i + 1}`,
        render: { fillStyle: color }
      });
    });

    Composite.add(world, [leftWall, rightWall, sensor, ...pegs, ...balls]);

    // 4. 도착 판정 로직
    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === sensor || pair.bodyB === sensor) {
          const ball = pair.bodyA === sensor ? pair.bodyB : pair.bodyA;
          if (ball.label.startsWith('Ball-')) {
            onWinner(ball.label); // 첫 번째로 닿은 공 알림
          }
        }
      });
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return <div ref={sceneRef} />;
};

export default PinballRace;