# VKU Field Survey PWA

Offline-first inspection form dùng để khảo sát cơ sở vật chất trong khuôn viên trường (phòng học, thiết bị, hạ tầng...). App hoạt động **hoàn toàn không cần mạng**: dữ liệu được lưu trực tiếp trên thiết bị và tự động đồng bộ lên server khi có kết nối trở lại.

## Tính năng

- Cài đặt được như app thật (Add to Home Screen) nhờ Web App Manifest
- Mở được và điền form được dù không có mạng, nhờ Service Worker cache toàn bộ app shell
- Lưu dữ liệu (kể cả ảnh chụp) vào IndexedDB — không mất dữ liệu khi tắt trình duyệt
- Tự động đồng bộ khi có mạng trở lại (`online` event + Background Sync API nếu trình duyệt hỗ trợ)
- Sẵn sàng để wrap thành Android APK bằng Capacitor

## Tech stack

| Thành phần | Công nghệ |
|---|---|
| Build tool | Vite |
| PWA (manifest + service worker) | vite-plugin-pwa (Workbox) |
| Lưu trữ offline | IndexedDB (qua thư viện `idb`) |
| UI | HTML/CSS/JS thuần (không framework, để dễ wrap Capacitor) |

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. Service Worker đã được bật ở cả môi trường dev (`devOptions.enabled: true` trong `vite.config.js`) để bạn test offline ngay khi phát triển.

### Test chế độ offline

1. Mở DevTools → tab **Application** → **Service Workers** → tick **Offline**
2. Reload trang — app vẫn phải mở được và form vẫn điền/lưu được
3. Bỏ tick **Offline** — dữ liệu đã lưu sẽ tự động đồng bộ

## Build production

```bash
npm run build
npm run preview   # xem thử bản build
```

Output nằm trong thư mục `dist/`.

## Deploy

### Cloudflare Pages
1. Push code lên GitHub
2. Vào Cloudflare Pages → **Create a project** → **Connect to Git** → chọn repo
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Deploy — Cloudflare tự cấp HTTPS

### Vercel
1. Push code lên GitHub
2. Import repo vào Vercel (framework preset: Vite)
3. Vercel tự nhận `npm run build` và thư mục `dist`, tự cấp HTTPS

## Kiến trúc offline-first

```
Form UI → IndexedDB (lưu ngay, status = "pending")
              ↓
    có mạng? → NO → giữ trong hàng đợi local
              → YES → gửi lên server → đánh dấu "synced"
```

- **Service Worker** (do `vite-plugin-pwa` sinh) cache toàn bộ HTML/CSS/JS ngay từ lần load đầu, nên app mở được kể cả khi mất mạng hoàn toàn ngay từ đầu (không cần đã từng online trước đó).
- **IndexedDB** là nơi lưu dữ liệu form thật sự — bền vững hơn localStorage, hỗ trợ lưu Blob (ảnh chụp) tốt.
- Khi trình duyệt bắn event `online`, hoặc khi Background Sync API kích hoạt, app duyệt qua các bản ghi `pending` và gửi lên server.

## Kết nối với backend thật

Hiện tại hàm đồng bộ trong `src/main.js` (`mockSync`) chỉ giả lập thành công sau 300ms để bạn test luồng UI. Khi có backend thật (Firebase, Supabase, Google Sheet Web App, hoặc REST API riêng), thay hàm này bằng:

```js
async function syncRecord(record) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  })
  if (!res.ok) throw new Error('Sync failed')
}
```

## Kế hoạch tiếp theo

Tuần sau: wrap PWA này thành Android APK bằng **Capacitor**:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npm run build
npx cap copy
npx cap open android
```

Vì code không phụ thuộc framework nặng và không dùng API chỉ có trên desktop, `webDir: 'dist'` sẽ hoạt động ngay khi wrap.
