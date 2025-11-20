'use client'
import { useState } from 'react'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FileItem {
  name: string
  isDir: boolean
  size: number
  mtime: number
}

const ContextMenu = () => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [contextTarget, setContextTarget] = useState<number | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0, show: false })
  const [currentPath, setCurrentPath] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Modal states
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Form states
  const [renameName, setRenameName] = useState('')
  const [movePath, setMovePath] = useState('')
  const [copyPath, setCopyPath] = useState('')
  const [copyNewName, setCopyNewName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [currentRenameFile, setCurrentRenameFile] = useState('')
  const [currentMoveFile, setCurrentMoveFile] = useState('')
  const [currentCopyFile, setCurrentCopyFile] = useState('')
  const [currentEditFile, setCurrentEditFile] = useState('')

  // Progress bar
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [progressOperation, setProgressOperation] = useState<'upload' | 'delete'>('upload')
  const [progressFileName, setProgressFileName] = useState('')

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

  const showError = (msg: string) => toast.error(msg)
  const showSuccess = (msg: string) => toast.success(msg)

  // Path generator
  const getFilePath = (name: string) => {
    return currentPath ? `${currentPath}/${name}` : name
  }

  // Load files
  const loadFiles = async (path: string = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/list?path=${encodeURIComponent(path)}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setFiles(data.items || [])
      setCurrentPath(path)
      setSelected(new Set())
    } catch (e: any) {
      showError(e.message)
    }
  }

  // Edit file
  const editFile = async (index: number) => {
    const file = files[index]
    if (file.isDir) return

    try {
      const res = await fetch(`${API_BASE}/api/file?path=${encodeURIComponent(getFilePath(file.name))}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      setEditTitle(`Edit: ${file.name}`)
      setEditContent(data.content)
      setCurrentEditFile(file.name)
      setEditModalOpen(true)
    } catch (e: any) {
      showError(e.message)
    }
  }

  // Double click
  const handleDoubleClick = (index: number) => {
    const file = files[index]
    if (file.isDir) loadFiles(getFilePath(file.name))
    else editFile(index)
  }

  // Download
  const downloadSelected = () => {
    if (selected.size !== 1) return
    const index = [...selected][0]
    const file = files[index]
    if (file.isDir) return

    window.open(
      `${API_BASE}/api/download?path=${encodeURIComponent(getFilePath(file.name))}`,
      '_blank'
    )
  }

  // Rename prep
  const renameSelected = () => {
    if (selected.size !== 1) return
    const idx = [...selected][0]
    const file = files[idx]
    setRenameName(file.name)
    setCurrentRenameFile(file.name)
    setRenameModalOpen(true)
  }

  // Delete
  const deleteSelected = () => {
    if (selected.size === 0) return
    setDeleteConfirmModalOpen(true)
  }

  const confirmDelete = async () => {
    if (selected.size === 0) return

    setShowProgressBar(true)
    setProgressOperation('delete')
    setProgressMessage(`Deleting ${selected.size} item(s)...`)

    try {
      const selectedArray = [...selected]

      for (let i = 0; i < selectedArray.length; i++) {
        const idx = selectedArray[i]
        const file = files[idx]
        setProgressFileName(file.name)
        setProgressValue(Math.round(((i + 1) / selectedArray.length) * 100))

        const res = await fetch(`${API_BASE}/api/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: getFilePath(file.name) })
        })

        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }

      showSuccess('Deleted successfully')
      setDeleteConfirmModalOpen(false)

      loadFiles(currentPath)
    } catch (e: any) {
      showError(e.message)
    } finally {
      setShowProgressBar(false)
      setProgressValue(0)
    }
  }

  return (
    <>
      {/* CONTEXT MENU */}
      {contextMenuPos.show && contextTarget !== null && (
        <div
          className="context-menu"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <div
            className="context-menu-item"
            onClick={() => {
              handleDoubleClick(contextTarget)
              setContextMenuPos({ ...contextMenuPos, show: false })
            }}
          >
            📂 Open
          </div>

          <div
            className="context-menu-item"
            onClick={() => {
              editFile(contextTarget)
              setContextMenuPos({ ...contextMenuPos, show: false })
            }}
          >
            ✏️ Edit
          </div>

          <div className="context-menu-separator" />

          <div
            className="context-menu-item"
            onClick={() => {
              setCurrentMoveFile(files[contextTarget].name)
              setMovePath('')
              setMoveModalOpen(true)
              setContextMenuPos({ ...contextMenuPos, show: false })
            }}
          >
            ➡️ Move
          </div>

          <div
            className="context-menu-item"
            onClick={() => {
              setCurrentCopyFile(files[contextTarget].name)
              setCopyPath('')
              setCopyNewName('')
              setCopyModalOpen(true)
              setContextMenuPos({ ...contextMenuPos, show: false })
            }}
          >
            📋 Copy
          </div>

          <div
            className="context-menu-item"
            onClick={() => {
              setSelected(new Set([contextTarget]))
              renameSelected()
              setContextMenuPos({ ...contextMenuPos, show: false })
            }}
          >
            ✏️ Rename
          </div>

          <div className="context-menu-separator" />

          <div
            className="context-menu-item"
            onClick={() => {
              setSelected(new Set([contextTarget]))
              downloadSelected()
              setContextMenuPos({ ...contextMenuPos, show: false })
            }}
          >
            ⬇️ Download
          </div>

          <div
            className="context-menu-item danger"
            onClick={() => {
              setSelected(new Set([contextTarget]))
              deleteSelected()
              setContextMenuPos({ ...contextMenuPos, show: false })
            }}
          >
            🗑️ Delete
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmModalOpen && (
        <div className="modal confirm-modal show">
          <div className="modal-content">
            <h3>Confirm Delete</h3>

            <div className="confirm-message">
              Are you sure you want to delete these items?
            </div>

            {[...selected].map((i) => (
              <div key={i}>
                {files[i].isDir ? '📁 ' : '📄 '}
                {files[i].name}
              </div>
            ))}

            <div className="modal-footer">
              <button onClick={() => setDeleteConfirmModalOpen(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ContextMenu
