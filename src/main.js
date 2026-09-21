import './style.css';
import {
  addSession,
  getAllSessions,
  getPendingSessions,
  markSessionSynced,
} from './db.js';
import {
  savePhoto,
  getPhotoSrc,
  deletePhoto,
  getPhotoBase64ForUpload,
  isNativeApp,
  capturePhotoNative,
} from './photoStorage.js';

// ============================================================
// CẤU HÌNH — thay URL này bằng URL Web App sau khi deploy Apps Script
// (xem file HUONG_DAN_TICH_HOP.md)
// ============================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeh1-LwbjrXRa94HrwvMJz8CExHBJRW7gkeng0pa-RjUwnvnXUMvWGJ98mRb-VufA5/exec';

// Bộ câu hỏi cố định — khảo sát bạo lực học đường
export const QUESTIONS = [
  'Bạn đã từng chứng kiến hoặc nghe về vụ việc bạo lực học đường nào tại trường/lớp mình chưa? Nếu có, hãy mô tả sơ lược.',
  'Theo bạn, hình thức bạo lực học đường phổ biến nhất hiện nay là gì? (thể chất, lời nói, mạng xã hội...)',
  'Nguyên nhân chính dẫn đến bạo lực học đường theo bạn là gì?',
  'Khi chứng kiến hoặc là nạn nhân, học sinh thường phản ứng như thế nào?',
  'Nhà trường / giáo viên đã có biện pháp xử lý ra sao khi xảy ra vụ việc?',
  'Theo bạn, học sinh có dễ dàng chia sẻ / báo cáo với thầy cô hoặc gia đình khi gặp bạo lực học đường không? Vì sao?',
  'Bạn có đề xuất gì để giảm thiểu tình trạng bạo lực học đường tại trường mình?',
  'Bạn đánh giá mức độ nghiêm trọng của vấn đề này tại trường mình như thế nào? (thang điểm 1-5, 5 là rất nghiêm trọng)',
];

let currentPhotos = []; // ref ảnh (base64 hoặc native path) của phiên đang nhập

// ------------------------------------------------------------
// KHỞI TẠO GIAO DIỆN
// ------------------------------------------------------------
function renderQuestionForm() {
  const container = document.getElementById('qa-container');
  container.innerHTML = QUESTIONS.map(
    (q, i) => `
    <div class="qa-block full-row">
      <label>Câu ${i + 1}: ${q}</label>
      <textarea name="answer-${i}" rows="2" placeholder="Câu trả lời..."></textarea>
    </div>
  `
  ).join('');
}

function initNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = {
    'nav-form': 'survey-section',
    'nav-history': 'history-section',
    'nav-sync': 'sync-section',
  };
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
      Object.values(sections).forEach((id) => {
        document.getElementById(id).style.display = 'none';
      });
      document.getElementById(sections[item.id]).style.display = 'grid';
      if (item.id === 'nav-history') renderHistory();
    });
  });
}

