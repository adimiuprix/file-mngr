import { CompressModalProps } from '@/types'

export default function CompressModal({
  isOpen,
  currentItems,
  onClose,
  onOutputChange,
  onCompress,
  outputName,
  itemCount
}: CompressModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>🗜️ Compress {itemCount > 1 ? 'Items' : 'Item'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {/* ✅ Show list of items to compress */}
          <div className="form-group">
            <label>
              {itemCount === 1 ? 'Item to Compress' : `Items to Compress (${itemCount})`}
            </label>
            
            {itemCount === 1 ? (
              <input 
                type="text" 
                className="form-control" 
                value={currentItems[0]}
                disabled
                style={{ background: '#f8f9fa', color: '#666' }}
              />
            ) : (
              <div 
                className="confirm-details" 
                style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '8px' }}
              >
                {currentItems.map((item, idx) => (
                  <div key={idx} className="confirm-file-item">
                    📦 {item}
                  </div>
                ))}
              </div>
            )}
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
              Supported formats: .zip, .tar, .tar.gz, .7z
            </small>
          </div>

          <div style={{ 
            background: '#e7f3ff', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '13px',
            marginTop: '15px'
          }}>
            <strong>ℹ️ Info:</strong> 
            {itemCount === 1 
              ? ' The item will be compressed into a single archive.' 
              : ` All ${itemCount} items will be compressed into a single archive.`}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onCompress}>
            🗜️ Compress {itemCount > 1 && `(${itemCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}