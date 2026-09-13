import './style.css'
import { addRecord, getAllRecords, getPendingRecords, markSynced } from './db.js'

// ⚠️ Thay bằng API thật của bạn (Firebase, Supabase, Google Sheet Web App, v.v.)
// Nếu chưa có backend, hàm mockSync() bên dưới sẽ giả lập kết quả thành công
const API_ENDPOINT = '/api/survey'

const form = document.getElementById('survey-form')
const list = document.getElementById('records-list')
const netStatus = document.getElementById('net-status')
const syncBtn = document.getElementById('sync-btn')

// ---------- Hiển thị trạng thái mạng ----------
function updateNetStatus() {
  const online = navigator.onLine
  netStatus.textContent = online ? 'Đang online' : 'Offline'
  netStatus.className = 'badge ' + (online ? 'online' : 'offline')
}
window.addEventListener('online', () => { updateNetStatus(); syncPending() })
window.addEventListener('offline', updateNetStatus)
updateNetStatus()

// ---------- Xử lý ảnh chụp thành Blob để lưu vào IndexedDB ----------
function fileToBlob(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null)
    resolve(file) // File object tự thân đã là Blob, IndexedDB lưu trực tiếp được
  })
}

// ---------- Submit form ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const fd = new FormData(form)
  const photoFile = fd.get('photo')
  const photoBlob = await fileToBlob(photoFile && photoFile.size > 0 ? photoFile : null)

  await addRecord({
    building: fd.get('building'),
    category: fd.get('category'),
    condition: fd.get('condition'),
    notes: fd.get('notes'),
    surveyor: fd.get('surveyor'),
    photo: photoBlob
  })

  form.reset()
  await renderRecords()

  if (navigator.onLine) syncPending()
})

// ---------- Render danh sách phiếu ----------
async function renderRecords() {
  const records = await getAllRecords()
  list.innerHTML = ''

  updateStats(records)

  if (records.length === 0) {
    list.innerHTML = '<li class="hint">Chưa có phiếu khảo sát nào.</li>'
    return
  }

  for (const r of records) {
    const li = document.createElement('li')
    li.className = 'record-item'
    li.innerHTML = `
      <span>${r.building} — ${r.condition} <br><small>${new Date(r.createdAt).toLocaleString('vi-VN')}</small></span>
      <span class="status-pill status-${r.status}">${r.status === 'pending' ? 'Chờ đồng bộ' : 'Đã đồng bộ'}</span>
    `
    list.appendChild(li)
  }
}

// Cập nhật 3 ô thống kê ở đầu trang
function updateStats(records) {
  const pendingEl = document.getElementById('stat-pending')
  const syncedEl = document.getElementById('stat-synced')
  const brokenEl = document.getElementById('stat-broken')
  if (!pendingEl) return

  pendingEl.textContent = records.filter(r => r.status === 'pending').length
  syncedEl.textContent = records.filter(r => r.status === 'synced').length
  brokenEl.textContent = records.filter(r => r.condition === 'hong' || r.condition === 'can_sua').length
}
// ---------- Đồng bộ dữ liệu lên server khi có mạng ----------
async function syncPending() {
  if (!navigator.onLine) return
  const pending = await getPendingRecords()

  for (const record of pending) {
    try {
      await mockSync(record) // đổi thành gọi API thật khi bạn có backend
      await markSynced(record.id)
    } catch (err) {
      console.warn('Sync thất bại, sẽ thử lại sau:', err)
      break // dừng để lần sau (online lại) thử tiếp, tránh spam lỗi
    }
  }
  await renderRecords()
}

// Giả lập gọi API thành công — THAY bằng fetch(API_ENDPOINT, {...}) thật khi triển khai
async function mockSync(record) {
  return new Promise((resolve) => setTimeout(resolve, 300))
}

// Đăng ký Background Sync nếu trình duyệt hỗ trợ (Chrome/Android)
async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready
      await reg.sync.register('sync-survey-records')
    } catch (e) {
      console.log('Background Sync không khả dụng, dùng fallback online-event.')
    }
  }
}

syncBtn.addEventListener('click', syncPending)

// Khởi động
renderRecords()
registerBackgroundSync()
if (navigator.onLine) syncPending()
