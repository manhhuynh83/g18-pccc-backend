
# G1.8 PCCC — Backend Role 4
## Storage, QR Code & Inspection Engine

Hệ thống quản lý an toàn phòng cháy, chữa cháy (PCCC) — Backend Role 4, thuộc đề tài G1.8 của nhóm G18.

Phân hệ phụ trách lưu trữ tệp tin, quản lý thiết bị PCCC bằng mã QR, kiểm tra vị trí GPS và quản lý lịch kiểm tra, biên bản cùng chu kỳ kiểm tra định kỳ.

---

## 1. Giới thiệu

Backend Role 4 đảm nhiệm các chức năng chính:

- **Docker Compose:** Khởi chạy PostgreSQL/PostGIS và MinIO trên môi trường cục bộ.
- **Storage:** Upload ảnh hiện trường và file PDF biên bản lên MinIO Object Storage.
- **Equipments:** Quản lý thiết bị PCCC, sinh mã QR, tra cứu thiết bị và cập nhật thông tin.
- **GPS Verification:** Tính khoảng cách giữa vị trí quét QR và vị trí cơ sở bằng công thức Haversine, cảnh báo khi khoảng cách vượt quá 200 m.
- **Inspections:** Lập lịch kiểm tra, hoàn tất biên bản và tự động tính ngày kiểm tra tiếp theo.
- **Cronjob:** Tự động kiểm tra hạn kiểm tra, trạng thái cơ sở và hạn bảo dưỡng thiết bị.

## 2. Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| Node.js | Môi trường chạy backend |
| NestJS | Framework xây dựng REST API |
| TypeScript | Ngôn ngữ lập trình |
| PostgreSQL/PostGIS | Lưu trữ dữ liệu và hỗ trợ dữ liệu địa lý |
| MinIO | Lưu trữ ảnh và tài liệu |
| Docker Compose | Quản lý các dịch vụ cục bộ |
| Swagger | Tài liệu và kiểm thử API |
| Cronjob | Tự động thực hiện tác vụ theo lịch |

> Lưu ý: Công nghệ ORM và cấu hình database cần thống nhất với mã nguồn thực tế của dự án.

## 3. Yêu cầu môi trường

Cài đặt các công cụ sau trước khi chạy dự án:

- Node.js và npm.
- Docker Desktop hoặc Docker Engine có hỗ trợ Docker Compose.
- Git.
- Một công cụ gọi API như Swagger UI hoặc Postman.

## 4. Cài đặt và khởi chạy

### Bước 1: Khởi động Docker

Mở terminal tại thư mục `backend-api`:

```bash
docker compose config
docker compose up -d
docker compose ps
```

Docker Compose sử dụng file `docker-compose.yml` để khởi chạy PostgreSQL/PostGIS và MinIO.

Các cổng dự kiến:

| Dịch vụ | Cổng |
|---|---:|
| PostgreSQL/PostGIS | 5432 |
| MinIO API | 9000 |
| MinIO Console | 9001 |

Mở MinIO Console tại:

http://localhost:9001

Kiểm tra cấu hình đăng nhập trong file môi trường của dự án. Bucket dùng để lưu tệp tin là `pccc-files`.

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình biến môi trường

Tạo hoặc cập nhật file `.env` theo cấu hình dự án.

Các biến liên quan đến MinIO:

```dotenv
MINIO_ENDPOINT=http://localhost:9000
MINIO_USER=your_minio_username
MINIO_PASSWORD=your_minio_password
MINIO_BUCKET=pccc-files
```

Thay các giá trị mẫu bằng cấu hình thực tế trên máy của bạn. Nếu dự án cần các biến khác như `DATABASE_URL`, hãy cấu hình theo file mẫu và cấu hình database hiện có.

**Không commit file `.env` chứa mật khẩu hoặc thông tin bí mật lên Git.**

### Bước 4: Chạy backend

Chạy chế độ development:

```bash
npm run start:dev
```

Hoặc chạy chế độ thông thường:

```bash
npm run start
```

### Bước 5: Mở Swagger

Khi backend đã khởi động thành công, truy cập:

http://localhost:3000/api/docs

