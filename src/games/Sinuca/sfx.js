// Sons sintetizados (sem arquivos): batida de bola, tabela e caçapa.
export function makeSfx() {
  let ctx = null;
  const last = { ball: 0, rail: 0, pocket: 0 };
  const tone = (freq, endFreq, dur, gain, type = 'sine') => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  };
  return {
    unlock() {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
          ctx = null;
        }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    play(type, intensity = 1) {
      if (!ctx) return;
      const now = performance.now();
      if (now - last[type] < 45) return;
      last[type] = now;
      const k = Math.min(1, intensity / 1400);
      if (type === 'ball') tone(1700 + Math.random() * 500, 700, 0.07, 0.04 + 0.22 * k, 'triangle');
      else if (type === 'rail') tone(210, 90, 0.09, 0.03 + 0.16 * k);
      else if (type === 'pocket') tone(340, 90, 0.28, 0.2);
    },
  };
}
