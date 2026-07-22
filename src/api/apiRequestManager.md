# ApiRequestManager — Hướng dẫn sử dụng

## 1. Kiến trúc tổng quan

Hệ thống gồm 2 lớp, tách trách nhiệm rõ ràng:

```
Page/Component
      │
      ▼
ApiRequestManager   ← queue, chạy song song/tuần tự, overlay loading toàn app,
                        callback success/error, AbortController
      │
      ▼
http.js (axios instance)  ← baseURL, gắn Authorization/rtoken, tự refresh token
                              khi 401/403, redirect /login khi refresh thất bại
      │
      ▼
   Backend API
```

**Nguyên tắc quan trọng:** mọi API trong toàn app phải gọi qua `ApiRequestManager`,
**không gọi trực tiếp `http.get()/http.post()`** trong component nữa. Lý do:

- `ApiRequestManager` dùng lại chính instance `http` (đã có interceptor auth/refresh)
  làm "động cơ" gọi API bên trong, nên **không mất khả năng tự refresh token**.
- Nếu gọi thẳng `http.js`, bạn sẽ tự quản lý loading/overlay từng nơi, dễ bị đồng
  thời nhiều loading chồng nhau hoặc quên tắt loading khi lỗi.
- `ApiRequestManager` đảm bảo: nhiều API gọi cùng lúc → chỉ 1 overlay toàn app,
  chỉ tắt khi **toàn bộ** đã xong (dùng reference counter).

## 2. Setup 1 lần duy nhất ở `App.jsx`

```jsx
import { useEffect, useState } from "react";
import { ApiRequestManager } from "@/api/apiRequestManager";
import GlobalOverlayLoading from "@/components/GlobalOverlayLoading";

function App() {
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    ApiRequestManager.configure({
      maxConcurrentBatches: 10,
      defaultShowOverlay: true,
      onCallbackError: (error, request) => {
        console.error(
          "[ApiRequestManager callback error]",
          request.apiUrl,
          error,
        );
      },
    });

    const cleanup = ApiRequestManager.setOverlayHandler((visible) => {
      setGlobalLoading(visible);
    });

    return cleanup;
  }, []);

  return (
    <main className="App relative">
      {globalLoading && <GlobalOverlayLoading />}
      {/* ...routes */}
    </main>
  );
}
```

Không cần cấu hình `baseURL`, `timeout`, `withCredentials` ở đây — các giá trị này
đã được `http.js` quản lý (`config.HOST`, `timeout: 60000`).

## 3. Cách gọi API cơ bản

```javascript
const { results, successCount, errorCount } =
  await ApiRequestManager.sendRequests({
    parallel: true, // bắt buộc: true = song song, false = tuần tự
    showOverlay: true, // tùy chọn: bật loading toàn app trong lúc chờ
    apiList: [{ key: "products", apiUrl: "/api/san-pham", method: "GET" }],
  });
```

## 4. Bảng field: `ApiRequestItem` (từng API trong `apiList`)

