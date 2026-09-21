import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

// Kiểm tra đang chạy trong app Android/iOS thật (qua Capacitor) hay chỉ là trình duyệt web thường
export function isNativeApp() {
  return Capacitor.isNativePlatform()
}
// Chụp ảnh bằng camera app thật, tự động lưu 1 bản vào Gallery của điện thoại
export async function capturePhotoNative() {
  const photo = await Camera.getPhoto({
    quality: 80,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    saveToGallery: true // ← chính là dòng quyết định việc ảnh có vào Gallery hay không
  })

  const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpeg`
  await Filesystem.writeFile({
    path: `survey-photos/${fileName}`,
    data: photo.base64String,
    directory: Directory.Data,
    recursive: true
  })

  return { type: 'native', path: `survey-photos/${fileName}` }
}


// Chuyển File (từ <input type="file">) thành base64 dataURL
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Lưu 1 ảnh, tự chọn cách lưu phù hợp với môi trường đang chạy:
 * - App Android thật (Capacitor native): ghi file vào bộ nhớ riêng của app (Directory.Data)
 *   qua Filesystem API, trả về { type: 'native', path }
 * - Web thường (trình duyệt): giữ nguyên base64 dataURL, trả về { type: 'base64', data }
 */
export async function savePhoto(file) {
  const base64 = await fileToBase64(file)

  if (isNativeApp()) {
    const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpeg`
    // Filesystem cần base64 THUẦN, không có phần "data:image/jpeg;base64," ở đầu
    const base64Data = base64.split(',')[1]

    await Filesystem.writeFile({
      path: `survey-photos/${fileName}`,
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    })

    return { type: 'native', path: `survey-photos/${fileName}` }
  }

  // Môi trường web thường: giữ cách cũ, lưu thẳng base64 vào IndexedDB
  return { type: 'base64', data: base64 }
}

/**
 * Lấy URL có thể gán vào thẻ <img src="..."> từ 1 ảnh đã lưu,
 * bất kể ảnh đó được lưu kiểu native hay base64.
 */
export async function getPhotoSrc(photo) {
  if (!photo) return ''
  if (photo.type === 'base64') return photo.data

  if (photo.type === 'native') {
    const result = await Filesystem.getUri({
      path: photo.path,
      directory: Directory.Data
    })
    return Capacitor.convertFileSrc(result.uri)
  }

  return ''
}

// Xóa 1 ảnh đã lưu native khỏi bộ nhớ máy (dùng khi người dùng bỏ ảnh trước khi submit)
export async function deletePhoto(photo) {
  if (photo?.type === 'native') {
    try {
      await Filesystem.deleteFile({ path: photo.path, directory: Directory.Data })
    } catch (e) {
      console.warn('Không xóa được file ảnh:', e)
    }
  }
}

/**
 * Đọc nội dung ảnh ra base64 để GỬI LÊN SERVER khi đồng bộ.
 * - Ảnh kiểu 'base64' (lưu trên web) đã sẵn base64, trả về luôn.
 * - Ảnh kiểu 'native' (lưu file trên máy) cần đọc lại nội dung file qua Filesystem.readFile.
 */
export async function getPhotoBase64ForUpload(photo) {
  if (!photo) return null
  if (photo.type === 'base64') return photo.data

  if (photo.type === 'native') {
    const result = await Filesystem.readFile({ path: photo.path, directory: Directory.Data })
    // readFile trả về base64 thuần, thêm lại phần đầu để thành dataURL chuẩn
    return `data:image/jpeg;base64,${result.data}`
  }

  return null
}