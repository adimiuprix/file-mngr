import { EditModalProps } from '@/types'

export default function EditModal({
  isOpen,
  title,
  content,
  onClose,
  onContentChange,
  onSave
}: EditModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <textarea 
            className="form-control" 
            value={content} 
            onChange={(e) => onContentChange(e.target.value)}
          ></textarea>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}