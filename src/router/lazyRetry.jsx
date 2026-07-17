import { lazy } from "react";

async function retryImport(importFn, retries = 3, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (err) {
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

export function lazyRetry(importFn) {
  return lazy(async () => {
    const chunkKey = `retry-lazy-refreshed:${importFn.toString().slice(0, 100)}`;
    const hasRefreshed = JSON.parse(
      sessionStorage.getItem(chunkKey) || "false",
    );

    try {
      const module = await retryImport(importFn); // retry 3 lần
      sessionStorage.removeItem(chunkKey);
      return module;
    } catch (error) {
      if (!hasRefreshed) {
        // Lần đầu lỗi → reload (xử lý deploy mới)
        sessionStorage.setItem(chunkKey, "true");
        window.location.reload();
        return new Promise(() => {}); // chặn throw trước khi reload
      }

      // Đã reload vẫn lỗi → trả về trang báo lỗi thay vì throw
      console.error("Chunk load failed after reload:", error);
      return {
        default: () => (
          <div className="h-screen flex flex-col items-center justify-center gap-2">
            <div>Không thể tải trang, vui lòng kiểm tra kết nối mạng</div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded bg-primary-500 text-white">
              Quay lại
            </button>
          </div>
        ),
      };
    }
  });
}