| Field                                      | Bắt buộc | Ý nghĩa                                                                                                                                                                          |
| ------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`                                      | Không    | Định danh riêng để nhận biết kết quả API này trong `results`. Không truyền thì tự sinh dạng `"GET /api/khach-hang"`.                                                             |
| `apiUrl`                                   | **Có**   | Đường dẫn API, ví dụ `/api/khach-hang`.                                                                                                                                          |
| `method`                                   | Không    | Mặc định `POST`. Có thể `GET`, `PUT`, `DELETE`...                                                                                                                                |
| `data`                                     | Không    | Body request (POST/PUT). Với GET nên dùng `params` thay vì `data`.                                                                                                               |
| `dataFactory`                              | Không    | Hàm trả về `data` **ngay trước khi request chạy**. Dùng khi chạy tuần tự (`parallel: false`) và API sau cần dữ liệu do API trước tạo ra. Ưu tiên hơn `data` nếu khai báo cả hai. |
| `params`                                   | Không    | Query string, ví dụ `{ page: 1, limit: 20 }`.                                                                                                                                    |
| `headers`                                  | Không    | Header riêng cho request này, ghi đè `defaultHeaders` của manager.                                                                                                               |
| `timeout`                                  | Không    | Timeout riêng (ms). Không truyền thì dùng timeout mặc định của `http.js`.                                                                                                        |
| `signal`                                   | Không    | `AbortController().signal` — hủy request khi component unmount giữa chừng.                                                                                                       |
| `showOverlay`                              | Không    | Chỉ có tác dụng khi **batch không bật `showOverlay`**. Bật overlay riêng cho 1 API trong batch.                                                                                  |
| `successCallBack(data, response, request)` | Không    | Chạy khi API này thành công.                                                                                                                                                     |
| `errorCallBack(errorInfo, request)`        | Không    | Chạy khi API này lỗi.                                                                                                                                                            |

## 5. Bảng field: `options` của `sendRequests()`

| Field         | Bắt buộc | Ý nghĩa                                                                                                                                                |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apiList`     | **Có**   | Mảng các `ApiRequestItem`.                                                                                                                             |
| `parallel`    | **Có**   | `true`: các API trong batch chạy **song song**. `false`: chạy **tuần tự** theo đúng thứ tự trong `apiList`.                                            |
| `showOverlay` | Không    | `true`: bật overlay loading toàn app **trước khi** chạy cả batch, tắt **sau khi** toàn bộ batch xong (dù thành công hay lỗi).                          |
| `stopOnError` | Không    | Chỉ áp dụng khi `parallel: false`. `true`: API sau sẽ không chạy nữa khi có 1 API trước lỗi (các API còn lại → `status: "skipped"`). Mặc định `false`. |
| `batchId`     | Không    | Mã batch tự đặt để log/trace, không truyền thì tự sinh.                                                                                                |

## 6. Kết quả trả về — `ApiBatchResult`

```javascript
{
  batchId: "batch-1234567890-1",
  parallel: true,
  successCount: 2,
  errorCount: 0,
  skippedCount: 0,
  results: [
    {
      key: "products",
      apiUrl: "/api/san-pham",
      method: "GET",
      status: "success",   // "success" | "error" | "skipped"
      statusCode: 200,
      data: { ... },        // dữ liệu trả về từ API (khi success)
      error: {               // chỉ có khi status = "error"
        message: "...",
        statusCode: 400,
        code: "ERR_BAD_REQUEST",
        responseData: { ... },
        isCanceled: false,
      },
    },
  ],
}
```

## 7. Khi nào dùng gì — quy tắc quyết định nhanh

| Tình huống                                                              | Dùng                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Nhiều API độc lập, muốn tải nhanh cùng lúc (dashboard, nhiều danh sách) | `parallel: true`                                                   |
| API sau phụ thuộc kết quả API trước (tạo cha → tạo con)                 | `parallel: false` + `dataFactory`                                  |
| Muốn dừng ngay khi 1 bước lỗi trong chuỗi tuần tự                       | `parallel: false` + `stopOnError: true`                            |
| Thao tác quan trọng, cần khóa toàn bộ UI (submit, checkout)             | `showOverlay: true` ở cấp **batch**                                |
| Batch không cần khóa UI chung, nhưng 1 API trong đó cần loading riêng   | `showOverlay: true` ở batch + `showOverlay: true` ở **request** đó |
| Gọi API trong `useEffect`                                               | luôn kèm `signal` từ `AbortController`, `abort()` trong cleanup    |

## 8. File ví dụ đầy đủ

