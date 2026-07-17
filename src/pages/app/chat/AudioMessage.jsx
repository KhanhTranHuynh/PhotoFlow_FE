import React, { useRef, useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

/**
 * AudioMessage
 *
 * Render audio player từ dataURL (base64).
 * Props:
 *   dataUrl: string  — "data:audio/webm;base64,..."
 *   isMine: boolean
 */
const AudioMessage = ({ dataUrl, isMine }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    const onError = () => setError(true);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [dataUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setError(true));
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const formatTime = (s) => {
    if (!s || isNaN(s) || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
        <Icon icon="heroicons-outline:volume-off" />
        Không thể phát âm thanh
      </div>
    );
  }

  return (
    <div
      className={[
        "flex items-center gap-3 px-3 py-2 rounded-xl min-w-[200px] max-w-[280px]",
        isMine
          ? "bg-slate-300 dark:bg-slate-900"
          : "bg-slate-100 dark:bg-slate-600",
      ].join(" ")}>
      {/* Hidden native audio */}
      <audio ref={audioRef} src={dataUrl} preload="metadata" />

      {/* Play/Pause button */}
      <button
        type="button"
        onClick={togglePlay}
        className={[
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
          isMine
            ? "bg-slate-700 dark:bg-slate-600 text-white hover:bg-slate-600"
            : "bg-primary-500 text-white hover:bg-primary-600",
        ].join(" ")}>
        <Icon
          icon={playing ? "heroicons-outline:pause" : "heroicons-outline:play"}
          className="text-sm"
        />
      </button>

      {/* Waveform bar + time */}
      <div className="flex-1 min-w-0">
        {/* Seekbar */}
        <div
          className="relative h-1.5 rounded-full cursor-pointer bg-slate-300 dark:bg-slate-700 overflow-hidden mb-1"
          onClick={handleSeek}>
          <div
            className={[
              "absolute left-0 top-0 h-full rounded-full transition-all",
              isMine ? "bg-slate-600 dark:bg-slate-400" : "bg-primary-500",
            ].join(" ")}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Duration */}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
          {playing || currentTime > 0
            ? formatTime(currentTime)
            : formatTime(duration)}
        </span>
      </div>

      {/* Mic icon */}
      <Icon
        icon="heroicons-outline:microphone"
        className="flex-shrink-0 text-sm text-slate-400 dark:text-slate-500"
      />
    </div>
  );
};

export default AudioMessage;
