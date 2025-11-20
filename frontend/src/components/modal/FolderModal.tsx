import { FolderModalProps } from '@/types'

export default function FolderModal({
  isOpen,
  folderName,
  onClose,
  onFolderNameChange,
  onCreate
}: FolderModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h3>New Folder</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Folder Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={folderName} 
              onChange={(e) => onFolderNameChange(e.target.value)} 
              placeholder="Enter folder name" 
            />
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