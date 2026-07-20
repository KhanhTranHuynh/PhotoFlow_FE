import logger from "@/helpers/logger";
import http from "@/api/http";

export async function login({ so_dien_thoai, mat_khau }) {
  const body = {
    so_dien_thoai: so_dien_thoai.trim(),
    mat_khau: mat_khau.trim(),
  };

  try {
    logger.info("[login] Request body:", body);
    const response = await http.post("/public/xac-thuc/dang-nhap", body);
    logger.info("[login] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[login] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function logout() {
  try {
    const response = await http.post("/public/xac-thuc/dang-xuat", {});
    logger.info("[logout] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[logout] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function getProfile() {
  try {
    const response = await http.post("/xac-thuc/profile/me", {});
    logger.info("[getProfile] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[getProfile] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function dangKyStudio(body) {
  try {
    logger.info("[dangKyStudio] Request body:", body);
    const response = await http.post("/public/xac-thuc/dang-ky-studio", body);
    logger.info("[dangKyStudio] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[dangKyStudio] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function quenMatKhauGuiEmail(body) {
  try {
    logger.info("[quenMatKhauGuiEmail] Request body:", body);
    const response = await http.post("/public/quen-mat-khau/gui-otp", body);
    logger.info("[quenMatKhauGuiEmail] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[quenMatKhauGuiEmail] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function OTPMatKhau(body) {
  try {
    logger.info("[OTPMatKhau] Request body:", body);
    const response = await http.post(
      "/public/quen-mat-khau/xac-nhan-otp",
      body,
    );
    logger.info("[OTPMatKhau] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[OTPMatKhau] Error:", err?.response?.data || err);
    throw err;
  }
}
