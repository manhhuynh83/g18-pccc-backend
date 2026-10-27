
# G1.8 PCCC — Backend Role 4

**Storage, QR Code & Inspection Engine**

Backend thuộc dự án quản lý cơ sở thuộc diện kiểm tra phòng cháy, chữa cháy (PCCC).

## 1. Chức năng chính

- **Storage:** Upload ảnh và PDF lên MinIO, giới hạn 10 MB/file.
- **Equipments:** Thêm, xem, cập nhật và xóa thiết bị PCCC; tự sinh mã QR.
- **GPS Verification:** Kiểm tra vị trí khi quét QR và cảnh báo nếu cách vị trí cơ sở trên 200 m.
- **Inspections:** Quản lý cơ sở, lập lịch kiểm tra, hoàn tất biên bản và cập nhật chu kỳ kiểm tra tiếp theo.
- **Cronjob:** Tự động rà soát lịch kiểm tra quá hạn, tình trạng cơ sở và hạn thiết bị.

## 2. Công nghệ

- Node.js, NestJS, TypeScript
- PostgreSQL/PostGIS
- MinIO
- Docker Compose
- Swagger, TypeORM

## 3. Cài đặt và chạy dự án

### Yêu cầu

- Node.js và npm
- Docker Desktop
- Git

### Bước 1: Clone dự án

```bash
git clone https://github.com/manhhuynh83/g18-pccc-backend.git
cd g18-pccc-backend
```

### Bước 2: Khởi động database và MinIO

```bash
docker compose up -d
docker compose ps
```

Các cổng sử dụng:

| Dịch vụ | Địa chỉ |
|---|---|
| PostgreSQL | `localhost:5432` |
| MinIO API | `localhost:9000` |
| MinIO Console | http://localhost:9001 |

Thông tin đăng nhập dịch vụ xem trong `docker-compose.yml`. Không sử dụng mật khẩu mặc định cho môi trường triển khai thật.

### Bước 3: Cài thư viện

```bash
npm install
```

### Bước 4: Chạy backend

```bash
npm run start:dev
```

### Bước 5: Mở Swagger

http://localhost:3000/api/docs

Swagger dùng để xem và thử các API của backend.

## 4. API chính

Tất cả API sử dụng tiền tố `/api`.

### Storage

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/storage/upload` | Upload ảnh/PDF |

File gửi bằng `multipart/form-data`, với field tên `file`.

### Equipments

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/equipments?facilityId=...` | Danh sách thiết bị |
| GET | `/api/equipments/:qrCode` | Tra cứu bằng mã QR |
| POST | `/api/equipments` | Tạo thiết bị |
| PUT | `/api/equipments/:id` | Cập nhật thiết bị |
| DELETE | `/api/equipments/:id` | Xóa thiết bị |
| POST | `/api/equipments/:qrCode/inspect` | Kiểm tra thiết bị và GPS |

Mã QR có dạng `EQ-YYYY-XXXX`. Trạng thái kiểm tra gồm `GOOD` và `BROKEN`; thiết bị hết hạn có thể được đánh dấu `EXPIRED`.

### Inspections

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/inspections/facilities` | Tạo cơ sở |
| GET | `/api/inspections/facilities` | Danh sách cơ sở |
| POST | `/api/inspections` | Lập lịch kiểm tra |
| GET | `/api/inspections` | Danh sách lịch kiểm tra |
| GET | `/api/inspections/:id` | Chi tiết lịch kiểm tra |
| PATCH | `/api/inspections/:id/complete` | Hoàn tất biên bản |
| POST | `/api/inspections/run-daily-check` | Chạy rà soát hạn thủ công |

Loại kiểm tra gồm `PERIODIC` (định kỳ) và `SUDDEN` (đột xuất).

## 5. Quy tắc nghiệp vụ chính

- Kiểm tra định kỳ phải được lên lịch trước ít nhất 3 ngày làm việc, không tính thứ Bảy và Chủ nhật.
- GPS cảnh báo khi vị trí quét QR cách vị trí cơ sở trên 200 m.
- Sau khi hoàn tất kiểm tra, chu kỳ tiếp theo là 6 tháng với cơ sở `HIGH`, 12 tháng với `MEDIUM` và `LOW`.
- Tác vụ rà soát hạn xử lý lịch quá hạn, cơ sở sắp/quá hạn và thiết bị hết hạn.

## 6. Kiểm thử

```bash
npm run build
npm run test
npm run test:e2e
```

## 7. Tài liệu API

Xem [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) để biết request mẫu và mô tả endpoint.

---

**Dự án:** G1.8 PCCC   
**Phân hệ:** Backend Role 4 — Storage, QR & Inspection Engine