// ------------------------------------------------------------
// ẢNH HIỆN TRƯỜNG
// ------------------------------------------------------------
function initPhotoInput() {
  const input = document.getElementById('photo-input');
  const preview = document.getElementById('photo-preview');

  async function renderPhotoPreview() {
    // Lấy trước URL hiển thị của từng ảnh (bất kể lưu kiểu nào)
    const srcs = await Promise.all(currentPhotos.map(getPhotoSrc));

    preview.innerHTML = srcs
      .map(
        (src, i) => `
        <div class="photo-thumb">
          <img src="${src}" alt="Ảnh hiện trường ${i + 1}" />
          <button type="button" class="photo-remove" data-index="${i}">×</button>
        </div>`
      )
      .join('');

    preview.querySelectorAll('.photo-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.index);
        await deletePhoto(currentPhotos[idx]); // dọn file trên máy nếu là ảnh native
        currentPhotos.splice(idx, 1);
        renderPhotoPreview();
      });
    });
  }

  // App Android thật: chặn input file mặc định, dùng Camera plugin native
  // (mở camera thật của máy + tự lưu 1 bản vào thư viện ảnh Gallery)
  input.addEventListener('click', async (e) => {
    if (!isNativeApp()) return; // web thường: để input hoạt động bình thường

    e.preventDefault();
    try {
      const photoRef = await capturePhotoNative();
      currentPhotos.push(photoRef);
      await renderPhotoPreview();
    } catch (err) {
      console.warn('Người dùng huỷ chụp ảnh hoặc lỗi camera:', err);
    }
  });

  // Web thường (trình duyệt, chưa đóng gói app): giữ nguyên cách cũ qua <input type="file">
  input.addEventListener('change', async (e) => {
    if (isNativeApp()) return; // native đã xử lý ở sự kiện click phía trên

    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const photoRef = await savePhoto(file);
      currentPhotos.push(photoRef);
    }
    await renderPhotoPreview();
    input.value = '';
  });
}

// ------------------------------------------------------------
// LƯU PHIÊN PHỎNG VẤN (OFFLINE-FIRST)
// ------------------------------------------------------------
function initForm() {
  const form = document.getElementById('survey-section');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const answers = QUESTIONS.map((q, i) => ({
      question: q,
      answer: (fd.get(`answer-${i}`) || '').trim(),
    }));

    const session = {
      id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      interviewerName: fd.get('interviewerName'),
      interviewTime: fd.get('interviewTime') || new Date().toISOString(),
      location: fd.get('location'),
      intervieweeName: fd.get('intervieweeName'),
      intervieweeClass: fd.get('intervieweeClass'),
      answers,
      photos: [...currentPhotos],
      synced: false,
      createdAt: Date.now(),
    };

    await addSession(session);

    form.reset();
    currentPhotos = [];
    document.getElementById('photo-preview').innerHTML = '';
    setDefaultTime();

    showToast('Đã lưu phiên phỏng vấn trên máy ✔');
    await refreshStats();

    // nếu đang online thì thử đồng bộ ngay
    if (navigator.onLine) syncPendingSessions();
  });
}

function setDefaultTime() {
  const timeInput = document.getElementById('interview-time');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  timeInput.value = now.toISOString().slice(0, 16);
}

