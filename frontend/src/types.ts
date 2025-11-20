export interface FileItem {
    name: string
    type: string
    isDir: boolean
    size: number
    mtime: number
}

export interface ContextMenuProps {
  show: boolean
  x: number
  y: number
  contextTarget: number | null
  files: FileItem[]
  onClose: () => void
  onOpen: (index: number) => void
  onEdit: (index: number) => void
  onMove: (fileName: string) => void
  onCopy: (fileName: string) => void
  onRename: (index: number) => void
  onDownload: (index: number) => void
  onDelete: (index: number) => void
}