/**
 * audioMessageUtils.js
 *
 * Tiện ích để encode/decode tin nhắn âm thanh trong chat.
 *
 * Format lưu vào DB:
 *   [AUDIO]:data:audio/webm;base64,AAAA...
 *
 * Dùng prefix [AUDIO]: để phân biệt với tin nhắn text thường.
 */

const AUDIO_PREFIX = "[AUDIO]:";

/** Wrap dataURL thành message content để lưu/gửi */
export function encodeAudioMessage(dataUrl) {
  return AUDIO_PREFIX + dataUrl;
}

/** Kiểm tra message content có phải audio không */
export function isAudioMessage(content = "") {
  return typeof content === "string" && content.startsWith(AUDIO_PREFIX);
}

/** Lấy dataURL từ message content */
export function decodeAudioMessage(content = "") {
  if (!isAudioMessage(content)) return null;
  return content.slice(AUDIO_PREFIX.length);
}
