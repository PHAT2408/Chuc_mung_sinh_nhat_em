/* =====================================================================
   CẤU HÌNH MÓN QUÀ (Gift settings) — file duy nhất bạn cần sửa

   • Chỉ sửa phần chữ nằm giữa dấu ngoặc kép "…" hoặc giữa hai dấu ` … `
   • Giữ nguyên dấu phẩy , ở cuối mỗi dòng
   • Sửa xong bấm "Commit changes", đợi 1–2 phút rồi tải lại trang
   • Muốn biết có gõ sai gì không: mở link trang và thêm ?check vào cuối
   ===================================================================== */
window.GIFT_CONFIG = {

  // Tên người nhận (Name)
  name: "Bảo Liên",

  // Ngày sinh, viết theo dạng Năm-Tháng-Ngày (Birthday, YYYY-MM-DD)
  dob: "2007-11-15",

  // Nhạc nền (Background music)
  // Bỏ file MP3 vào thư mục music/ rồi ghi đúng tên file ở đây.
  // Không thấy file thì trang tự dùng nhạc piano có sẵn.
  // Để trống "" nếu chỉ muốn dùng piano.
  music: "music/nhac-nen.mp3",

  // Ảnh kỷ niệm (Photos)
  // Bỏ ảnh vào thư mục photos/ rồi liệt kê ở đây theo thứ tự muốn hiện.
  // caption là dòng chữ viết tay dưới ảnh, để trống "" cũng được.
  // Ảnh nào chưa có file sẽ tự được bỏ qua. Chưa có ảnh nào thì album hiện 6 khung tranh minh hoạ.
  // Thêm ảnh thứ 7, 8…: chép thêm một dòng giống các dòng dưới và đổi tên file.
  photos: [
    { src: "photos/1.jpg", caption: "" },
    { src: "photos/2.jpg", caption: "" },
    { src: "photos/3.jpg", caption: "" },
    { src: "photos/4.jpg", caption: "" },
    { src: "photos/5.jpg", caption: "" },
    { src: "photos/6.jpg", caption: "" },
  ],

  // Ký tên cuối thư (Signature) — để trống "" nếu muốn giữ bí mật
  signature: "",

  // Lá thư (Letter)
  // Các đoạn cách nhau bằng MỘT DÒNG TRỐNG. Đoạn đầu và đoạn cuối hiện bằng chữ viết tay lớn.
  // Không dùng dấu ` và dấu \ trong thư.
  letter: `Dear Bảo Liên,

Hôm nay là một ngày thật đặc biệt anh chúc em thật nhiều sức khỏe luôn vui vẻ và hạnh phúc nhaaa.
Đừng để mình buồn nhiều quá nha có gì buồn thì nói anh nha.
Anh không chắc được lúc nào cũng có thể an ủi em được nhưng nếu có thể anh sẽ luôn cố gắng để có mặt bên em
Vì thế có chuyện gì buồn thì kể anh nhaa mà anh nghĩ tốt nhất là không có chuyện buồn luôn thì tốt hơn :3
Sinh nhật vui vẻ nha em
Happy Birthday, Bảo Liên! ❤️`,

};