Swagger được sử dụng để xem các endpoint và gửi yêu cầu kiểm thử API.

## 5. API Documentation

Các endpoint dưới đây sử dụng tiền tố `/api` theo cấu hình dự kiến của dự án.

Response chuẩn:

```json
{
  "success": true,
  "message": "Thành công",
  "data": {}
}
```

Các trường dữ liệu thực tế phụ thuộc vào từng endpoint.

### 5.1. Storage — Upload file

#### Upload ảnh hoặc PDF

| Thuộc tính | Giá trị |
|---|---|
| Method | `POST` |
| Endpoint | `/api/storage/upload` |
| Content-Type | `multipart/form-data` |
| Field | `file` |

Định dạng file được phép:

- JPG/JPEG
- PNG
- WEBP
- PDF

Dung lượng tối đa: **10 MB/file**.

Ví dụ response:

```json
{
  "success": true,
  "message": "Upload file thành công",
  "data": {
    "url": "http://localhost:9000/pccc-files/example.jpg",
    "fileName": "example.jpg",
    "size": 123456,
    "contentType": "image/jpeg"
  }
}
```

URL trên chỉ là ví dụ minh họa. URL thực tế do backend trả về.

File upload được lưu trên MinIO. URL có thể được sử dụng khi lưu hồ sơ hoặc biên bản kiểm tra.

### 5.2. Equipments — Quản lý thiết bị PCCC

