import { useState, useRef, useCallback } from "react";
import { blobToBase64 } from "@/utils/audioUtils";

const SUPPORTED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getSupportedMimeType() {
  for (const type of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "audio/webm";
}

/**
 * useVoiceRecorder
 *
 * Ghi âm → blob → base64 DataURL, trả về qua onRecorded.
 * Không STT, không gọi API ngoài.
 *
 * Callbacks:
 *   onRecorded(dataUrl: string, mimeType: string)
 *     dataUrl = "data:audio/webm;base64,AAAA..."
 *   onError(err: Error)
 */
export function useVoiceRecorder({ onRecorded, onError } = {}) {
  const [status, setStatus] = useState("idle"); // idle | recording | processing | error
  const [errorMsg, setErrorMsg] = useState(null);
  const [durationMs, setDurationMs] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef("");
  const streamRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const stopStream = useCallback(() => {
    clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    setDurationMs(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopStream();
        setStatus("processing");

        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        chunksRef.current = [];

        try {
          const base64DataUrl = await blobToBase64(blob); // "data:audio/webm;base64,..."
          // blobToBase64 trả raw base64, cần wrap lại thành dataURL đầy đủ
          const dataUrl = base64DataUrl.startsWith("data:")
            ? base64DataUrl
            : `data:${mimeTypeRef.current};base64,${base64DataUrl}`;

          setStatus("idle");
          onRecorded?.(dataUrl, mimeTypeRef.current);
        } catch (err) {
          console.error("blobToBase64 error:", err);
          setStatus("error");
          setErrorMsg("Không thể xử lý âm thanh");
          onError?.(err);
          setTimeout(() => {
            setStatus("idle");
            setErrorMsg(null);
          }, 3000);
        }
      };

      recorder.start(200);
      startTimeRef.current = Date.now();
      setStatus("recording");

      // Đếm thời gian ghi âm
      timerRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current);
      }, 200);
    } catch (err) {
      stopStream();
      setStatus("error");
      const msg =
        err.name === "NotAllowedError"
          ? "Vui lòng cấp quyền micro"
          : "Không thể truy cập micro";
      setErrorMsg(msg);
      onError?.(new Error(msg));
      setTimeout(() => {
        setStatus("idle");
        setErrorMsg(null);
      }, 3000);
    }
  }, [onRecorded, onError, stopStream]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    } else {
      stopStream();
      setStatus("idle");
    }
  }, [stopStream]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    stopStream();
    chunksRef.current = [];
    setStatus("idle");
    setErrorMsg(null);
    setDurationMs(0);
  }, [stopStream]);

  const toggleRecording = useCallback(() => {
    if (status === "recording") stopRecording();
    else if (status === "idle") startRecording();
  }, [status, startRecording, stopRecording]);

  return {
    status, // "idle" | "recording" | "processing" | "error"
    errorMsg,
    durationMs, // thời gian đang ghi (ms)
    isRecording: status === "recording",
    isProcessing: status === "processing",
    startRecording,
    stopRecording,
    cancelRecording,
    toggleRecording,
  };
}
