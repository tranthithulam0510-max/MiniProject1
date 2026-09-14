# MINI-PROJECT SHORT TECHNICAL REPORT

****Course:**** Cross-Platform Mobile App Development (VKU)

****Mini-Project Title:**** Mini-Project 1 --- Điều Tra Hiện
Trường: Khảo Sát Bạo Lực Học Đường (School Violence Field Interview PWA)

****Team / Student Name:**** Trần Thị Thu Lam

****Submission Date:**** 14/09/2026

## 1. GENERAL INFORMATION & DELIVERABLE LINKS

****Team Members:****

  1. Trần Thị Thu Lam --- Student ID: 23IT.B108 --- Role: Full-stack
(Frontend, Offline storage, Backend integration) --- Contribution: 100%

****🔗 Live Demo URL:****
https://miniproject1-dku.pages.dev/  

****💻 GitHub Repository:****
https://github.com/tranthithulam0510-max/MiniProject1

****🎥 Video Demo (Optional):**** [Điền link nếu có]

## 2. FEATURE IMPLEMENTATION CHECKLIST

| # | Required Feature | Status | Implementation Details &
Acceptance Level |

|:---:|---|:---:|---|

| 1 | Nhập thông tin phiên phỏng vấn (người phỏng vấn, thời gian, địa
điểm, người được phỏng vấn) | ✅ Complete | Form nhập liệu đầy đủ
(`interviewerName`, `interviewTime`, `location`,
`intervieweeName`, `intervieweeClass`) trong `index.html` /
`main.js`, có validation `required` cho các trường bắt buộc. |

| 2 | Bộ câu hỏi & câu trả lời phỏng vấn cố định | ✅ Complete | 8
câu hỏi định tính cố định về chủ đề bạo lực học đường, render động ra
form bằng JS (mảng `QUESTIONS` trong `main.js`), câu trả lời lưu
dạng mảng `{question, answer}`. |

| 3 | Chụp ảnh hiện trường | ✅ Complete | `<input type="file"
accept="image/*" capture="environment" multiple>`, cho phép nhiều
ảnh/phiên, chuyển sang base64 bằng `FileReader` để lưu offline, có xem
trước (preview) và xóa từng ảnh trước khi lưu. |

| 4 | Hoạt động offline (Local Offline Persistence) | ✅ Complete |
Dùng IndexedDB thuần (`db.js`, không qua thư viện ngoài) làm bộ nhớ
cục bộ --- mọi phiên được ghi ngay khi bấm "Lưu" (`addSession`), không
phụ thuộc kết nối mạng. |

| 5 | Đồng bộ dữ liệu lên Google Sheets | ✅ Complete |
`doPost(e)` trong Apps Script parse JSON nhận từ client, tự tạo sheet
"Sessions" và dòng tiêu đề nếu chưa có, ghi mỗi phiên thành 1 dòng (9
cột: ID, người phỏng vấn, thời gian, địa điểm, người được PV, lớp/khối,
nội dung Q&A gộp thành text, link ảnh, thời điểm đồng bộ). Ảnh base64
được giải mã (`Utilities.base64Decode`) và upload lên một thư mục
Drive riêng (`getOrCreateFolder('VKU_Interview_Photos')`), set quyền
`DriveApp.Access.ANYONE_WITH_LINK` / `DriveApp.Permission.VIEW` rồi
gắn link (`file.getUrl()`) vào Sheet. |

| 6 | Tự động đồng bộ khi có mạng trở lại (Automatic Background Sync)
| ✅ Complete | Lắng nghe sự kiện `online` của `window` để tự động
gọi lại `syncPendingSessions()`; có cờ khóa `isSyncing` chống gửi
trùng khi bấm nhiều lần hoặc nhiều sự kiện `online` chồng nhau. |

