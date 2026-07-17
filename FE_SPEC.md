# FRONTEND — Công nghệ & Thiết kế ApiRequestManager

## Hệ thống Quản lý & Chọn lọc Ảnh Studio

> Tài liệu này tập trung vào **lựa chọn công nghệ** và **thiết kế `ApiRequestManager`** — chưa đi vào code cụ thể. Mục tiêu: thống nhất kiến trúc trước khi triển khai.

> **📌 Bản đã đối chiếu với `schema.sql` (v3).** 4 điểm được sửa so với bản gốc, đánh dấu inline bên dưới bằng chữ **"Sửa so với bản gốc"**:
>
> 1. Mục 3.4 — mô hình phiên đăng nhập: không phải "1 tài khoản nhiều vai trò" đơn giản, mà là 2 nhánh phiên song song (`tai_khoan_nhan_vien` / `tai_khoan_khach_hang`) qua `user_tokens.loai_dang_nhap`, và `vaiTro` chỉ tồn tại ở nhánh nhân viên.
> 2. Mục 3.5 — quyền tải kèm RAW: schema chưa có cột thể hiện "Studio bật quyền cho khách tải RAW", cần bổ sung schema trước khi FE dựa vào đó để ẩn/hiện nút.
> 3. Mục 4 — danh sách entity/key: `khachHang` và `taiKhoanVaiTro` không khớp tên bảng thật (`tai_khoan_khach_hang`, `tai_khoan_nhan_vien`); bổ sung các entity còn thiếu trong danh sách gốc.
> 4. Mục 4 — mã lỗi quota: `han_muc.loai_han_muc` là generic nhiều loại, không chỉ dung lượng, nên `VUOT_QUOTA_STUDIO` cần trả kèm `loaiHanMuc` cụ thể.

---

## 1. Lựa chọn công nghệ

| Thành phần         | Lựa chọn                                     | Vì sao                                                                                                                                                                                 |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI Framework       | ReactJS (Vite + TypeScript)                  | Nhẹ, khởi động nhanh, phù hợp "đơn giản, triển khai nhanh"                                                                                                                             |
| State management   | Redux Toolkit                                | Chuẩn hóa store, tránh viết boilerplate Redux thuần                                                                                                                                    |
| Gọi API            | **Không dùng RTK Query / SWR / React Query** | Toàn bộ việc gọi API tập trung vào **1 module tự viết: `ApiRequestManager`** — để chủ động kiểm soát song song/tuần tự & callback theo đúng nghiệp vụ Album (có bước phụ thuộc thứ tự) |
| HTTP transport nền | axios                                        | Chỉ được dùng **bên trong** `ApiRequestManager`, không gọi trực tiếp ở nơi khác                                                                                                        |
| Styling            | TailwindCSS                                  | Không cần thiết kế hệ thống UI riêng, đủ cho MVP                                                                                                                                       |
| Routing            | react-router-dom                             | Tách 2 nhánh: khu vực nội bộ studio và portal khách hàng                                                                                                                               |

**Nguyên tắc chốt:** mọi lời gọi API trong ứng dụng — dù ở component, hook, hay Redux thunk — đều phải đi qua `ApiRequestManager`. Đây là ràng buộc kiến trúc, không phải gợi ý.

---

## 2. Vì sao cần `ApiRequestManager` thay vì gọi axios/RTK Query trực tiếp

Nghiệp vụ Album có 2 kiểu tương tác API rất khác nhau:

- **Không phụ thuộc nhau** — vd mở trang chi tiết Album cần tải cùng lúc: thông tin Album, danh sách ảnh, danh sách yêu cầu chỉnh sửa. → nên gọi **song song** để giảm thời gian chờ.
- **Phụ thuộc thứ tự** — vd Thợ chụp ảnh phải **upload xong ảnh gốc rồi mới được gửi duyệt**; Editor phải **nộp ảnh đã chỉnh sửa rồi mới được chuyển trạng thái "chờ khách chốt"**. → phải gọi **tuần tự**, và nếu bước trước lỗi thì dừng, không chạy bước sau.

Nếu để rải rác từng nơi tự quyết định gọi song song/tuần tự bằng `Promise.all` hay `await` thủ công, code sẽ không nhất quán và khó kiểm soát callback (loading, toast lỗi, retry). `ApiRequestManager` giải quyết việc này ở **một chỗ duy nhất**.

