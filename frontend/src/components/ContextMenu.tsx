import { ContextMenuProps } from '@/types'

export default function ContextMenu({
  show,
  x,
  y,
  contextTarget,
  files,
  onClose,
  onOpen,
  onEdit,
  onMove,
  onCopy,
  onRename,
  onDownload,
  onDelete,
  onExtract,
  onCompress
}: ContextMenuProps) {
  if (!show || contextTarget === null) return null

  // Kalkulasi posisi agar tidak keluar layar
  const menuWidth = 200
  const menuHeight = 280 // Perkiraan tinggi menu
  const padding = 100

  let adjustedX = x
  let adjustedY = y

  // Cek apakah menu keluar dari kanan layar
  if (x + menuWidth > window.innerWidth) {
    adjustedX = window.innerWidth - menuWidth - padding
  }

  // Cek apakah menu keluar dari bawah layar
  if (y + menuHeight > window.innerHeight) {
    adjustedY = window.innerHeight - menuHeight - padding
  }

  // Cek apakah menu keluar dari kiri layar
  if (adjustedX < padding) {
    adjustedX = padding
  }

  // Cek apakah menu keluar dari atas layar
  if (adjustedY < padding) {
    adjustedY = padding
  }

  return (
    <div
      className="context-menu"
      style={{
        left: adjustedX,
        top: adjustedY,
        display: 'block'
      }}
    >
      <div className="context-menu-item" onClick={() => { onOpen(contextTarget); onClose() }}>
        <span className="context-menu-icon">📂</span>
        <span>Open</span>
      </div>
      <div className="context-menu-item" onClick={() => { onEdit(contextTarget); onClose() }}>
        <span className="context-menu-icon">✏️</span>
        <span>Edit</span>
      </div>
      <div className="context-menu-separator"></div>
      <div className="context-menu-item" onClick={() => {
        onMove(files[contextTarget].name)
        onClose()
      }}>
        <span className="context-menu-icon">➡️</span>
        <span>Move</span>
      </div>
      <div className="context-menu-item" onClick={() => {
        onCopy(files[contextTarget].name)
        onClose()
      }}>
        <span className="context-menu-icon">📋</span>
        <span>Copy</span>
      </div>
      <div className="context-menu-item" onClick={() => {
        onRename(contextTarget)
        onClose()
      }}>
        <span className="context-menu-icon">✏️</span>
        <span>Rename</span>
      </div>
      <div className="context-menu-separator"></div>
      <div className="context-menu-item" onClick={() => {
        onDownload(contextTarget)
        onClose()
      }}>
        <span className="context-menu-icon">⬇️</span>
        <span>Download</span>
      </div>
      <div className="context-menu-item" onClick={() => {
        onExtract(contextTarget)
        onClose()
      }}>
        <span className="context-menu-icon">📦</span>
        <span>Extract</span>
      </div>
      <div className="context-menu-item" onClick={() => {
        onCompress(contextTarget)
        onClose()
      }}>
        <span className="context-menu-icon">🗜️</span>
        <span>Compress</span>
      </div>
      <div className="context-menu-separator"></div>
      <div className="context-menu-item danger" onClick={() => {
        onDelete(contextTarget)
        onClose()
      }}>
        <span className="context-menu-icon">🗑️</span>
        <span>Delete</span>
      </div>
    </div>
  )
}