#### Danh sách endpoint

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/equipments?facilityId=...` | Lấy danh sách thiết bị theo cơ sở |
| `GET` | `/api/equipments/:qrCode` | Tra cứu thiết bị theo mã QR |
| `POST` | `/api/equipments` | Tạo thiết bị mới |
| `PUT` | `/api/equipments/:id` | Cập nhật thiết bị |
| `DELETE` | `/api/equipments/:id` | Xóa thiết bị |
| `POST` | `/api/equipments/:qrCode/inspect` | Ghi nhận kiểm tra thiết bị và GPS |

#### Tạo thiết bị

`POST /api/equipments`

Ví dụ request:

```json
{
  "name": "Bình bột ABC",
  "facilityId": "FAC-001",
  "facilityLat": 10.8523,
  "facilityLng": 106.6289
}
```

Hệ thống dự kiến sinh mã QR duy nhất theo định dạng:

`EQ-YYYY-XXXX`

Ví dụ: `EQ-2026-0001`.

#### Kiểm tra thiết bị và GPS

`POST /api/equipments/:qrCode/inspect`

Ví dụ request:

```json
{
  "status": "GOOD",
  "lat": 10.8524,
  "lng": 106.6290
}
```

Trong đó:

- `status`: trạng thái kiểm tra, `GOOD` hoặc `BROKEN`.
- `lat`: vĩ độ tại vị trí quét.
- `lng`: kinh độ tại vị trí quét.

Kết quả kiểm tra GPS dự kiến bao gồm:

- `distanceDiffMeter`: Khoảng cách giữa vị trí quét và vị trí cơ sở, tính bằng mét.
- `isGpsWarning`: `true` nếu khoảng cách vượt quá 200 m.

Nếu thiết bị không tồn tại, API cần trả lỗi `404`. Tọa độ ngoài phạm vi hợp lệ cần bị từ chối.

Cảnh báo GPS chỉ là tín hiệu để cán bộ kiểm tra xem xét, không tự động kết luận có gian lận.

### 5.3. Inspections — Lịch kiểm tra và biên bản

#### Danh sách endpoint

| Method | Endpoint | Chức năng |
|---|---|---|
| `POST` | `/api/inspections/facilities` | Tạo cơ sở |
| `GET` | `/api/inspections/facilities` | Lấy danh sách cơ sở |
| `POST` | `/api/inspections` | Lập lịch kiểm tra |
| `GET` | `/api/inspections` | Lấy danh sách lịch kiểm tra |
| `GET` | `/api/inspections/:id` | Xem chi tiết lần kiểm tra |
| `PATCH` | `/api/inspections/:id/complete` | Hoàn tất kiểm tra và lập biên bản |
| `POST` | `/api/inspections/run-daily-check` | Chạy tác vụ kiểm tra hằng ngày theo yêu cầu demo |

Các endpoint trong bảng là danh sách API theo thiết kế. Cần xác nhận endpoint đã được triển khai và đăng ký trong Swagger trước khi tích hợp frontend.

#### Tạo cơ sở

`POST /api/inspections/facilities`

Ví dụ request:

```json
{
  "name": "Nhà máy A",
  "riskLevel": "HIGH",
  "latitude": 10.8523,
  "longitude": 106.6289
}
```

`riskLevel` nhận một trong các giá trị:

- `HIGH`
- `MEDIUM`
- `LOW`

#### Lập lịch kiểm tra

`POST /api/inspections`

Ví dụ request:

```json
{
  "facilityId": "UUID",
  "inspectorId": "INSP-001",
  "inspectionType": "PERIODIC",
  "scheduledDate": "2026-11-05"
}
```

Trong đó:

- `inspectionType`: `PERIODIC` hoặc `SUDDEN`.
- Lịch `PERIODIC` phải được lên trước ít nhất 3 ngày làm việc.
- Khi tính ngày làm việc, quy ước hiện tại bỏ qua thứ Bảy và Chủ nhật, chưa tính ngày lễ.

#### Lấy danh sách lịch kiểm tra

`GET /api/inspections`

Các tham số lọc dự kiến:

- `facilityId`
- `status`
- `startDate`
- `endDate`

Ví dụ:

`GET /api/inspections?facilityId=UUID&status=SCHEDULED&startDate=2026-11-01&endDate=2026-11-30`

#### Hoàn tất biên bản

`PATCH /api/inspections/:id/complete`

Ví dụ request:

```json
{
  "conclusion": "PASSED",
  "reportFileUrl": "URL_PDF",
  "checkInLat": 10.8523,
  "checkInLng": 106.6289
}
```

Trong đó:

- `conclusion`: `PASSED` hoặc `FAILED`.
- `reportFileUrl`: URL PDF đã được upload qua Storage.
- `checkInLat`, `checkInLng`: Tọa độ check-in tại cơ sở.

Khi hoàn tất kiểm tra, hệ thống cần cập nhật kết quả kiểm tra và ngày kiểm tra kế tiếp theo quy tắc nghiệp vụ.

## 6. Quy tắc nghiệp vụ

### 6.1. Chu kỳ kiểm tra

| Mức độ rủi ro | Chu kỳ kiểm tra kế tiếp |
|---|---|
| `HIGH` | Ngày kiểm tra thực tế + 6 tháng |
| `MEDIUM` | Ngày kiểm tra thực tế + 12 tháng |
| `LOW` | Ngày kiểm tra thực tế + 12 tháng |

Ngày kiểm tra tiếp theo được tính dựa trên ngày kiểm tra thực tế khi hoàn tất biên bản.

### 6.2. Trạng thái an toàn của cơ sở

| Trạng thái | Điều kiện nghiệp vụ |
|---|---|
| `SAFE` | Còn hạn trên 15 ngày và không có vi phạm chưa khắc phục |
| `WARNING` | Còn từ 15 ngày trở xuống đến hạn, hoặc có vi phạm `MINOR` chưa khắc phục |
| `VIOLATION` | Quá hạn, có vi phạm `MAJOR`/`CRITICAL` chưa khắc phục, hoặc quá hạn khắc phục mà chưa xử lý |

### 6.3. Cronjob

Tác vụ định kỳ dự kiến chạy lúc 00:00 mỗi ngày theo múi giờ `Asia/Ho_Chi_Minh`.

Các công việc:

1. Chuyển lịch `SCHEDULED` đã qua ngày mà chưa hoàn tất sang `OVERDUE`.
2. Chuyển cơ sở đã quá hạn kiểm tra sang `VIOLATION`.
3. Chuyển cơ sở `SAFE` sang `WARNING` khi còn từ 15 ngày trở xuống đến hạn.
4. Chuyển thiết bị đã quá hạn bảo dưỡng sang `EXPIRED`.
5. Gửi thông báo khi cơ sở chuyển trạng thái theo quy ước của nhóm, tránh gửi lặp lại mỗi ngày.

Trạng thái và hành vi thực tế cần được xác minh bằng kiểm thử backend.

## 7. Kiểm thử

### Build dự án

```bash
npm run build
```

### Unit tests

```bash
npm run test
```

### End-to-end tests

```bash
npm run test:e2e
```

### Test coverage

```bash
npm run test:cov
```

### Định dạng code

```bash
npm run format
```

### Các tình huống cần kiểm thử

- Docker Compose khởi chạy được PostgreSQL/PostGIS và MinIO.
- Upload ảnh hợp lệ thành công.
- Upload file không được hỗ trợ hoặc file lớn hơn 10 MB bị từ chối.
- Quét QR trong phạm vi 200 m không bật cảnh báo GPS.
- Quét QR cách cơ sở khoảng 4,5 km bật cảnh báo GPS.
- QR không tồn tại trả về `404`.
- Hai thiết bị tạo liên tiếp có mã QR khác nhau.
- Cơ sở `HIGH` được cộng 6 tháng sau khi hoàn tất kiểm tra.
- Cơ sở `MEDIUM` và `LOW` được cộng 12 tháng.
- Cơ sở sắp đến hạn chuyển sang `WARNING`.
- Cơ sở quá hạn chuyển sang `VIOLATION`.
- Lịch chưa hoàn tất quá ngày được chuyển sang `OVERDUE`.
- Thiết bị quá hạn được chuyển sang `EXPIRED`.
- Cronjob không gửi thông báo lặp lại khi trạng thái không thay đổi.

## 8. Cấu trúc module

Cấu trúc khái quát theo phạm vi Role 4:

```text
backend-api/
├── docker-compose.yml
├── src/
│   ├── modules/
│   │   ├── storage/
│   │   ├── equipments/
│   │   └── inspections/
│   └── ...
├── .env
├── .gitignore
├── package.json
└── README.md
```

Đây là sơ đồ khái quát. Cấu trúc thư mục thực tế có thể khác tùy phiên bản mã nguồn.

## 9. Tích hợp frontend

Frontend có thể sử dụng Swagger để xem cấu trúc request/response trước khi tích hợp.

- Upload ảnh/PDF qua Storage và sử dụng URL trả về khi lưu biên bản.
- Sử dụng mã QR để tra cứu thiết bị.
- Gửi tọa độ GPS khi thực hiện kiểm tra.
- Hiển thị cảnh báo khi `isGpsWarning = true`.
- Hiển thị trạng thái cơ sở và lịch kiểm tra từ các API Inspections.

Địa chỉ API cục bộ mặc định dự kiến:

`http://localhost:3000/api`

