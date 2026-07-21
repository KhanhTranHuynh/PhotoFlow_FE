// src/api/isTokenExpired.js
// ⚠️ PLACEHOLDER — cần bạn xác nhận mã code thật của BE
const MA_HET_HAN_TOKEN = [-401];
const MA_KHONG_CO_QUYEN = [-403];

export function isTokenExpiredResponse(code) {
  return MA_HET_HAN_TOKEN.includes(code);
}

export function isAuthErrorResponse(code, httpStatus) {
  return (
    httpStatus === 401 ||
    httpStatus === 403 ||
    MA_HET_HAN_TOKEN.includes(code) ||
    MA_KHONG_CO_QUYEN.includes(code)
  );
}
