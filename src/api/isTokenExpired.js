// src/api/isTokenExpired.js
//
// BE luôn trả HTTP 200 (xem guiPhanHoi ở BE), phân biệt thành công/lỗi bằng
// field "code" trong body (code >= 1: thành công, code < 0: lỗi). Vì vậy,
// việc phát hiện "hết hạn token" / "không có quyền" phải dựa vào "code",
// KHÔNG còn dựa vào httpStatus 401/403 như trước (httpStatus giờ luôn 200).
//
// ⚠️ CẦN XÁC NHẬN: 2 danh sách mã dưới đây đang là PLACEHOLDER.
// Thay bằng đúng giá trị "code" thật mà BE trả về cho từng trường hợp.

const MA_HET_HAN_TOKEN = [-401]; // access token hết hạn -> cần refresh token
const MA_KHONG_CO_QUYEN = [-403]; // token invalid / không đủ quyền -> logout

/**
 * true nếu đây là case "access token hết hạn, có thể refresh rồi gọi lại".
 */
export function isTokenExpiredResponse(code) {
  return MA_HET_HAN_TOKEN.includes(code);
}

/**
 * true nếu đây là case cần clear token + redirect về trang login.
 * Vẫn nhận thêm httpStatus để tương thích trường hợp có lỗi HTTP thật
 * (network lỗi hạ tầng trả đúng 401/403 thay vì đi qua guiPhanHoi).
 */
export function isAuthErrorResponse(code, httpStatus) {
  return (
    httpStatus === 401 ||
    httpStatus === 403 ||
    MA_HET_HAN_TOKEN.includes(code) ||
    MA_KHONG_CO_QUYEN.includes(code)
  );
}
