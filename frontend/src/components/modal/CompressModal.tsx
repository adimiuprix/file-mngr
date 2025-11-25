import { CompressModalProps } from '@/types'

export default function CompressModal({
  isOpen,
  currentItem,
  onClose,
  onOutputChange,
  onCompress,
  outputName
}: CompressModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>🗜️ Compress Item</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Item to Compress</label>
            <input 
              type="text" 
              className="form-control" 
              value={currentItem}
              disabled
              style={{ background: '#f8f9fa', color: '#666' }}
            />
          </div>

          <div className="form-group">
            <label>Output Archive Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={outputName}
              onChange={(e) => onOutputChange(e.target.value)}
              placeholder="archive.zip"
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
              Supported formats: .zip
            </small>
          </div>

          <div style={{ 
            background: '#e7f3ff', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '15px'
          }}>
            <strong>ℹ️ Info:</strong> The compressed file will be created in the current directory.
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onCompress}>
            🗜️ Compress
          </button>
        </div>
      </div>
    </div>
  )
}