| 7 | Thông báo khi đồng bộ thành công | ✅ Complete | Toast
notification hiện ở góc màn hình khi đồng bộ thành công ("Đã đồng bộ
thành công N phiên ✔"), phân biệt kiểu `success`/`warn` qua class
CSS. |

| 8 | Xem lịch sử các phiên đã phỏng vấn | ✅ Complete | Tab "Lịch
sử phiên" liệt kê toàn bộ phiên (mới nhất trước, nhờ sort theo
`createdAt` trong `getAllSessions()`), bấm vào để mở rộng xem chi
tiết câu hỏi/trả lời + ảnh, kèm badge trạng thái "Chờ đồng bộ" / "Đã
đồng bộ". |

| 9 | Cài đặt được như ứng dụng trên mobile (PWA Installable) | ❌
Not implemented | `index.html` hiện chưa có thẻ `<link
rel="manifest">`, và `main.js` chưa có đoạn đăng ký service worker
(`navigator.serviceWorker.register`). Ứng dụng hiện chỉ là web app
bình thường, chưa cài được qua "Add to Home Screen". |

| 10 | Responsive trên mobile viewport | ✅ Complete | CSS
Grid/Flexbox, media query `@media (max-width: 720px)` trong
`style.css` chuyển sidebar sang hàng ngang và gộp
`.glass-card`/`.stat-row` về 1 cột cho màn hình nhỏ. |

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1 Cấu trúc thư mục

```

vku-survey-pwa/

├── index.html          # Giao diện chính (form phỏng vấn, lịch sử, đồng
bộ)

├── src/

│   ├── main.js          # Logic ứng dụng: render form, xử lý ảnh,
lưu/đồng bộ

│   ├── db.js             # Wrapper IndexedDB thuần (addSession,
getAllSessions, getPendingSessions, markSessionSynced)

│   └── style.css         # Giao diện gradient tím-hồng + glassmorphism

└── public/

    └── logo.png          # Icon/logo hiển thị trong sidebar

```

Phần backend (Apps Script `doPost` + `getOrCreateFolder`, xem toàn
bộ mã nguồn tại ****Phụ lục A****) nằm ngoài repo này, được viết
và deploy trực tiếp trong trình soạn thảo Apps Script gắn với Google
Sheet đích (`Extensions → Apps Script` trên chính Sheet đó), không
phải file trong thư mục project.

### 3.2 Luồng dữ liệu (Data Flow)

Người dùng điền phiếu phỏng vấn → submit form.

Dữ liệu được đóng gói thành object `session` (`id`, thông tin
phỏng vấn, mảng `answers` {question, answer}, mảng `photos`
base64, `synced: false`, `createdAt`).

`addSession()` ghi ngay vào ****IndexedDB**** (object
store `sessions`, key path `id`) --- không phụ thuộc mạng
(offline-first).

Nếu thiết bị đang online (`navigator.onLine`), tự động gọi
`syncPendingSessions()`.

`syncPendingSessions()` lấy các phiên có `synced: false`
(`getPendingSessions()`), gửi từng phiên bằng `fetch POST` tới
`APPS_SCRIPT_URL`.

Phía backend, `doPost(e)` parse JSON
(`JSON.parse(e.postData.contents)`), lấy hoặc tạo sheet "Sessions"
(`getSheetByName('Sessions') || insertSheet('Sessions')`), tự
chèn dòng tiêu đề 9 cột nếu `sheet.getLastRow() === 0`, giải mã
từng ảnh base64 (tách phần `data;base64,` bằng `split(',')`
và regex lấy mime-type) thành `Blob` rồi upload vào thư mục Drive
`VKU_Interview_Photos`, gộp câu hỏi/trả lời thành một khối text
(`qaText`), ghi 1 dòng vào sheet bằng `appendRow()`, rồi trả về
`{status: 'ok'}`.

Nếu phản hồi JSON có `status === 'ok'`, client gọi
`markSessionSynced(id)` --- cập nhật `synced: true` và
`syncedAt` trong IndexedDB --- rồi hiển thị toast thông báo.

