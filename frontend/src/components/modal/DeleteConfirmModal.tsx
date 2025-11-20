import { DeleteConfirmModalProps } from '@/types'

export default function DeleteConfirmModal({
  isOpen,
  selectedCount,
  selectedItems,
  files,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal confirm-modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Confirm Delete</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="confirm-icon">⚠️</div>
          <div className="confirm-message">
            {selectedCount === 1 
              ? 'Are you sure you want to delete this item?' 
              : `Are you sure you want to delete ${selectedCount} items?`}
          </div>
          <div className="confirm-details">
            {selectedItems.map(i => {
              const file = files[i]
              return (
                <div key={i} className="confirm-file-item">
                  {file.isDir ? '📁' : '📄'} {file.name}
                </div>
              )
            })}
          </div>
          <p style={{ marginTop: '16px', color: '#dc3545', fontSize: '14px', textAlign: 'center' }}>
            <strong>This action cannot be undone!</strong>
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}