---

## 3. Thiết kế `ApiRequestManager`

### 3.1 Vai trò

`ApiRequestManager` là lớp trung gian duy nhất giữa toàn bộ ứng dụng (component / Redux thunk) và tầng HTTP (axios). Nó chịu trách nhiệm:

1. **Nhận vào** một hoặc nhiều "yêu cầu API" đã được mô tả sẵn (method, url, params/data).
2. **Quyết định cách chạy**: đơn lẻ, song song, hay tuần tự.
3. **Điều phối callback**: theo từng request riêng lẻ và theo cả nhóm (batch).
4. **Quản lý vòng đời request**: hủy khi trùng lặp (dedupe), hủy khi component unmount, hủy toàn bộ khi logout.

### 3.2 Hai chế độ gọi

| Chế độ         | Khi nào dùng                                                                 | Hành vi                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute`      | Gọi 1 API đơn lẻ                                                             | Gửi request, trả kết quả, bắn callback tương ứng                                                                                                                                       |
| `executeBatch` | Gọi nhiều API cùng lúc, tự chọn `mode: "parallel"` hoặc `mode: "sequential"` | `parallel`: chạy đồng thời, gom hết kết quả (giống `Promise.all`). `sequential`: chạy lần lượt, mặc định **dừng ngay nếu có bước lỗi** (`stopOnError`), phù hợp các luồng có phụ thuộc |

### 3.3 Cấu trúc 1 "yêu cầu API" (request descriptor)

Mỗi lời gọi được mô tả bằng một object khai báo, không phải hàm gọi trực tiếp:

| Trường                           | Ý nghĩa                                                                    |
| -------------------------------- | -------------------------------------------------------------------------- |
| `key`                            | Định danh duy nhất (vd `album:detail:123`) — dùng để dedupe và hủy request |
| `method`, `url`, `params`/`data` | Thông tin request                                                          |
| `onStart`                        | Bắn khi request bắt đầu (vd: bật loading của riêng phần đó)                |
| `onSuccess`                      | Bắn khi thành công, nhận dữ liệu trả về                                    |
| `onError`                        | Bắn khi lỗi, nhận lỗi đã chuẩn hóa (message, status)                       |
| `onFinally`                      | Luôn bắn sau cùng (vd: tắt loading)                                        |

Với `executeBatch`, ngoài callback từng request còn có thêm **callback cấp batch**: `onBatchStart`, `onBatchSuccess` (nhận mảng kết quả), `onBatchError`, `onBatchFinally` — dùng khi cần xử lý chung cho cả nhóm (vd: 1 spinner cho toàn màn hình thay vì từng phần).

### 3.4 Quản lý vòng đời request

- **Dedupe theo `key`**: nếu gọi lại API cùng `key` khi request trước chưa xong (vd người dùng bấm nút 2 lần) → request cũ tự động bị hủy, chỉ giữ request mới nhất.
- **Hủy theo `key`**: dùng khi component unmount (tránh set state trên component đã unmount) hoặc khi người dùng rời khỏi màn hình giữa chừng.
- **Hủy toàn bộ**: dùng khi logout hoặc khi người dùng **chuyển ngữ cảnh làm việc (vai trò đang active)**, đảm bảo không còn request "mồ côi" chạy ngầm.

> **Ghi chú đồng bộ với schema CSDL (đã sửa lại cho khớp):** Theo `schema.sql`, hệ thống KHÔNG có 1 bảng tài khoản dùng chung — `danh_tinh` chỉ là định danh đăng nhập (SĐT/mật khẩu), còn quyền hạn nằm ở 2 bảng độc lập `tai_khoan_nhan_vien` và `tai_khoan_khach_hang`. Hệ quả cho FE, khác với mô tả gốc:
>
> - **`vaiTro: string[]` CHỈ tồn tại ở phiên nhân viên** (cột `tai_khoan_nhan_vien.vai_tro`) — bên khách hàng không có khái niệm vai trò, nên không thể coi `vaiTro` là thuộc tính chung của "tài khoản" như bản mô tả gốc.
> - Vì `user_tokens.loai_dang_nhap` phân biệt rõ **2 loại phiên hoàn toàn song song** (`nhan_vien` / `khach_hang`, mỗi loại có token riêng), và 1 `danh_tinh` có thể có **nhiều dòng `tai_khoan_nhan_vien` ở nhiều studio khác nhau CÙNG LÚC** (unique theo `danh_tinh_id + id_studio_local`), Redux `auth` cần lưu một **danh sách phiên khả dụng** dạng `{ loaiDangNhap, idStudioLocal, vaiTro? }[]` (lấy từ bước (2)+(3) trong luồng login mô tả đầu `schema.sql`), không chỉ một mảng `vaiTroDuocGan` phẳng.
> - Người dùng chọn **1 phiên đang active** = `(loaiDangNhap, idStudioLocal)` + nếu là nhân viên thì thêm `vaiTro` đang active trong mảng vai trò của dòng đó (vd vừa Thợ chụp vừa Editor tại cùng 1 studio).
> - Hủy toàn bộ request đang chạy khi: đổi vai trò active, **hoặc** đổi `idStudioLocal` active, **hoặc** chuyển qua lại giữa phiên nhân viên ↔ phiên khách hàng — tránh dữ liệu của ngữ cảnh cũ (studio/loại phiên cũ) lẫn vào giao diện mới.

### 3.5 Ví dụ áp dụng vào nghiệp vụ Album (mô tả, không phải code)

- **Mở trang chi tiết Album** → gọi `executeBatch` chế độ `parallel` với 3 request: chi tiết Album, danh sách ảnh, danh sách yêu cầu chỉnh sửa.
- **Thợ chụp ảnh gửi duyệt** → gọi `executeBatch` chế độ `sequential`: upload ảnh gốc xong → mới gọi tiếp API chuyển trạng thái "gửi duyệt"; nếu upload lỗi thì dừng lại, không gọi bước gửi duyệt. Lưu ý: cùng 1 API `gui-duyet` này được dùng lại cho cả lần gửi đầu (từ Nháp) lẫn lần gửi lại sau khi Chủ Studio Từ chối — FE không cần phân biệt 2 màn hình khác nhau.
- **Editor nộp kết quả chỉnh sửa** → tuần tự: upload ảnh đã chỉnh sửa → cập nhật trạng thái yêu cầu chỉnh sửa thành "chờ khách chốt".
- **Khách hàng chọn nhiều ảnh cùng lúc** → song song: mỗi lượt "chọn ảnh" là 1 request độc lập, không phụ thuộc nhau.
- **Tải ảnh hàng loạt** → `execute` đơn với query `format=jpg` (mặc định, chỉ lấy `tep_anh` có `la_draw = false`) hoặc `format=jpg_raw` (kèm cả `tep_anh` có `la_draw = true`, tức file RAW — cột này là `GENERATED ALWAYS` từ `loai_tep`, tầng ứng dụng không tự set tay). **Sửa so với bản gốc:** schema hiện KHÔNG có cột nào ở `studio` hay `album` thể hiện "Studio đã bật quyền cho khách tải RAW" — nút "kèm RAW" tạm thời chỉ nên hiển thị dựa trên vai trò nhân viên (Chủ Studio) đang active; phần "khi Studio đã bật quyền cho khách" cần bổ sung cột quyền tương ứng vào `studio` (hoặc `album`) trước khi FE có thể tự tin ẩn/hiện nút cho khách hàng, nếu không sẽ phải tạm ẩn hẳn nút RAW ở portal khách.
- **Chủ Studio xử lý Album quá hạn phản hồi** → khi danh sách Album trả về `quaHanPhanHoi: true`, hiển thị banner cảnh báo với 2 nút gọi `execute` đơn: "Tiếp tục chờ" (`POST .../tiep-tuc-cho`) hoặc "Hủy Album" (`POST .../huy`); không cần `executeBatch` vì đây là 2 lựa chọn loại trừ nhau, không có bước phụ thuộc.

### 3.6 Tích hợp với Redux Toolkit

`ApiRequestManager` đứng **độc lập với Redux** — nó không biết gì về store. Redux thunk (`createAsyncThunk`) chỉ đóng vai trò gọi vào `ApiRequestManager` rồi đưa kết quả vào state. Nhờ vậy `ApiRequestManager` có thể tái sử dụng ở bất kỳ đâu (kể cả ngoài Redux, ví dụ trong 1 hook cục bộ), và việc test logic gọi API tách biệt hoàn toàn với logic reducer.

---

## 4. Việc cần thống nhất tiếp theo

- **Sửa danh sách `key` cho khớp tên bảng thật trong schema** — bản gốc dùng `khachHang` và `taiKhoanVaiTro`, nhưng schema **không có bảng `khach_hang` riêng** (đã gộp hồ sơ vào `tai_khoan_khach_hang` từ v3) và **không có bảng gán vai trò riêng** (`vai_tro` chỉ là bảng DANH MỤC vai trò hợp lệ; việc gán vai trò là cột mảng `tai_khoan_nhan_vien.vai_tro`). Danh sách entity/key namespace nên là:

  | Key namespace          | Bảng CSDL tương ứng                                                                                  |
  | ---------------------- | ---------------------------------------------------------------------------------------------------- |
  | `auth`                 | `danh_tinh` + `user_tokens`                                                                          |
  | `taiKhoanNhanVien`     | `tai_khoan_nhan_vien` (thay cho `khachHang`/`taiKhoanVaiTro` cũ — đây là nơi thật sự chứa `vai_tro`) |
  | `taiKhoanKhachHang`    | `tai_khoan_khach_hang` (thay cho `khachHang` cũ)                                                     |
  | `danhMucKhachHang`     | `danh_muc_khach_hang`                                                                                |
  | `vaiTro`               | `vai_tro` (danh mục, chủ yếu đọc)                                                                    |
  | `studio`               | `studio`                                                                                             |
  | `hanMuc`               | `han_muc`                                                                                            |
  | `album`                | `album`                                                                                              |
  | `albumPhuTrach`        | `album_phu_trach`                                                                                    |
  | `lichSuTrangThaiAlbum` | `lich_su_trang_thai_album`                                                                           |
  | `baoCaoTienDo`         | `bao_cao_tien_do_cong_viec`                                                                          |
  | `tepAnh`               | `tep_anh`                                                                                            |
  | `yeuCauChinhSua`       | `yeu_cau_chinh_sua`                                                                                  |
  | `phienKhachAlbum`      | `phien_khach_album` (khách vãng lai, không có `danh_tinh`)                                           |
  | `tichHopDrive`         | `tich_hop_google_drive`                                                                              |
  | `lienKetDrive`         | `lien_ket_drive_trao_doi` + `phien_dong_bo_drive`                                                    |
  | `anhDaChonRaw`         | `danh_sach_anh_da_chon_raw`                                                                          |
  | `multipartUploads`     | `multipart_uploads`                                                                                  |
  | `uploadJobs`           | `upload_jobs`                                                                                        |

  Vì 1 nhân viên có thể có nhiều vai trò active khác nhau trên cùng entity (vd `album` nhìn từ góc Thợ chụp ảnh khác góc Editor), và theo ghi chú đã sửa ở mục 3.4, 1 người còn có thể **đồng thời có phiên ở nhiều studio khác nhau**, key nên gồm cả vai trò lẫn studio đang active, vd `album:list:{idStudioLocal}:thoChupAnh` khác `album:list:{idStudioLocal}:editor`, để tránh cache/dedupe nhầm giữa 2 góc nhìn hoặc giữa 2 studio.

- Chuẩn hóa **format lỗi trả về từ BE** (BE cần trả `{ message, code }` nhất quán) để `ApiRequestManager` chuẩn hóa `onError` đúng cho mọi trường hợp. **Sửa so với bản gốc:** vì `han_muc.loai_han_muc` trong schema là **generic, không ràng buộc ENUM** (áp dụng cho nhiều loại hạn mức: dung lượng lưu trữ, số lượng nhân viên, số lượng album, số ảnh upload/tháng...), mã lỗi `VUOT_QUOTA_STUDIO` không nên đứng một mình — BE cần trả kèm `loaiHanMuc` cụ thể (khớp giá trị đang lưu ở `han_muc.loai_han_muc`) trong payload lỗi, để FE hiển thị đúng loại hạn mức đã vượt (dung lượng, số nhân viên, v.v.) thay vì mặc định hiểu nhầm là luôn liên quan dung lượng.
- Quyết định: các API polling (vd `GET /uploads/jobs/:jobId` ứng với bảng `upload_jobs.trang_thai`, hoặc `multipart_uploads.trang_thai` khi ChunkAdapter xử lý ngầm) có nằm trong phạm vi `ApiRequestManager` không, hay cần thêm 1 lớp `PollingManager` riêng — nên bàn trước khi code vì ảnh hưởng thiết kế interface.
