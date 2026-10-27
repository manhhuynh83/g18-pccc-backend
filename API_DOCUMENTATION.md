# HỆ THỐNG PCCC (NHÓM G18) - TÀI LIỆU API ROLE 4
> Tiền tố toàn cục: `/api` | Cấu trúc phản hồi: `{ success, message, data }`

## 1. Storage Module (MinIO)
* **Tải ảnh/PDF lên kho (tối đa 10MB)**: `POST /api/storage/upload`
  * Form-data key: `file`
  * Trả về: `data.url`, `data.fileName`, `data.size`, `data.contentType`

## 2. Equipments & QR Inspection Module
* **Tạo thiết bị PCCC (tự sinh mã EQ-YYYY-XXXX)**: `POST /api/equipments`
  * Body: `{ "name": "Bình bột ABC", "facilityId": "FAC-001", "facilityLat": 10.8523, "facilityLng": 106.6289 }`
* **Danh sách thiết bị**: `GET /api/equipments?facilityId=`
* **Tra cứu mã QR**: `GET /api/equipments/:qrCode` (ví dụ: `/api/equipments/EQ-2026-0001`)
* **Kiểm tra hiện trường & phát hiện lệch GPS 200m**: `POST /api/equipments/:qrCode/inspect`
  * Body: `{ "status": "GOOD" | "BROKEN", "lat": 10.8524, "lng": 106.6290 }`
  * Trả về: `data.distanceDiffMeter`, `data.isGpsWarning` (true nếu lệch > 200m)

## 3. Inspections & Cycles Engine
* **Tạo cơ sở quản lý**: `POST /api/inspections/facilities`
  * Body: `{ "name": "Nhà máy A", "riskLevel": "HIGH" | "MEDIUM" | "LOW", "latitude": 10.8523, "longitude": 106.6289 }`
* **Danh sách cơ sở**: `GET /api/inspections/facilities`
* **Lập lịch kiểm tra (báo trước >= 3 ngày làm việc nếu định kỳ)**: `POST /api/inspections`
  * Body: `{ "facilityId": "UUID", "inspectorId": "INSP-001", "inspectionType": "PERIODIC" | "SUDDEN", "scheduledDate": "2026-11-05" }`
* **Hoàn tất biên bản & tự tính chu kỳ (+6 tháng HIGH / +12 tháng MEDIUM)**: `PATCH /api/inspections/:id/complete`
  * Body: `{ "conclusion": "PASSED" | "FAILED", "reportFileUrl": "URL_PDF", "checkInLat": 10.8523, "checkInLng": 106.6289 }`
* **Kích hoạt quét hạn kiểm tra tức thì (Demo Cronjob)**: `POST /api/inspections/run-daily-check`