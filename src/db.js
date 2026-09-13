import { openDB } from 'idb'

const DB_NAME = 'vku-survey-db'
const STORE_NAME = 'records'

// Mở (hoặc tạo mới) database IndexedDB.
// Đây là nơi dữ liệu được lưu thật sự trên máy, tồn tại kể cả khi tắt app / mất mạng.
export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        })
        store.createIndex('status', 'status')
      }
    }
  })
}

// Thêm một phiếu khảo sát mới, mặc định status = 'pending' (chưa đồng bộ)
export async function addRecord(record) {
  const db = await getDB()
  return db.add(STORE_NAME, {
    ...record,
    status: 'pending',
    createdAt: new Date().toISOString()
  })
}

// Lấy toàn bộ phiếu đã lưu, mới nhất lên trước
export async function getAllRecords() {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return all.reverse()
}

// Lấy các phiếu đang chờ đồng bộ
export async function getPendingRecords() {
  const db = await getDB()
  return db.getAllFromIndex(STORE_NAME, 'status', 'pending')
}

// Đánh dấu một phiếu là đã đồng bộ thành công
export async function markSynced(id) {
  const db = await getDB()
  const record = await db.get(STORE_NAME, id)
  if (!record) return
  record.status = 'synced'
  record.syncedAt = new Date().toISOString()
  await db.put(STORE_NAME, record)
}
