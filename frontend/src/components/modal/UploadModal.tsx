import { UploadModalProps } from '@/types'

export default function UploadModal({
  isOpen,
  uploadFiles,
  onClose,
  onFileInputChange,
  onUpload,
  formatSize
}: UploadModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Upload Files</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <input type="file" id="fileInput" multiple onChange={onFileInputChange} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => document.getElementById('fileInput')?.click()}>Choose Files</button>
          <div style={{ marginTop: '15px' }}>
            {uploadFiles.map((f, i) => (
              <div key={i}>📄 {f.name} ({formatSize(f.size)})</div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onUpload}>Upload</button>
        </div>
      </div>
    </div>
  )
}