Nếu frontend chạy trên thiết bị khác hoặc thông qua tunnel, cần cấu hình địa chỉ backend phù hợp thay vì sử dụng `localhost` của thiết bị frontend.

## 10. Bảo mật và lưu ý

- Không commit `.env`, mật khẩu database, MinIO credentials hoặc token thật.
- Không sử dụng `docker compose down -v` nếu cần giữ dữ liệu trong volume.
- Chỉ mở quyền truy cập MinIO theo nhu cầu demo và chính sách bảo mật của nhóm.
- Kiểm tra quyền truy cập API và phân quyền người dùng trước khi triển khai.
- Các endpoint được mô tả trong README không thay thế việc kiểm tra implementation thực tế.
- Các thay đổi schema database cần được thống nhất với thành viên phụ trách database.

## 11. Tài liệu tham khảo

- NestJS Documentation: https://docs.nestjs.com
- Docker Compose Documentation: https://docs.docker.com/compose/
- MinIO Documentation: https://min.io/docs/
- Swagger / OpenAPI: https://swagger.io/specification/

Tài liệu API chi tiết: `API_DOCUMENTATION.md` nếu file này đã được tạo trong repository.

---

**Đề tài:** Hệ thống quản lý cơ sở thuộc diện kiểm tra PCCC (G1.8)  
**Nhóm:** G18  
**Phân hệ:** Backend Role 4 — Storage, QR Code & Inspection Engine  
**Người phụ trách:** Vũ Mạnh Huynh
