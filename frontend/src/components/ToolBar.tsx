import { ToolbarProps } from '@/types'

export default function ToolBar({
  onToggleSidebar,
  onGoUp,
  onRefresh,
  onUpload,
  onNewFile,
  onNewFolder,
  onEdit,
  onRename,
  onDownload,
  onDelete,
  singleFile,
  single,
  count
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button className="btn" onClick={onToggleSidebar}>☰ Tree</button>
      <button className="btn" onClick={onGoUp}>⬆️ Up</button>
      <button className="btn" onClick={onRefresh}>🔄 Refresh</button>
      <div className="divider"></div>
      <button className="btn btn-primary" onClick={onUpload}>⬆️ Upload</button>
      <button className="btn" onClick={onNewFile}>📄 New File</button>
      <button className="btn" onClick={onNewFolder}>📁 New Folder</button>
      <div className="divider"></div>
      <button className="btn" disabled={!singleFile} onClick={onEdit}>✏️ Edit</button>
      <button className="btn" disabled={!single} onClick={onRename}>✏️ Rename</button>
      <button className="btn" disabled={!singleFile} onClick={onDownload}>⬇️ Download</button>
      <button className="btn btn-danger" disabled={count === 0} onClick={onDelete}>🗑️ Delete</button>
    </div>
  )
}