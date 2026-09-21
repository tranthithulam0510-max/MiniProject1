# Điều Tra Hiện Trường — Khảo Sát Bạo Lực Học Đường

App này dùng để đi khảo sát học sinh về **bạo lực học đường**, có thể sử dụng trực tiếp trên điện thoại trong lúc phỏng vấn. Điểm quan trọng của app là dữ liệu khảo sát được lưu ngay trên thiết bị trước, nên khi ở trường gặp chỗ mạng yếu hoặc mất mạng vẫn có thể nhập và lưu phiên khảo sát. Khi có mạng trở lại, các phiên chưa đồng bộ sẽ được gửi lên Google Sheets.

Form khảo sát gồm ba phần chính: nhập thông tin buổi phỏng vấn (ai hỏi, hỏi ai, ở đâu, lúc nào), trả lời **8 câu hỏi cố định** về bạo lực học đường, và thêm ảnh hiện trường nếu cần.

Bấm lưu là dữ liệu được lưu trên máy trước, không cần chờ mạng. Bộ câu hỏi hiện được khai báo trong `src/main.js`, nằm trong mảng `QUESTIONS`, nên nếu muốn thay đổi nội dung câu hỏi có thể sửa trực tiếp tại đó.

## Chạy thử

```bash
npm install
npm run dev
```

Sau khi chạy, mở đường dẫn Vite in ra, thường là:

```text
http://localhost:5173
```

Có thể dùng trình duyệt để nhập thử một phiên khảo sát, thêm ảnh từ máy tính và xem lại trong tab **Lịch sử**.

### Test khi mất mạng

Mở app trước khi test, sau đó vào DevTools → **Network** → chọn **Offline**.

Điền thông tin khảo sát và bấm lưu. Phiên vẫn phải được lưu và xuất hiện trong **Lịch sử**, vì dữ liệu được lưu bằng IndexedDB trên thiết bị và không cần gọi mạng.

Lưu ý: bản web hiện tại **không có service worker**, nên nếu reload trang hoàn toàn khi đang offline thì trình duyệt có thể không tải lại được. Offline ở đây chủ yếu là **lưu dữ liệu khảo sát không cần Internet**, chứ chưa phải web app có thể mở mới hoàn toàn khi mất mạng.

Sau khi bỏ chế độ Offline và có mạng trở lại, app sẽ tự động thử đồng bộ các phiên đang **Chờ đồng bộ**.

## Chụp ảnh hiện trường

Khi chạy dưới dạng app Android, nút thêm ảnh sẽ sử dụng **camera thật của điện thoại** thông qua Capacitor.

Ảnh chụp sẽ:

* Hiển thị ngay trong phiên khảo sát.
* Được lưu vào vùng dữ liệu của ứng dụng để không mất khi đang làm khảo sát.
* Đồng thời được lưu vào **Gallery** của điện thoại.
* Có thể xóa ảnh trước khi lưu phiên.

Phần xử lý ảnh nằm trong `src/photoStorage.js`.

Nếu chạy bản web trên trình duyệt thông thường thì vẫn có thể chọn ảnh từ thiết bị thông qua ô chọn file.

## Xem lại lịch sử

Vào tab **Lịch sử phiên** để xem các phiên khảo sát đã thực hiện.

Bấm vào một phiên để mở chi tiết, gồm:

* Thông tin buổi phỏng vấn.
* Các câu trả lời.
* Ảnh đã chụp.

Mỗi phiên sẽ có trạng thái:

* **Chờ đồng bộ**: dữ liệu vẫn đang được lưu trên máy và chưa gửi thành công lên Google Sheets.
* **Đã đồng bộ**: dữ liệu đã được gửi thành công.

## Nối với Google Sheets

Phần đồng bộ sử dụng **Google Apps Script** làm cầu nối nên không cần dựng backend riêng.

Làm theo file `HUONG_DAN_TICH_HOP.md` để tạo Web App bằng Google Apps Script. Sau khi deploy sẽ có một đường dẫn dạng:

```text
https://script.google.com/macros/s/.../exec
```

Sau đó vào `src/main.js` và sửa:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
```

Lưu lại rồi chạy lại app. Khi có dữ liệu đang **Chờ đồng bộ**, có thể bấm **Đồng bộ ngay** để gửi lên Google Sheets.

Nếu đang online, sau khi lưu một phiên khảo sát app cũng sẽ tự động thử đồng bộ.

## Build ứng dụng

Để build bản web:

```bash
npm run build
npm run preview
```

Bản build được tạo trong thư mục `dist/`.

Nếu deploy bản web lên các nền tảng như Cloudflare Pages hoặc Vercel thì có thể sử dụng:

```text
Build command: npm run build
Output directory: dist
```

## Đóng gói thành Android

Dự án hiện đã được cấu hình với **Capacitor** để có thể đóng gói thành ứng dụng Android và sử dụng camera native của điện thoại.

Có thể chạy:

```bash
npm run android
```

Lệnh này sẽ:

1. Build project.
2. Đồng bộ bản build vào Android.
3. Mở project Android để tiếp tục chạy/build ứng dụng.

Các phần liên quan đến Android nằm trong thư mục `android/`.

## Dữ liệu được lưu như thế nào?

Dữ liệu khảo sát được lưu bằng **IndexedDB**, phần xử lý nằm trong `src/db.js`.

Mỗi phiên gồm thông tin người phỏng vấn, thời gian, địa điểm, người được phỏng vấn, lớp, câu trả lời, ảnh và trạng thái đồng bộ.

Ảnh trên bản web có thể được lưu dưới dạng Base64; khi chạy Android, ảnh được lưu trong vùng dữ liệu của ứng dụng và khi cần đồng bộ sẽ được đọc lại thành Base64 để gửi lên Google Apps Script.

## Cấu trúc chính

```text
src/
├── main.js             # Logic chính của ứng dụng
├── db.js               # Lưu dữ liệu khảo sát bằng IndexedDB
├── photoStorage.js     # Chụp, lưu và xử lý ảnh
└── style.css           # Giao diện

android/                # Project Android của Capacitor
dist/                   # Bản build web
capacitor.config.json   # Cấu hình Capacitor
package.json            # Thư viện và lệnh chạy project
```

## Kế hoạch mở rộng

Nếu tiếp tục phát triển, app có thể được bổ sung thêm các chức năng phục vụ khảo sát thực tế như quản lý bộ câu hỏi linh hoạt hơn, cải thiện giao diện trên điện thoại hoặc mở rộng cách quản lý và xuất dữ liệu khảo sát.
