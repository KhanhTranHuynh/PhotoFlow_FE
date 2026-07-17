// services/api/upload/upload.base.js
import axios from "axios";
import config from "@/helpers/config";
import logger from "@/helpers/logger";
import { getApiHeaders } from "@/helpers/header-api";
import { setToken_rToken } from "@/helpers/setToken_rToken";

export async function uploadBase({ url, files = [], data = {} }) {
  const fullUrl = `${config.MEDIA_HOST}${url}`;

  const formData = new FormData();

  // append multiple files
  files.forEach((file) => {
    formData.append("files", file);
  });

  // append extra fields
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });

  try {
    logger.info("[uploadBase] Request:", { url, data });

    const response = await axios.post(fullUrl, formData, {
      headers: {
        ...getApiHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });

    logger.info("[uploadBase] Response:", response.data);
    setToken_rToken(response.data);

    return response.data;
  } catch (err) {
    logger.error("[uploadBase] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function getPublicImage({ id }) {
  const url = `${config.MEDIA_HOST}/get/public/${id}`;

  try {
    logger.info("[getPublicImage] Request:", { id });

    const response = await axios.get(url, {
      headers: {
        ...getApiHeaders(),
      },
      responseType: "blob", // quan trọng để nhận file ảnh
    });

    logger.info("[getPublicImage] Success");

    // convert blob -> object url để render <img />
    const imageUrl = URL.createObjectURL(response.data);

    return imageUrl;
  } catch (err) {
    logger.error("[getPublicImage] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function getPublicZip({ id }) {
  const url = `${config.MEDIA_HOST}/get/zip/public/${id}`;

  try {
    logger.info("[getPublicZip] Request:", { id });

    const response = await axios.get(url, {
      headers: {
        ...getApiHeaders(),
      },
      responseType: "blob", // quan trọng để nhận file ảnh
    });

    logger.info("[getPublicZip] Success");

    // convert blob -> object url để render <img />
    const imageUrl = URL.createObjectURL(response.data);

    return imageUrl;
  } catch (err) {
    logger.error("[getPublicZip] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function setImageInfo(data) {
  const url = `${config.MEDIA_HOST}/upload/images/imageinfo`;

  try {
    logger.info("[setImageInfo] Request:", data);

    const response = await axios.post(url, data, {
      headers: {
        ...getApiHeaders(),
      },
    });

    logger.info("[setImageInfo] Success:", response.data);

    return response.data;
  } catch (err) {
    logger.error("[setImageInfo] Error:", err?.response?.data || err);
    throw err;
  }
}
