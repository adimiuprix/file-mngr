import { RenameModalProps } from '@/types'

export default function RenameModal({
  isOpen,
  name,
  onClose,
  onNameChange,
  onRename
}: RenameModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Rename</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>New Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={name} 
              onChange={(e) => onNameChange(e.target.value)} 
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onRename}>Rename</button>
        </div>
      </div>
    </div>
  )
}