Nếu thiết bị mất mạng giữa chừng hoặc request lỗi, phiên vẫn ở trạng
thái "Chờ đồng bộ" trong IndexedDB; khi sự kiện `window.online`
được kích hoạt trở lại, app tự động gọi lại
`syncPendingSessions()`.

**### 3.2.1 Phạm vi hoạt động offline

Cơ chế offline của dự án dựa trên IndexedDB, không dựa trên PWA. Khi
người dùng đang mở ứng dụng và mất kết nối mạng, dữ liệu phiên phỏng vấn
vẫn được lưu cục bộ vào IndexedDB. Khi kết nối mạng trở lại, sự kiện
window.online kích hoạt quá trình đồng bộ các phiên chưa gửi lên
Google Apps Script. Do không sử dụng Service Worker để cache app shell,
khả năng mở lại toàn bộ ứng dụng khi đóng trình duyệt và đang offline
không được xem là một tính năng của phiên bản hiện tại.

3.3 State Management**

Ứng dụng dùng ****plain Vanilla JavaScript**** (không dùng
framework/state library), quản lý trạng thái theo mô hình:

- ****Persistent state****: lưu trong IndexedDB --- nguồn sự
thật duy nhất cho danh sách phiên (`sessions` object store, 2 index
phụ là `synced` và `createdAt`).

- ****Transient state****: biến JS cục bộ ở module scope
(`currentPhotos` cho ảnh đang chụp trong phiên chưa lưu, `isSyncing`
cho trạng thái đang đồng bộ) --- không bền vững, reset lại sau mỗi lần
submit hoặc reload trang.

- Sau mỗi thao tác ghi (lưu phiên, đồng bộ), giao diện được vẽ lại bằng
cách đọc trực tiếp từ IndexedDB (`refreshStats()`,
`renderHistory()`), đảm bảo UI luôn khớp với dữ liệu thật thay vì giữ
state trùng lặp trên UI.

#### 3.3.1 Cơ chế lưu trữ chi tiết (`db.js`)

`db.js` bọc IndexedDB thuần (không thư viện ngoài) thành các hàm
Promise dễ dùng:

- ****Mở database --- `openDB()`****: gọi
`indexedDB.open(DB_NAME, DB_VERSION)` với `DB_NAME =
'vku_interview_db'`, `DB_VERSION = 1`. Sự kiện `onupgradeneeded`
chỉ chạy lần đầu tiên (hoặc khi tăng version), tại đó tạo object store
`sessions` với `keyPath: 'id'` (dùng field `id` tự sinh phía
client làm khóa chính) và 2 index phụ `synced`, `createdAt` để
lọc/sắp xếp nhanh mà không cần quét toàn bộ dữ liệu.

- ****Ghi phiên --- `addSession(session)`****: mở transaction
`readwrite`, gọi `store.add(session)` để ghi thẳng object phiên (bao
gồm cả ảnh base64) vào database ngay khi bấm "Lưu" --- hoàn toàn không
phụ thuộc mạng.

- ****Đọc toàn bộ --- `getAllSessions()`****: transaction
`readonly`, gọi `store.getAll()` rồi sắp xếp kết quả giảm dần theo
`createdAt` (`b.createdAt - a.createdAt`) ngay trong hàm này trước
khi trả về --- đây là nơi thực sự thực hiện việc sắp xếp "mới nhất
trước", không phải ở `main.js`.

- ****Lấy phiên chưa đồng bộ --- `getPendingSessions()`****:
gọi lại `getAllSessions()` rồi `filter` những phiên có `synced ===
false` (lọc ở tầng JS, chưa dùng trực tiếp index `synced` qua
`IDBKeyRange`).

- ****Đánh dấu đã đồng bộ --- `markSessionSynced(id)`****:
transaction `readwrite`, `store.get(id)` lấy record, gán
`record.synced = true` và `record.syncedAt = Date.now()`, rồi
`store.put(record)` ghi đè lại đúng record đó.

