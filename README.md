# Cổng Dược Lâm Sàng – Khoa Dược, BV Sản Nhi Quảng Ngãi

Web app tĩnh (PWA) gom 20 tài liệu dược lâm sàng và 3 công cụ tính vào một giao diện có thanh điều hướng bên trái.

## Tính năng
- Thanh bên trái: nhóm tài liệu đóng/mở được, tìm kiếm không phân biệt dấu (phím tắt `/`), thu gọn thành thanh biểu tượng trên máy tính, ngăn kéo trượt trên điện thoại.
- 20 tài liệu trong 4 nhóm: tóm tắt guideline, thông tin thuốc, so sánh dược lý, thẩm định EBM. Tài liệu gốc giữ nguyên, hiển thị trong khung.
- Công cụ tính: CrCl Cockcroft-Gault; eGFR CKD-EPI 2021 (người lớn) và Schwartz bedside (trẻ em) kèm phân độ KDIGO; BMI (WHO) và BSA Mosteller.
- Dùng ngoại tuyến sau lần mở đầu (service worker), khi chạy qua http(s).
- Không thu thập, không gửi, không lưu dữ liệu người bệnh.

## Chạy thử
```bash
python3 -m http.server 8000
```
Mở http://localhost:8000. Mở trực tiếp `index.html` (file://) thì trình duyệt chặn đọc JSON nên danh mục tài liệu không tải được.

Triển khai: GitHub Pages (Settings → Pages → Deploy from branch `main`, thư mục `/`) hoặc máy chủ nội bộ.

## Cấu trúc
```
index.html, manifest.webmanifest, sw.js
css/base.css                lõi ClinPharmAI
css/theme-san-nhi-qn.css    màu nhấn đơn vị
js/core.js                  thanh bên, tìm kiếm, định tuyến
js/lib/formulas.js          công thức thuần (một điểm quy đổi creatinine)
js/lib/calc-ui.js           thành phần giao diện dùng chung cho công cụ tính
js/modules/*.js             mỗi trang một module
data/documents.json         danh mục tài liệu
data/formulas.json          biểu thức và nguồn Vancouver
tests/                      ca kiểm thử công thức (mở tests/index.html hoặc node tests/formulas.test.js)
*.html (thư mục gốc)        20 tài liệu gốc
```

## Thêm tài liệu mới
1. Chép tệp HTML vào thư mục gốc.
2. Thêm một bản ghi vào `data/documents.json` (id duy nhất, `category`, `title`, `short`, `file`, `tags`), tăng `version` và `updated`.
3. Tăng `CACHE_VERSION` trong `sw.js`.

## An toàn lâm sàng
- Công thức ở trạng thái **chưa kiểm chứng**: cần một dược sĩ hoặc bác sĩ khác đối chiếu với tài liệu gốc trước khi dùng trên người bệnh. Xem `CHANGELOG-cong-thuc.md`.
- Công cụ hỗ trợ quyết định, không thay thế phán đoán lâm sàng.
- Dữ liệu sức khỏe là dữ liệu cá nhân nhạy cảm (Nghị định 13/2023/NĐ-CP). Đơn vị triển khai chịu trách nhiệm pháp lý và nên đối chiếu với bộ phận pháp chế.
