import api from '../services/api'

export async function downloadConversion(conversion) {
  const response = await api.get(`/files/download/${conversion._id}`, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(response.data)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = conversion.outputFile?.originalName || conversion.outputFile?.filename || 'fileforge-download'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}
