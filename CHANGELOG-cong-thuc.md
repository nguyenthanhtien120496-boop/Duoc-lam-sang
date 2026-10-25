# Nhật ký thay đổi công thức

Mỗi lần thêm hoặc sửa công thức: ghi ngày, nguồn, ca kiểm thử đã chạy, người đối chiếu.

## 2026-10-25 – v1.0.0 (khởi tạo)

| Công thức | Nguồn (số trong data/formulas.json) | Ca kiểm thử | Người đối chiếu thứ hai |
|---|---|---|---|
| Cockcroft-Gault (CrCl) | 1, 6 | 19 ca: điển hình, nữ, tương đương µmol/L–mg/dL, cao tuổi suy thận, ngưỡng 18 tuổi, trẻ em, 0, âm, rỗng, thiếu giới, tuổi > 120, nhầm đơn vị hai chiều (88 mg/dL; 1,0 µmol/L), ngưỡng 25 / 25,1 mg/dL, vùng cảnh báo 18 và 0,15 mg/dL, ngưỡng 0,09 mg/dL, cân nặng 250 kg | Chưa có |
| CKD-EPI 2021 (creatinine, không hệ số chủng tộc) | 2, 6 | 12 ca: nam/nữ, Scr = κ, Scr < κ, Scr > κ, tương đương đơn vị, ngưỡng 18 tuổi, eGFR < 15, trẻ em, tuổi chữ | Chưa có |
| Schwartz bedside 2009 | 3, 6 | 6 ca: mg/dL, µmol/L, 18 tuổi, chiều cao 0, ngoài khoảng tuổi 1–16 | Chưa có |
| Phân độ G – KDIGO 2012 | 6 | 11 ca sát ngưỡng 90/60/45/30/15 | Chưa có |
| BSA Mosteller | 4 | 5 ca: người lớn, sơ sinh, 0, rỗng | Chưa có |
| BMI + phân loại WHO người lớn | 5 | 12 ca: sát ngưỡng 18,5/25/30/35/40, bẫy dấu phẩy động 64 kg–160 cm, phân loại theo số hiển thị, nhập nhầm mét | Chưa có |
| Quy đổi creatinine 1 mg/dL = 88,4 µmol/L | 6 | 7 ca: hai chiều, dấu phẩy thập phân, rỗng, chữ, chuỗi sai, đơn vị lạ | Chưa có |
| Hiển thị số (không phân nhóm hàng nghìn) | — | 2 ca | — |

Kết quả: 74/74 ca đạt, chạy trên hai bộ máy JavaScript: Chromium (tests/index.html) và JavaScriptCore của macOS. Máy phát triển chưa cài Node.

Quyết định thiết kế:
- Creatinine < 0,1 mg/dL hoặc > 25 mg/dL (sau quy đổi) bị coi là nhầm giá trị hoặc đơn vị: báo lỗi, không ra kết quả. 0,1–0,2 và 15–25 mg/dL: vẫn tính, kèm cảnh báo.
- Không phân nhóm hàng nghìn khi hiển thị số ("7.288" dễ đọc nhầm là thập phân).
- Phân loại BMI và phân độ KDIGO dựa trên giá trị đã làm tròn 1 chữ số thập phân, để khớp với số hiển thị.
- Biểu thức trong data/formulas.json được viết từ tài liệu tham khảo đã nêu nhưng **chưa đối chiếu nguyên văn** với bản gốc; trạng thái `unverified`.
