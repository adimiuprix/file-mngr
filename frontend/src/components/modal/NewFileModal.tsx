import { NewFileModalProps } from '@/types'

export default function NewFileModal({
  isOpen,
  fileName,
  fileContent,
  onClose,
  onFileNameChange,
  onFileContentChange,
  onCreate
}: NewFileModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>New File</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>File Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={fileName} 
              onChange={(e) => onFileNameChange(e.target.value)} 
              placeholder="example.txt" 
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea 
              className="form-control" 
              value={fileContent} 
              onChange={(e) => onFileContentChange(e.target.value)}
            ></textarea>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onCreate}>Create</button>
        </div>
      </div>
    </div>
  )
}