- Toàn bộ 4 hàm đều được bọc trong `Promise`, bắt lỗi qua
`reject(request.error)` / `reject(tx.error)`.

### 3.4 Exception Handling

- Toàn bộ thao tác IndexedDB trong `db.js` được bọc Promise, bắt lỗi
qua `reject(request.error)` / `reject(tx.error)` ở tầng gọi.

- Mỗi lượt gọi `fetch` tới Apps Script trong vòng lặp đồng bộ được
bọc `try-catch` riêng lẻ theo từng phiên (`main.js`, hàm
`syncPendingSessions`) --- nếu 1 phiên gửi lỗi (log ra console), các
phiên còn lại trong hàng đợi vẫn tiếp tục gửi, không bị chặn toàn bộ
batch.

- Cờ khóa `isSyncing` + disable nút `sync-btn` trong khối
`try/finally` ngăn gọi đồng bộ chồng lấn (race condition) khi người
dùng bấm nút nhiều lần hoặc khi sự kiện `online` bắn liên tiếp.

- Backend Apps Script (`doPost`) bọc ****toàn bộ**** logic
(parse JSON, tạo sheet, upload ảnh lên Drive, ghi dòng) trong
****một khối `try-catch` duy nhất****; nếu có lỗi ở bất kỳ
bước nào (ví dụ ảnh base64 sai định dạng, quyền Drive bị từ chối, v.v.)
sẽ trả về `{status: 'error', message: err.message}` với mã phản hồi
HTTP 200 (không để lỗi 500 mặc định của Apps Script) --- nhờ vậy client
luôn parse được JSON phản hồi thay vì gặp lỗi mạng khó chẩn đoán.

- Trước khi gọi đồng bộ, `syncPendingSessions()` còn kiểm tra thêm 2
trường hợp lỗi cấu hình/kết nối để tránh gọi API vô ích: nếu
`APPS_SCRIPT_URL` chưa được thay bằng URL thật (chuỗi placeholder)
hoặc thiết bị đang offline (`!navigator.onLine`), hàm dừng sớm và hiện
toast cảnh báo tương ứng thay vì gửi request chắc chắn thất bại.

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

[Chèn 3--4 ảnh chụp màn hình đã chú thích tại đây, ví dụ:]

Giao diện phiếu phỏng vấn trên trình duyệt desktop (localhost hoặc
link live).

Giao diện tab "Lịch sử phiên" hiển thị các phiên đã lưu, kèm badge
trạng thái đồng bộ.

Dữ liệu thực tế trên Google Sheets sau khi đồng bộ thành công (9 cột
như mô tả ở mục 5), kèm link ảnh trong sheet dẫn tới file trên
Drive.

Giao diện ứng dụng trên viewport mobile (dưới 720px) thể hiện layout
responsive.

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

****Thách thức 1: Đồng bộ bị trùng lặp dữ liệu (Duplicate
Sync)****

Ban đầu, nút "Đồng bộ ngay" không có cơ chế khóa --- nếu người dùng bấm
nhiều lần liên tiếp trước khi request trước hoàn tất, mỗi lần bấm sẽ đọc
lại toàn bộ danh sách phiên "chờ đồng bộ" (vì phiên chưa kịp được đánh
dấu `synced: true`) và gửi lại, gây trùng dòng trên Google Sheets.

Giải pháp: thêm biến cờ `isSyncing` và disable nút trong lúc xử
lý; chỉ mở khóa lại trong khối `finally` sau khi toàn bộ batch đồng bộ
hoàn tất, đảm bảo mỗi phiên chỉ được gửi đúng 1 lần cho mỗi lượt kích
hoạt.

****Thách thức 2: Lỗi 404 khi gọi Google Apps Script Web App****

Khi mới deploy, các request `fetch POST` tới Apps Script trả về lỗi
404 kèm nội dung HTML thay vì JSON (`Unexpected token '<'... is not
valid JSON`). Nguyên nhân là cấu hình quyền truy cập ("Who has access")
của bản triển khai (deployment) mặc định là "Chỉ mình tôi" thay vì "Bất
kỳ ai" (Anyone), khiến request không có phiên đăng nhập Google bị chặn.

