# HỆ THỐNG PCCC (NHÓM G18) - TÀI LIỆU API ROLE 4
> **Swagger UI Test trực tiếp:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)  
> **Tiền tố toàn cục:** `/api`  
> **Cấu trúc phản hồi:** `{ "success": boolean, "message": string, "data": any }`

---

## 1. Storage Module (MinIO)
* **Tải ảnh/PDF lên kho (tối đa 10MB)**: `POST /api/storage/upload`
  * **Header**: `Content-Type: multipart/form-data`
  * **Body key**: `file` (chỉ nhận JPG, PNG, WEBP, PDF)
  * **Trả về**: `data.url`, `data.fileName`, `data.size`, `data.contentType`

---

## 2. Equipments & QR Inspection Module
* **Tạo thiết bị PCCC (tự sinh mã EQ-YYYY-XXXX)**: `POST /api/equipments`
  * **Body**:
    ```json
    {
      "name": "Bình bột ABC",
      "facilityId": "FAC-001",
      "facilityLat": 10.8523,
      "facilityLng": 106.6289,
      "expiryDate": "2027-10-27"
    }
    ```
* **Lấy danh sách thiết bị**: `GET /api/equipments?facilityId=`
* **Tra cứu thông tin thiết bị theo mã QR**: `GET /api/equipments/:qrCode` *(Ví dụ: `/api/equipments/EQ-2026-0001`)*
* **Sửa thông tin / Gia hạn bảo dưỡng thiết bị**: `PUT /api/equipments/:id`
  * **Body**: `{ "name": "Bình mới", "expiryDate": "2028-01-01", "status": "GOOD" }`
* **Xóa thiết bị**: `DELETE /api/equipments/:id`
* **Quét QR kiểm tra hiện trường & đối chiếu GPS 200m**: `POST /api/equipments/:qrCode/inspect`
  * **Body**: `{ "status": "GOOD" | "BROKEN", "lat": 10.8524, "lng": 106.6290 }`
  * **Trả về**: `data.distanceDiffMeter`, `data.isGpsWarning` (báo `true` nếu lệch > 200m)
  * *Lưu ý*: Thiết bị đã `EXPIRED` không được quét đổi về `GOOD` (phải cập nhật hạn mới qua PUT).

---

## 3. Inspections & Cycles Engine
* **Tạo cơ sở quản lý**: `POST /api/inspections/facilities`
  * **Body**:
    ```json
    {
      "name": "Nhà máy hóa chất Quang Trung",
      "riskLevel": "HIGH", // HIGH, MEDIUM, LOW
      "latitude": 10.8523,
      "longitude": 106.6289
    }
    ```
* **Danh sách cơ sở**: `GET /api/inspections/facilities`
* **Lập lịch kiểm tra**: `POST /api/inspections`
  * **Body**:
    ```json
    {
      "facilityId": "UUID",
      "inspectorId": "INSP-001",
      "inspectionType": "PERIODIC", // PERIODIC (định kỳ) hoặc SUDDEN (đột xuất)
      "scheduledDate": "2026-11-05"
    }
    ```
  * *Ràng buộc*: Kiểm tra định kỳ `PERIODIC` phải đặt cách hôm nay ít nhất 3 ngày làm việc (trừ Thứ 7, CN).
* **Danh sách lịch kiểm tra (có bộ lọc)**: `GET /api/inspections?facilityId=&status=&startDate=&endDate=`
* **Xem chi tiết một lịch/biên bản**: `GET /api/inspections/:id`
* **Hoàn tất biên bản & tự tính chu kỳ (+6 tháng HIGH / +12 tháng MEDIUM)**: `PATCH /api/inspections/:id/complete`
  * **Body**:
    ```json
    {
      "conclusion": "PASSED", // PASSED hoặc FAILED
      "reportFileUrl": "http://localhost:9000/pccc-files/bien-ban.pdf",
      "checkInLat": 10.8523,
      "checkInLng": 106.6289
    }
    ```
  * *Tự động cập nhật cơ sở*: Cập nhật `lastInspectionDate`, tự động cộng hạn kế tiếp `nextInspectionDate` (+6 tháng với HIGH, +12 tháng với MEDIUM/LOW) và đổi trạng thái (`SAFE` / `VIOLATION`).
* **Kích hoạt quét hạn kiểm tra tức thì (Demo Cronjob)**: `POST /api/inspections/run-daily-check`
  * Tác vụ: Đổi lịch quá hạn sang `OVERDUE`, đổi thiết bị hết hạn sang `EXPIRED`, đổi cơ sở quá hạn sang `VIOLATION`, cảnh báo cơ sở còn dưới 15 ngày sang `WARNING`.