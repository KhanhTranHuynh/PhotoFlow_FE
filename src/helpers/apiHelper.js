// Small helper utilities to normalize API responses and wrap calls
export const extractList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.items)) return response.data.items;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.content)) return response.content;
  return [];
};

export const extractSingle = (response) => {
  if (!response) return null;
  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  )
    return response.data;
  if (response.data?.item) return response.data.item;
  if (response.item) return response.item;
  if (typeof response === "object" && !Array.isArray(response)) return response;
  return null;
};

export const extractPaging = (response) => {
  const items = extractList(response);
  const total = Number(
    response?.total ?? response?.data?.total ?? items.length ?? 0,
  );
  const page = Number(response?.page ?? response?.data?.page ?? 1);
  const pagesize = Number(
    response?.pagesize ?? response?.data?.pagesize ?? items.length ?? 0,
  );

  return { items, total, page, pagesize };
};

export const safeValue = (obj, keys, fallback = "--") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
};

// Wrap a promise-returning API call and normalize error/data
export const apiHandler = async (promise) => {
  try {
    const data = await promise;
    return { ok: true, data };
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || "API error";
    return { ok: false, error: err, message };
  }
};

export default {
  extractList,
  extractSingle,
  extractPaging,
  safeValue,
  apiHandler,
};