Giải pháp: chỉnh lại quyền truy cập của deployment thành "Anyone",
tạo lại deployment (New deployment/New version), và cập nhật đúng URL
Web App mới vào `APPS_SCRIPT_URL` trong `main.js`.

****Thách thức 3: Request `fetch POST` bị chặn bởi CORS
preflight****

Khi gửi `fetch` tới Apps Script Web App với header mặc định
`Content-Type: application/json`, trình duyệt tự động gửi một request
`OPTIONS` (preflight) trước --- nhưng Apps Script Web App không xử lý
được method `OPTIONS`, khiến request preflight thất bại và request
`POST` thật sự không bao giờ được gửi đi.

Giải pháp: đổi header của `fetch` thành `Content-Type:
text/plain`. Đây là loại header nằm trong danh sách "simple request"
theo chuẩn CORS, nên trình duyệt bỏ qua bước preflight và gửi thẳng
`POST`. Phía backend (`doPost`) vẫn
`JSON.parse(e.postData.contents)` bình thường vì nội dung body thực
chất vẫn là chuỗi JSON, chỉ khác header khai báo.

## PHỤ LỤC A --- Mã nguồn Google Apps Script (Backend đồng bộ)

Toàn bộ mã nguồn `doPost(e)` và hàm phụ trợ
`getOrCreateFolder(name)`, được deploy trực tiếp trong Apps Script gắn
với Google Sheet đích (không nằm trong repo frontend):

```javascript

function doPost(e) {

  try {

    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var sheet = ss.getSheetByName('Sessions') ||
ss.insertSheet('Sessions');

    // Tạo dòng tiêu đề nếu sheet còn trống

    if (sheet.getLastRow() === 0) {

      sheet.appendRow([

        'ID',

        'Người phỏng vấn',

        'Thời gian phỏng vấn',

        'Địa điểm',

        'Tên người được PV',

        'Lớp / Khối',

        'Câu hỏi & Trả lời',

        'Ảnh hiện trường (link)',

        'Thời điểm đồng bộ',

      ]);

    }

    // Tải ảnh (base64) lên Google Drive, lấy link xem công khai

    var photoLinks = [];

    if (data.photos && data.photos.length > 0) {

      var folder = getOrCreateFolder('VKU_Interview_Photos');

      data.photos.forEach(function (base64, idx) {

        var parts = base64.split(',');

        var mime = (parts[0].match(/data:(.*);base64/) ||
[])[1] || 'image/jpeg';

        var blob = Utilities.newBlob(

          Utilities.base64Decode(parts[1]),

          mime,

          data.id + '_' + idx + '.jpg'

        );

        var file = folder.createFile(blob);

        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,
DriveApp.Permission.VIEW);

        photoLinks.push(file.getUrl());

      });

    }

    // Ghép câu hỏi & câu trả lời thành 1 khối text dễ đọc

    var qaText = (data.answers || [])

      .map(function (qa) {

        return 'H:' + qa.question + '\nĐ{=tex}:' + (qa.answer ||
'(bỏ trống)');

      })

      .join('\n{=tex}\n{=tex}');

    sheet.appendRow([

      data.id,

      data.interviewerName,

      data.interviewTime,

      data.location,

      data.intervieweeName,

      data.intervieweeClass,

      qaText,

      photoLinks.join(','),

      new Date().toISOString(),

    ]);

    return ContentService.createTextOutput(

      JSON.stringify({ status: 'ok' })

    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {

    return ContentService.createTextOutput(

      JSON.stringify({ status: 'error', message: err.message })

    ).setMimeType(ContentService.MimeType.JSON);

  }

}

function getOrCreateFolder(name) {

  var folders = DriveApp.getFoldersByName(name);

  return folders.hasNext() ? folders.next() :
DriveApp.createFolder(name);

}

```