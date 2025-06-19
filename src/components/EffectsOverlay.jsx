import React, { useEffect, useRef, useState } from "react";
import './EffectsOverlay.css';

const random = (min, max) => Math.random() * (max - min) + min;

function HeartDiv({ id, size, left, color, duration, onEnd }) {
  // Remove heart after animation
  useEffect(() => {
    const timer = setTimeout(() => onEnd(id), duration * 1000);
    return () => clearTimeout(timer);
  }, [id, duration, onEnd]);
  return (
    <div
      className="css-heart"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        background: color,
        animation: `love ${duration}s linear`,
        top: '110%',
        position: 'absolute',
        zIndex: 1001,
      }}
    />
  );
}

function StarryBackground({ count = 80 }) {
  // Animated twinkling stars
  return (
    <div className="starry-bg">
      {Array.from({ length: count }).map((_, i) => {
        const size = random(1, 3);
        const left = random(0, 100);
        const top = random(0, 100);
        const duration = random(1.5, 3.5);
        const delay = random(0, 2);
        return (
          <span
            key={i}
            className="star"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function FireworkExplosionBoxShadow({ id, onEnd, big = false }) {
  const [animating, setAnimating] = useState(true);
  const [boxShadow, setBoxShadow] = useState('');
  const [boxShadow2, setBoxShadow2] = useState('');
  const [style, setStyle] = useState({});
  useEffect(() => {
    // Generate 50-80 particles
    const particles = big ? 80 : 50;
    const width = big ? 700 : 500;
    const height = big ? 700 : 500;
    let boxShadowArr = [];
    let boxShadowArr2 = [];
    for (let i = 0; i < particles; i++) {
      const x = Math.floor(random(0, width)) - width / 2;
      const y = Math.floor(random(0, height)) - height / 1.2;
      const color = `hsl(${Math.floor(random(0, 360))}, 100%, 50%)`;
      boxShadowArr.push(`${x}px ${y}px 0 0 ${color}`);
      boxShadowArr2.push(`0 0 #fff`);
    }
    setBoxShadow(boxShadowArr.join(", "));
    setBoxShadow2(boxShadowArr2.join(", "));
    // Random position for the explosion
    const left = `${random(15, 85)}vw`;
    const top = `${random(10, 60)}vh`;
    setStyle({ left, top });
    // End animation after 1.7s
    const timer = setTimeout(() => { setAnimating(false); onEnd && onEnd(id); }, 1700);
    return () => clearTimeout(timer);
  }, [id, onEnd, big]);
  if (!animating) return null;
  return (
    <div className="pyro" style={{ position: 'absolute', ...style, width: 5, height: 5, zIndex: 1002 }}>
      <div className="before fireworks-boxshadow" style={{ boxShadow: boxShadow2, animationDelay: '0s, 0s, 0s', animationDuration: '1s, 1s, 5s' }} />
      <div className="after fireworks-boxshadow" style={{ boxShadow, animationDelay: '1.25s, 1.25s, 1.25s', animationDuration: '1.7s, 1.7s, 6.25s' }} />
    </div>
  );
}

export default function EffectsOverlay({ effect }) {
  // Modern floating hearts effect
  const [hearts, setHearts] = useState([]);
  const heartId = useRef(0);
  useEffect(() => {
    if (effect !== 'hearts') return;
    setHearts([]);
    let running = true;
    let interval;
    let start = Date.now();
    function addHeart() {
      if (!running) return;
      const id = heartId.current++;
      const size = random(24, 64);
      const left = random(0, 100);
      const r = Math.floor(random(200, 255));
      const g = Math.floor(random(80, 160));
      const b = Math.floor(random(120, 255));
      const color = `rgba(${r},${g},${b},0.9)`;
      const duration = random(2.2, 3.5);
      setHearts(hs => [...hs, { id, size, left, color, duration }]);
    }
    // Add hearts at intervals for 2s
    interval = setInterval(() => {
      if (Date.now() - start > 2000) return;
      for (let i = 0; i < 2; i++) addHeart();
    }, 120);
    // Cleanup after 3.5s
    const cleanup = setTimeout(() => { running = false; setHearts([]); }, 4000);
    return () => { running = false; clearInterval(interval); clearTimeout(cleanup); setHearts([]); };
  }, [effect]);
  const handleHeartEnd = (id) => setHearts(hs => hs.filter(h => h.id !== id));

  // Immersive Fireworks effect
  const [fireworks, setFireworks] = useState([]);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (effect !== 'fireworks') return;
    setShow(true);
    setFireworks([]);
    let running = true;
    let fwId = 0;
    function addFirework(big = false) {
      setFireworks(fws => [...fws, { id: fwId++, big }]);
    }
    // 3-5 big explosions
    addFirework(true);
    setTimeout(() => addFirework(false), random(200, 400));
    setTimeout(() => addFirework(true), random(400, 700));
    setTimeout(() => addFirework(false), random(700, 1100));
    setTimeout(() => addFirework(true), random(1100, 1400));
    // Fade out after 2s
    const fade = setTimeout(() => setShow(false), 2000);
    // Cleanup after 2.3s
    const cleanup = setTimeout(() => { running = false; setFireworks([]); }, 2300);
    return () => { running = false; clearTimeout(cleanup); clearTimeout(fade); setFireworks([]); };
  }, [effect]);
  const handleFireworkEnd = (id) => setFireworks(fws => fws.filter(fw => fw.id !== id));

  if (effect === 'hearts') {
    return (
      <div className="effects-overlay pointer-events-none fixed inset-0 z-50 bg_heart">
        {hearts.map(h => (
          <HeartDiv key={h.id} id={h.id} size={h.size} left={h.left} color={h.color} duration={h.duration} onEnd={handleHeartEnd} />
        ))}
      </div>
    );
  }
  if (effect === 'fireworks' && show) {
    return (
      <div className="immersive-fireworks-overlay pointer-events-none fixed inset-0 z-[9999] animate-immersive-fade">
        <StarryBackground count={90} />
        <div className="fireworks-vignette" />
        <div className="fireworks-center-message">
          <span role="img" aria-label="Celebration" className="text-6xl md:text-8xl block mb-2">🎆</span>
          <span className="text-white text-2xl md:text-4xl font-extrabold drop-shadow-lg">Fireworks!</span>
        </div>
        {fireworks.map(fw => (
          <FireworkExplosionBoxShadow key={fw.id} id={fw.id} onEnd={handleFireworkEnd} big={fw.big} />
        ))}
      </div>
    );
  }
  // TODO: Add other effects (balloons, confetti, pop)
  return null;
} 