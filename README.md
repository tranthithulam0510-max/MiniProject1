# Điều Tra Hiện Trường — Khảo Sát Bạo Lực Học Đường

App này để đi khảo sát học sinh về bạo lực học đường, dùng ngay trên điện thoại lúc đang phỏng vấn. Cái quan trọng nhất là nó phải chạy được ở trường, chỗ mạng chập chờn hoặc mất hẳn — nên toàn bộ dữ liệu gõ vào được lưu thẳng vào máy trước, có mạng lại thì tự đẩy lên Google Sheet sau.

Form có ba phần: nhập thông tin buổi phỏng vấn (ai hỏi, hỏi ai, ở đâu, lúc nào), trả lời 8 câu hỏi cố định về bạo lực học đường, và chụp vài tấm ảnh hiện trường nếu cần. Bấm lưu là xong, không cần chờ mạng. Muốn sửa lại bộ câu hỏi thì vào `src/main.js`, tìm mảng `QUESTIONS` mà sửa trực tiếp.

Xem lại các phiên đã làm thì vào tab "Lịch sử phiên" — bấm vào một phiên là nó mở ra xem hết câu trả lời với ảnh. Phiên nào chưa gửi lên Sheet được thì có chữ "Chờ đồng bộ", gửi rồi thì đổi thành "Đã đồng bộ".

## Chạy thử

```bash
npm install
npm run dev
```

Xong thì mở link Vite in ra, thường là `http://localhost:5173`.

Muốn test cảnh mất mạng: mở trang lên trước (để lúc offline không phải tải lại), rồi vào DevTools qua tab Network tick Offline. Điền form, bấm lưu — phiên vẫn phải lưu được và hiện trong lịch sử, vì phần này chỉ đụng tới IndexedDB chứ không gọi mạng. Lưu ý là code hiện chưa có service worker, nên nếu bạn reload trang lúc đang offline thì trang sẽ không tải lại được — cái offline ở đây là "lưu dữ liệu không cần mạng" chứ chưa phải "mở app không cần mạng". Test xong thì bỏ tick Offline, các phiên đang chờ sẽ tự gửi lên Sheet.

## Nối với Google Sheets

Phần đồng bộ dùng Google Apps Script làm cầu nối, khỏi cần dựng backend riêng. Làm theo file `HUONG_DAN_TICH_HOP.md` để tạo cái Web App đó, deploy xong sẽ có một link dạng `https://script.google.com/macros/s/.../exec`.

Có link rồi thì vào `src/main.js`, sửa dòng này:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/xxx/exec';
```

Lưu lại, chạy `npm run dev` (hoặc build lại nếu app đã lên production), rồi bấm "Đồng bộ ngay" thử coi có ăn không.

Lưu ý là mỗi lần sửa code bên Apps Script, phải vào Manage deployments tạo version mới, không thì cái link cũ vẫn chạy code cũ, sửa gì cũng không thấy hiệu lực.

## Build để deploy

```bash
npm run build
npm run preview
```

Kết quả nằm trong `dist/`, kéo lên Cloudflare Pages hay Vercel gì cũng được, build command là `npm run build`, output là `dist`.

## Dữ liệu lưu ra sao

Mỗi phiên phỏng vấn là một object như vầy:

```js
{
  id: 's_<timestamp>_<random>',
  interviewerName: 'Nguyễn Văn A',
  interviewTime: '2026-09-14T10:30',
  location: 'Trường THPT A, sân trường',
  intervieweeName: 'Trần Thị B',
  intervieweeClass: '11A2',
  answers: [{ question: '...', answer: '...' }, ...],
  photos: ['data:image/jpeg;base64,...', ...],
  synced: false,
  createdAt: 1234567890
}
```

Lưu bằng IndexedDB (code trong `src/db.js`) chứ không phải localStorage, vì cần chứa được ảnh và bền hơn khi tắt trình duyệt giữa chừng.

## Sau này

Nếu cần dùng lâu dài ngoài hiện trường mà không tiện mở trình duyệt, có thể đóng gói lại thành app Android bằng Capacitor.