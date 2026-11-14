// Sons sintetizados (sem arquivos): bomba, explosão, item e derrota.
export function makeSfx() {
  let ctx = null;
  let noise = null;
  let last = 0;
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
  const boom = () => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1800, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + 0.6);
    tone(120, 40, 0.4, 0.35);
  };
  return {
    muted: false,
    unlock() {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.7), ctx.sampleRate);
          const d = noise.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        } catch {
          ctx = null;
        }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    play(type) {
      if (!ctx || this.muted) return;
      if (type === 'place') tone(300, 180, 0.09, 0.14, 'square');
      else if (type === 'explode') {
        const now = performance.now();
        if (now - last > 60) {
          last = now;
          boom();
        }
      } else if (type === 'item') tone(520, 1040, 0.12, 0.14, 'triangle');
      else if (type === 'die') tone(440, 70, 0.5, 0.2, 'sawtooth');
      else if (type === 'wall') tone(90, 50, 0.12, 0.1);
      else if (type === 'win') {
        tone(523, 523, 0.14, 0.15, 'triangle');
        setTimeout(() => ctx && tone(784, 784, 0.3, 0.15, 'triangle'), 140);
      }
    },
  };
}
