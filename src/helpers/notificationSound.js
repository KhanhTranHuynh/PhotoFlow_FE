let audioUnlocked = false;
let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

export const unlockAudio = async () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    audioUnlocked = true;
    console.log("[audio] unlocked ✅, state:", ctx.state);
  } catch (err) {
    console.warn("[audio] unlock failed:", err.message);
  }
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    console.log("[audio] state:", ctx.state, "| unlocked:", audioUnlocked);

    // ✅ Phải unlock trước từ user gesture mới phát được
    if (!audioUnlocked || ctx.state !== "running") {
      console.warn("[audio] not ready, skipping");
      return;
    }

    const playTone = (frequency, startTime, duration = 0.12) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.1);
    playTone(1320, now + 0.12, 0.12);
    console.log("[audio] played ✅");
  } catch (err) {
    console.warn("[audio] play failed:", err);
  }
};
