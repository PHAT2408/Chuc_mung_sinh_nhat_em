# 🎁 Bảo Liên's Birthday Surprise

Trang chúc mừng sinh nhật tương tác: mở hộp quà → thổi nến và ước → album kỷ niệm → lá thư → pháo hoa kết thúc.
Chỉ dùng HTML, CSS và JavaScript, không cần server. Đưa lên **GitHub Pages** là có link gửi đi.

## Trong thư mục có gì

| File / thư mục | Dùng để làm gì |
|---|---|
| `config.js` | **File duy nhất cần sửa**: tên, ngày sinh, lá thư, danh sách ảnh, nhạc |
| `photos/` | Bỏ ảnh kỷ niệm vào đây (`1.jpg`, `2.jpg`, …) |
| `music/` | Bỏ nhạc nền vào đây (`nhac-nen.mp3`) |
| `index.html`, `style.css`, `app.js` | Giao diện và hiệu ứng, không cần đụng tới |
| `404.html` | Trang báo lỗi nhỏ khi đường dẫn không tồn tại |

## 1. Đưa lên GitHub Pages

1. Đăng nhập [github.com](https://github.com) → bấm dấu **+** ở góc trên bên phải → **New repository**.
2. **Repository name**: đặt tên không dấu, không khoảng trắng, ví dụ `happy-birthday`. Chọn **Public** → **Create repository**.
3. Ở trang repo vừa tạo, bấm link **uploading an existing file** (nếu repo đã có file thì bấm **Add file** → **Upload files**).
4. Mở thư mục đã giải nén, chọn **tất cả** file và thư mục bên trong (Ctrl + A) rồi kéo thả vào trang GitHub.
   Đừng kéo cả thư mục ngoài cùng, vì khi đó `index.html` sẽ nằm sai chỗ và trang báo 404.
5. Giữ lựa chọn **Commit directly to the `main` branch** → bấm **Commit changes**.
6. Vào **Settings** → **Pages** (cột bên trái). Ở mục **Build and deployment**: **Source** chọn **Deploy from a branch**; **Branch** chọn **main** và **/ (root)** → **Save**.
7. Đợi 1–2 phút (đôi khi tới 10 phút) rồi tải lại trang **Pages**. Link hiện ở đầu trang, dạng
   `https://<tên-tài-khoản>.github.io/happy-birthday/` → bấm **Visit site**.

> Tài khoản GitHub miễn phí chỉ bật được Pages cho repo **Public**. Ai tìm thấy repo cũng xem được ảnh và lá thư bên trong, nên chỉ đăng những ảnh Bảo Liên thấy thoải mái.

## 2. Thêm ảnh kỷ niệm

1. Đổi tên ảnh thành `1.jpg`, `2.jpg`, `3.jpg`… theo thứ tự muốn hiện.
   Windows thường ẩn đuôi file: khi đổi tên chỉ gõ `1`, `2`, `3` (gõ `1.jpg` có thể thành `1.jpg.jpg`).
2. Trên GitHub mở thư mục `photos` → **Add file** → **Upload files** → kéo ảnh vào → **Commit changes**.

- `config.js` khai báo sẵn 6 ảnh (`1.jpg` đến `6.jpg`). Ảnh nào chưa có file sẽ tự được bỏ qua.
- Muốn có ảnh thứ 7, 8… hoặc muốn ghi chú dưới ảnh (`caption`): sửa danh sách `photos` trong `config.js` (xem mục 4).
- Dùng được `.jpg`, `.jpeg`, `.png`, `.webp`, viết hoa hay viết thường đều được.
- Ảnh iPhone dạng **HEIC** cần đổi sang JPG trước khi tải lên.
- Trang tự thu nhỏ ảnh lớn khi hiển thị, nhưng người xem vẫn phải tải file gốc. Nên giữ mỗi ảnh dưới khoảng 2 MB để mở nhanh trên điện thoại.
- Chưa có ảnh nào thì album hiện 6 khung tranh minh hoạ.

## 3. Thêm nhạc nền

1. Đổi tên file nhạc thành `nhac-nen.mp3` (Windows ẩn đuôi file: chỉ gõ `nhac-nen`).
2. Trên GitHub mở thư mục `music` → **Add file** → **Upload files** → kéo file vào → **Commit changes**.

- Muốn giữ tên gốc của file: sửa dòng `music:` trong `config.js` cho khớp tên file.
- Không có file nhạc thì trang tự dùng nhạc piano nhẹ có sẵn.
- Nhạc chỉ phát sau khi người xem bấm **OPEN YOUR GIFT**. Nút ♪ ở góc trên bên phải để bật hoặc tắt.
- GitHub giới hạn 25 MB cho mỗi file tải lên qua trình duyệt. Nên dùng file dưới 8 MB.

## 4. Sửa tên, ngày sinh, lá thư, chú thích ảnh

Trên GitHub mở `config.js` → bấm biểu tượng bút chì ✏️ (**Edit this file**) → sửa → **Commit changes**.

- Chỉ sửa phần chữ nằm giữa dấu ngoặc kép `"…"` hoặc giữa hai dấu `` ` ``.
- Giữ nguyên dấu phẩy `,` ở cuối mỗi dòng.
- Lá thư: các đoạn cách nhau bằng một dòng trống. Đoạn đầu và đoạn cuối hiện bằng chữ viết tay lớn.
- Số tuổi trên bánh kem tự tính từ ngày sinh.
- Tên hiện trong bản xem trước khi gửi link (Zalo, Messenger, iMessage) nằm ở các dòng `<title>` và `og:title` đầu file `index.html`. Chỉ cần sửa nếu bạn đổi tên người nhận.

## 5. Kiểm tra sau khi sửa

- Thay đổi lên mạng sau khoảng 1–2 phút, đôi khi tới 10 phút. Trình duyệt có thể còn giữ bản cũ: tải lại trang hoặc mở bằng tab ẩn danh.
- Thêm `?check` vào cuối link, ví dụ `https://<tên-tài-khoản>.github.io/happy-birthday/?check`.
  Trang sẽ báo `config.js` có lỗi không (kèm số dòng), ảnh nào chưa tìm thấy và file nhạc có đúng tên không.
  Người nhận mở link bình thường sẽ không thấy bảng này.
- Ảnh chưa có file sẽ tạo vài dòng lỗi 404 màu đỏ trong Console của trình duyệt. Đó là lúc trang đi tìm ảnh, không ảnh hưởng gì.

## Xem thử trên máy trước khi tải lên

Bấm đúp `index.html` để mở bằng trình duyệt. Font chữ cần có Internet.
Lần kiểm tra cuối nên làm trên link GitHub Pages, bằng điện thoại, vì đó là bản Bảo Liên sẽ mở.
