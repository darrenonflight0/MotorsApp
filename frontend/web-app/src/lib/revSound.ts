// A short, synthesized car-engine "rev" used as the notification sound. It's
// generated with the Web Audio API (two detuned sawtooth oscillators swept
// through a low-pass filter), so there's no audio asset to ship and it can't be
// blocked as a cross-origin resource.
//
// Browsers require a user gesture before audio can play, so the AudioContext is
// created lazily and resumed on the first interaction (primeRevSound). A short
// throttle stops a burst of notifications from turning into a chorus.

let ctx: AudioContext | null = null;
let lastPlayed = 0;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Resume the audio context on a real user gesture so later playback is allowed. */
export function primeRevSound() {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

export function setRevMuted(m: boolean) {
  muted = m;
}

/** Play one engine-rev blip. Safe to call from anywhere; no-ops if audio is blocked. */
export function playRev() {
  if (muted) return;
  const now = Date.now();
  if (now - lastPlayed < 1500) return; // throttle bursts
  lastPlayed = now;

  const c = getCtx();
  if (!c) return;

  try {
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = 0.0001;
    master.connect(c.destination);

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(2600, t + 0.16);
    filter.frequency.exponentialRampToValueAtTime(700, t + 0.55);
    filter.Q.value = 6;
    filter.connect(master);

    // Two slightly detuned oscillators give the engine a fuller, grittier tone.
    [0, 7].forEach((detune) => {
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.detune.value = detune;
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.16); // rev up
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.55); // settle down
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 0.6);
    });

    // Amplitude envelope: quick attack, gentle decay.
    master.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
    master.gain.exponentialRampToValueAtTime(0.12, t + 0.22);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  } catch {
    /* audio unavailable — ignore */
  }
}
