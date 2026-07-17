export async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(blob);
  });
}

export function dataURLToBase64(dataUrl) {
  if (!dataUrl) return "";
  const parts = dataUrl.split(",");
  return parts[1] || "";
}

export async function blobToBase64(blob) {
  const dataUrl = await blobToDataURL(blob); // "data:...;base64,AAA..."
  return dataURLToBase64(dataUrl); // raw base64
}

export function base64ToBlob(base64, mimeType = "audio/webm") {
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mimeType });
}

export function base64ToDataURL(base64, mimeType = "audio/webm") {
  return `data:${mimeType};base64,${base64}`;
}

export function playBase64(
  base64OrDataUrl,
  mimeType = "audio/webm",
  audioElement = null,
) {
  // Accept either raw base64 or a full dataURL
  let rawBase64 = base64OrDataUrl;
  if (base64OrDataUrl && base64OrDataUrl.startsWith("data:")) {
    // extract raw base64
    rawBase64 = dataURLToBase64(base64OrDataUrl);
    // try to infer mimeType
    const m = base64OrDataUrl.match(/^data:([^;]+);/);
    if (m && m[1]) mimeType = m[1];
  }

  const blob = base64ToBlob(rawBase64, mimeType);
  const url = URL.createObjectURL(blob);

  let audio = audioElement;
  if (!audio) {
    audio = new Audio();
    audio.controls = true;
  }
  audio.src = url;
  // try autoplay (may be blocked by browser if no user gesture)
  audio.play().catch(() => {
    // ignore; the caller can call audio.play() on user action
  });

  return { url, audio };
}

export function createAudioElementFromBase64(
  base64OrDataUrl,
  mimeType = "audio/webm",
) {
  const { audio } = playBase64(base64OrDataUrl, mimeType, null);
  return audio;
}
