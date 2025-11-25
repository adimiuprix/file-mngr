export interface FileItem {
    name: string
    type: string
    isDir: boolean
    size: number
    mtime: number
}

export interface ProgressBarProps {
  progress: number;
  isVisible: boolean;
  operationType: 'upload' | 'delete';
  fileName?: string;
  message?: string;
}

export interface ToolbarProps {
  onToggleSidebar: () => void
  onGoUp: () => void
  onRefresh: () => void
  onUpload: () => void
  onNewFile: () => void
  onNewFolder: () => void
  onEdit: () => void
  onRename: () => void
  onDownload: () => void
  onDelete: () => void
  onExtract: () => void
  onCompress: () => void
  singleFile: boolean
  single: boolean
  count: number
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
  onExtract: (index: number) => void
}

export interface DropZoneProps {
  isVisible: boolean
}

export interface DeleteConfirmModalProps {
  isOpen: boolean
  selectedCount: number
  selectedItems: number[]
  files: FileItem[]
  onClose: () => void
  onConfirm: () => void
}

export interface CopyModalProps {
  isOpen: boolean
  path: string
  newName: string
  onClose: () => void
  onPathChange: (value: string) => void
  onNewNameChange: (value: string) => void
  onCopy: () => void
}

export interface MoveModalProps {
  isOpen: boolean
  path: string
  onClose: () => void
  onPathChange: (value: string) => void
  onMove: () => void
}

export interface RenameModalProps {
  isOpen: boolean
  name: string
  onClose: () => void
  onNameChange: (value: string) => void
  onRename: () => void
}

export interface EditModalProps {
  isOpen: boolean
  title: string
  content: string
  onClose: () => void
  onContentChange: (value: string) => void
  onSave: () => void
}

export interface NewFileModalProps {
  isOpen: boolean
  fileName: string
  fileContent: string
  onClose: () => void
  onFileNameChange: (value: string) => void
  onFileContentChange: (value: string) => void
  onCreate: () => void
}

export interface FolderModalProps {
  isOpen: boolean
  folderName: string
  onClose: () => void
  onFolderNameChange: (value: string) => void
  onCreate: () => void
}

export interface UploadModalProps {
  isOpen: boolean
  uploadFiles: File[]
  onClose: () => void
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
  formatSize: (bytes: number) => string
}

export interface CompressModalProps {
  isOpen: boolean
  currentItem: string
  onClose: () => void
  onOutputChange: (value: string) => void
  onCompress: () => void
  outputName: string
}