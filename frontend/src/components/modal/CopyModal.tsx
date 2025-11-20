import { CopyModalProps } from '@/types'

export default function CopyModal({
  isOpen,
  path,
  newName,
  onClose,
  onPathChange,
  onNewNameChange,
  onCopy
}: CopyModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Copy To</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Destination Path</label>
            <input 
              type="text" 
              className="form-control" 
              value={path} 
              onChange={(e) => onPathChange(e.target.value)} 
              placeholder="folder/subfolder" 
            />
          </div>
          <div className="form-group">
            <label>New Name (optional)</label>
            <input 
              type="text" 
              className="form-control" 
              value={newName} 
              onChange={(e) => onNewNameChange(e.target.value)} 
              placeholder="Leave empty to keep same name" 
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onCopy}>Copy</button>
        </div>
      </div>
    </div>
  )
}