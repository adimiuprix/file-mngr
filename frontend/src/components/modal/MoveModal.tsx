import { MoveModalProps } from '@/types'

export default function MoveModal({
  isOpen,
  path,
  onClose,
  onPathChange,
  onMove
}: MoveModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Move To</h3>
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
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onMove}>Move</button>
        </div>
      </div>
    </div>
  )
}