```jsx
// src/pages/main/khach-hang/index.jsx
import React, { useEffect, useState, useRef } from "react";
import { ApiRequestManager } from "@/api/apiRequestManager";

const KhachHangPage = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const abortControllerRef = useRef(null);

  // ============================
  // Ví dụ 1: song song 2 API khi load trang, có overlay toàn màn hình
  // ============================
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const loadData = async () => {
      const { results, errorCount } = await ApiRequestManager.sendRequests({
        parallel: true,
        showOverlay: true,
        apiList: [
          {
            key: "products",
            apiUrl: "/api/san-pham",
            method: "GET",
            params: { page: 1, limit: 50 },
            signal: controller.signal,
            successCallBack: (data) => setProducts(data?.data ?? []),
            errorCallBack: (error) =>
              console.error("Lỗi tải sản phẩm:", error.message),
          },
          {
            key: "customers",
            apiUrl: "/api/khach-hang",
            method: "GET",
            params: { page: 1, limit: 50 },
            signal: controller.signal,
            successCallBack: (data) => setCustomers(data?.data ?? []),
            errorCallBack: (error) =>
              console.error("Lỗi tải khách hàng:", error.message),
          },
        ],
      });

      if (errorCount > 0) {
        console.warn("Có lỗi khi tải dữ liệu ban đầu:", results);
      }
    };

    loadData();

    return () => controller.abort();
  }, []);

  // ============================
  // Ví dụ 2: tuần tự — tạo khách hàng xong mới tạo đơn hàng,
  // dùng dataFactory để lấy id vừa tạo từ API trước
  // ============================
  const handleCreateCustomerWithOrder = async (formData) => {
    setSaving(true);
    let createdCustomerId = null;

    const { errorCount, results } = await ApiRequestManager.sendRequests({
      parallel: false,
      stopOnError: true,
      showOverlay: true,
      apiList: [
        {
          key: "createCustomer",
          apiUrl: "/api/khach-hang",
          method: "POST",
          data: { ten: formData.ten, sdt: formData.sdt },
          successCallBack: (data) => {
            createdCustomerId = data?.data?.id;
          },
          errorCallBack: (error) =>
            console.error("Tạo khách hàng thất bại:", error.message),
        },
        {
          key: "createOrder",
          apiUrl: "/api/don-hang",
          method: "POST",
          dataFactory: () => ({
            khachHangId: createdCustomerId,
            sanPhamIds: formData.sanPhamIds,
          }),
          successCallBack: (data) =>
            console.log("Tạo đơn hàng thành công:", data),
          errorCallBack: (error) =>
            console.error("Tạo đơn hàng thất bại:", error.message),
        },
      ],
    });

    setSaving(false);

    if (errorCount === 0) {
      alert("Tạo khách hàng và đơn hàng thành công!");
    } else {
      alert("Có lỗi xảy ra, vui lòng kiểm tra lại.");
      console.log("Chi tiết:", results);
    }
  };

  // ============================
  // Ví dụ 3: 1 API đơn lẻ, không bật overlay toàn app,
  // chỉ bật overlay riêng cho chính API đó
  // ============================
  const handleDeleteCustomer = async (id) => {
    const { results } = await ApiRequestManager.sendRequests({
      parallel: true,
      showOverlay: true,
      apiList: [
        {
          apiUrl: `/api/khach-hang/${id}`,
          method: "DELETE",
          showOverlay: true,
          successCallBack: () => {
            setCustomers((prev) => prev.filter((c) => c.id !== id));
          },
          errorCallBack: (error) => alert(`Xóa thất bại: ${error.message}`),
        },
      ],
    });

    return results[0]?.status === "success";
  };

  return (
    <div>
      <h1>Khách hàng ({customers.length})</h1>

      <button
        disabled={saving}
        onClick={() =>
          handleCreateCustomerWithOrder({
            ten: "Nguyễn Văn A",
            sdt: "0900000000",
            sanPhamIds: [1, 2],
          })
        }>
        {saving ? "Đang lưu..." : "Tạo khách hàng + đơn hàng"}
      </button>

      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.ten}
            <button onClick={() => handleDeleteCustomer(c.id)}>Xóa</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KhachHangPage;
```

## 9. Lưu ý khi migrate code cũ

- Code cũ gọi trực tiếp `http.get(...)`, `http.post(...)` trong component vẫn
  chạy đúng (vì `http.js` không đổi), nhưng **không có overlay tự động** và
  không nằm trong hàng đợi chung với các batch khác.
- Nên chuyển dần từng trang sang `ApiRequestManager.sendRequests()` thay vì gọi
  thẳng `http`, ưu tiên các trang có nhiều API gọi cùng lúc hoặc có thao tác
  submit/checkout cần khóa UI.
- Không cần sửa gì trong `http.js` — toàn bộ cơ chế token/refresh/401 vẫn giữ
  nguyên vì `ApiRequestManager` dùng lại chính instance đó.
