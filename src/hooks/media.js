import { useState } from "react";
import { uploadImageMultiDraft, uploadZipDraft } from "@/store/service/media";

export default function useUploadMultiple() {
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState(null);

  const upload = async (files, { imageinfos } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const res = await uploadImageMultiDraft({ files, imageinfos });

      setUrls(res?.data || []);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    upload,
    loading,
    urls,
    error,
  };
}

export function useUploadZip() {
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState(null);

  const upload = async (files) => {
    try {
      setLoading(true);
      setError(null);

      const res = await uploadZipDraft({ files });

      setUrls(res?.data || []);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    upload,
    loading,
    urls,
    error,
  };
}