// ------------------------------------------------------------
// LỊCH SỬ CÁC PHIÊN
// ------------------------------------------------------------
async function renderHistory() {
  const list = document.getElementById('history-list');
  const sessions = await getAllSessions();

  if (sessions.length === 0) {
    list.innerHTML = `<li class="hint">Chưa có phiên phỏng vấn nào.</li>`;
    return;
  }

  // Resolve trước URL hiển thị cho toàn bộ ảnh của mọi phiên (native hoặc base64)
  const sessionsWithPhotoSrcs = await Promise.all(
    sessions.map(async (s) => ({
      ...s,
      photoSrcs: s.photos && s.photos.length ? await Promise.all(s.photos.map(getPhotoSrc)) : [],
    }))
  );

  list.innerHTML = sessionsWithPhotoSrcs
    .map(
      (s) => `
    <li class="record-item history-item">
      <div class="history-summary" data-id="${s.id}">
        <div>
          <strong>${escapeHtml(s.interviewerName || '(chưa rõ)')}</strong>
          — ${escapeHtml(s.location || '')}
          <div class="hint">${formatDate(s.interviewTime)} · PV: ${escapeHtml(
        s.intervieweeName || ''
      )} ${s.intervieweeClass ? '(' + escapeHtml(s.intervieweeClass) + ')' : ''}</div>
        </div>
        <span class="status-pill ${s.synced ? 'status-synced' : 'status-pending'}">
          ${s.synced ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
        </span>
      </div>
      <div class="history-detail" id="detail-${s.id}" style="display:none">
        ${s.answers
          .map(
            (qa) => `<p><strong>${escapeHtml(qa.question)}</strong><br/>${escapeHtml(
              qa.answer || '(bỏ trống)'
            )}</p>`
          )
          .join('')}
        ${
          s.photoSrcs.length
            ? `<div class="photo-preview">${s.photoSrcs
                .map((src) => `<img src="${src}" class="history-photo" />`)
                .join('')}</div>`
            : ''
        }
      </div>
    </li>`
    )
    .join('');

  list.querySelectorAll('.history-summary').forEach((el) => {
    el.addEventListener('click', () => {
      const detail = document.getElementById(`detail-${el.dataset.id}`);
      detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN');
}

// ------------------------------------------------------------
// ĐỒNG BỘ LÊN GOOGLE SHEETS
// ------------------------------------------------------------
let isSyncing = false;
async function syncPendingSessions() {
  if (isSyncing) {
    showToast('Đang đồng bộ, vui lòng đợi...', 'warn');
    return;
  }
  if (!navigator.onLine) {
    showToast('Đang offline — sẽ đồng bộ khi có mạng trở lại', 'warn');
    return;
  }
  if (APPS_SCRIPT_URL.includes('DÁN_URL')) {
    showToast('Chưa cấu hình Google Sheets — xem HUONG_DAN_TICH_HOP.md', 'warn');
    return;
  }

  isSyncing = true;
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) syncBtn.disabled = true;

  try {
    const pending = await getPendingSessions();
    if (pending.length === 0) {
      showToast('Không có phiên nào cần đồng bộ');
      return;
    }

    let successCount = 0;
    for (const session of pending) {
      try {
        // Đọc lại nội dung ảnh (kể cả ảnh lưu native trên máy) thành base64 để gửi lên server
        const photosBase64 = session.photos && session.photos.length
          ? await Promise.all(session.photos.map(getPhotoBase64ForUpload))
          : [];

        const payload = { ...session, photos: photosBase64 };

        const res = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' }, // tránh preflight CORS
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (result.status === 'ok') {
          await markSessionSynced(session.id);
          successCount++;
        }
      } catch (err) {
        console.error('Lỗi đồng bộ phiên', session.id, err);
      }
    }

    if (successCount > 0) {
      showToast(`Đã đồng bộ thành công ${successCount} phiên ✔`, 'success');
    } else {
      showToast('Đồng bộ thất bại, thử lại sau', 'warn');
    }

    await refreshStats();
    if (document.getElementById('history-section').style.display !== 'none') {
      renderHistory();
    }
  } finally {
    isSyncing = false;
    if (syncBtn) syncBtn.disabled = false;
  }
}

function initSyncButton() {
  document.getElementById('sync-btn').addEventListener('click', syncPendingSessions);
  window.addEventListener('online', () => {
    updateNetBadge();
    syncPendingSessions();
  });
  window.addEventListener('offline', updateNetBadge);
}

// ------------------------------------------------------------
// TRẠNG THÁI MẠNG + THỐNG KÊ
// ------------------------------------------------------------
function updateNetBadge() {
  const badge = document.getElementById('net-status');
  if (navigator.onLine) {
    badge.textContent = 'Đang online';
    badge.className = 'badge online';
  } else {
    badge.textContent = 'Đang offline';
    badge.className = 'badge offline';
  }
}

async function refreshStats() {
  const all = await getAllSessions();
  const pending = all.filter((s) => !s.synced).length;
  const synced = all.filter((s) => s.synced).length;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-synced').textContent = synced;
  document.getElementById('stat-total').textContent = all.length;
}

// ------------------------------------------------------------
// TOAST THÔNG BÁO
// ------------------------------------------------------------
let toastTimer = null;
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ------------------------------------------------------------
// KHỞI ĐỘNG APP
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  renderQuestionForm();
  initNav();
  initPhotoInput();
  initForm();
  initSyncButton();
  setDefaultTime();
  updateNetBadge();
  await refreshStats();
});


