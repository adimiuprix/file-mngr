'use client'

import { useState, useEffect, useRef } from 'react'
import ProgressBar from '@/components/ProgressBar'
import Header from '@/components/Header'
import Breadcrumb from '@/components/Breadcrumb'
import DirectoryTree from '@/components/DirectoryTree'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { FileItem } from '@/types'

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [contextTarget, setContextTarget] = useState<number | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0, show: false })
  const [treeCache, setTreeCache] = useState<Record<string, FileItem[]>>({})
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [fileModalOpen, setFileModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false)

  // Form states
  const [folderName, setFolderName] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('Edit File')
  const [renameName, setRenameName] = useState('')
  const [movePath, setMovePath] = useState('')
  const [copyPath, setCopyPath] = useState('')
  const [copyNewName, setCopyNewName] = useState('')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])

  // Current editing file
  const [currentEditFile, setCurrentEditFile] = useState('')
  const [currentRenameFile, setCurrentRenameFile] = useState('')
  const [currentMoveFile, setCurrentMoveFile] = useState('')
  const [currentCopyFile, setCurrentCopyFile] = useState('')

  // Progress bar states
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [progressValue, setProgressValue] = useState(0)
  const [progressOperation, setProgressOperation] = useState<'upload' | 'delete'>('upload')
  const [progressFileName, setProgressFileName] = useState('')
  const [progressMessage, setProgressMessage] = useState('')

  // Drag and drop
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

  useEffect(() => {
    loadFiles()
    loadTree()

    const storedSidebar = localStorage.getItem('sidebarVisible')
    if (storedSidebar === 'false') {
      setSidebarVisible(false)
    }
  }, [])

  useEffect(() => {
    const handleClick = () => setContextMenuPos({ ...contextMenuPos, show: false })
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenuPos])

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

  const loadTree = async (path: string = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/list?path=${encodeURIComponent(path)}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      const folders = (data.items || []).filter((item: FileItem) => item.isDir)
      setTreeCache(prev => ({ ...prev, [path]: folders }))
    } catch (e) {
      console.error('Tree load error:', e)
    }
  }

  const toggleTreeFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
        if (!treeCache[path]) {
          loadTree(path)
        }
      }
      return newSet
    })
  }

  const handleRowClick = (e: React.MouseEvent, index: number) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelect(index)
    } else if (e.shiftKey && selected.size > 0) {
      const lastSelected = Math.max(...selected)
      const start = Math.min(lastSelected, index)
      const end = Math.max(lastSelected, index)
      const newSelected = new Set<number>()
      for (let i = start; i <= end; i++) {
        newSelected.add(i)
      }
      setSelected(newSelected)
    } else {
      setSelected(new Set([index]))
    }
  }

  const handleDoubleClick = (index: number) => {
    const file = files[index]
    if (file.isDir) {
      loadFiles(getFilePath(file.name))
    } else {
      editFile(index)
    }
  }

  const toggleSelect = (index: number) => {
    setSelected(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === files.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(files.map((_, i) => i)))
    }
  }

  const showContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setContextTarget(index)
    setContextMenuPos({ x: e.pageX, y: e.pageY, show: true })
  }

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

  const saveFile = async () => {
    const path = getFilePath(currentEditFile)

    try {
      const res = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content: editContent })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      showSuccess('File saved successfully')
      setEditModalOpen(false)
      loadFiles(currentPath)
    } catch (e: any) {
      showError(e.message)
    }
  }

  const editSelected = () => {
    if (selected.size === 1) {
      editFile([...selected][0])
    }
  }

  const renameSelected = () => {
    if (selected.size === 1) {
      const index = [...selected][0]
      const file = files[index]
      setRenameName(file.name)
      setCurrentRenameFile(file.name)
      setRenameModalOpen(true)
    }
  }

  const doRename = async () => {
    if (!renameName.trim()) return showError('Please enter a name')

    const from = getFilePath(currentRenameFile)
    const to = getFilePath(renameName)

    try {
      const res = await fetch(`${API_BASE}/api/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      showSuccess('Renamed successfully')
      setRenameModalOpen(false)
      loadFiles(currentPath)
    } catch (e: any) {
      showError(e.message)
    }
  }

  const downloadSelected = () => {
    if (selected.size === 1) {
      const index = [...selected][0]
      const file = files[index]
      if (!file.isDir) {
        window.open(`${API_BASE}/api/download?path=${encodeURIComponent(getFilePath(file.name))}`, '_blank')
      }
    }
  }

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
      const selectedArray = Array.from(selected)
      for (let i = 0; i < selectedArray.length; i++) {
        const index = selectedArray[i]
        const file = files[index]
        setProgressFileName(file.name)
        setProgressValue(Math.round((i / selectedArray.length) * 100))

        const res = await fetch(`${API_BASE}/api/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: getFilePath(file.name) })
        })

        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }

      setProgressMessage('Delete completed successfully!')
      setProgressValue(100)
      setTimeout(() => {
        setShowProgressBar(false)
        setProgressValue(0)
        showSuccess('Deleted successfully')
        setDeleteConfirmModalOpen(false)
        loadFiles(currentPath)
      }, 1000)
    } catch (e: any) {
      showError(e.message)
      setShowProgressBar(false)
      setProgressValue(0)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadFiles(Array.from(e.target.files))
    }
  }

  const doUploadFiles = async () => {
    if (uploadFiles.length === 0) return showError('No files selected')

    setShowProgressBar(true)
    setProgressOperation('upload')
    setProgressMessage(`Uploading ${uploadFiles.length} file(s)...`)

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i]
        setProgressFileName(file.name)
        setProgressValue(0)

        // Simulate upload progress
        const interval = setInterval(() => {
          setProgressValue(prev => {
            const newValue = prev + 10
            if (newValue >= 100) {
              clearInterval(interval)
              return 100
            }
            return newValue
          })
        }, 50)

        const path = getFilePath(file.name)
        const buf = await file.arrayBuffer()

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: { 'x-filename': path },
          body: buf
        })

        clearInterval(interval)
        setProgressValue(100)

        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }

      showSuccess(`Uploaded ${uploadFiles.length} file(s)`)
      setUploadModalOpen(false)
      setUploadFiles([])
      setProgressMessage('Upload completed successfully!')
      setProgressValue(100)
      setTimeout(() => {
        setShowProgressBar(false)
        setProgressValue(0)
        loadFiles(currentPath)
      }, 1000)
    } catch (e: any) {
      showError(e.message)
      setShowProgressBar(false)
      setProgressValue(0)
    }
  }

  const createFolder = async () => {
    if (!folderName.trim()) return showError('Please enter a folder name')

    const path = getFilePath(folderName)

    try {
      const res = await fetch(`${API_BASE}/api/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      showSuccess('Folder created')
      setFolderModalOpen(false)
      setFolderName('')
      loadFiles(currentPath)
    } catch (e: any) {
      showError(e.message)
    }
  }

  const createFile = async () => {
    if (!fileName.trim()) return showError('Please enter a file name')

    const path = getFilePath(fileName)

    try {
      const res = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content: fileContent })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      showSuccess('File created')
      setFileModalOpen(false)
      setFileName('')
      setFileContent('')
      loadFiles(currentPath)
    } catch (e: any) {
      showError(e.message)
    }
  }

  const doMove = async () => {
    if (!movePath.trim()) return showError('Please enter destination path')

    const from = getFilePath(currentMoveFile)
    const to = movePath + '/' + currentMoveFile

    try {
      const res = await fetch(`${API_BASE}/api/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      showSuccess('Moved successfully')
      setMoveModalOpen(false)
      loadFiles(currentPath)
    } catch (e: any) {
      showError(e.message)
    }
  }

  const doCopy = async () => {
    if (!copyPath.trim()) return showError('Please enter destination path')

    const from = getFilePath(currentCopyFile)
    const to = copyPath + '/' + (copyNewName || currentCopyFile)

    try {
      const res = await fetch(`${API_BASE}/api/file?path=${encodeURIComponent(from)}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)

      const saveRes = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: to, content: data.content })
      })

      const saveData = await saveRes.json()
      if (saveData.error) throw new Error(saveData.error)

      showSuccess('Copied successfully')
      setCopyModalOpen(false)
      loadFiles(currentPath)
    } catch (e: any) {
      showError(e.message)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      await uploadDroppedFiles(droppedFiles)
    }
  }

  const uploadDroppedFiles = async (droppedFiles: File[]) => {
    setShowProgressBar(true)
    setProgressOperation('upload')
    setProgressMessage(`Uploading ${droppedFiles.length} file(s)...`)

    try {
      for (let i = 0; i < droppedFiles.length; i++) {
        const file = droppedFiles[i]
        setProgressFileName(file.name)
        setProgressValue(0)

        // Simulate upload progress
        const interval = setInterval(() => {
          setProgressValue(prev => {
            const newValue = prev + 10
            if (newValue >= 100) {
              clearInterval(interval)
              return 100
            }
            return newValue
          })
        }, 50)

        const path = getFilePath(file.name)
        const buf = await file.arrayBuffer()

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: { 'x-filename': path },
          body: buf
        })

        clearInterval(interval)
        setProgressValue(100)

        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }

      showSuccess(`Successfully uploaded ${droppedFiles.length} file(s)`)
      setProgressMessage('Upload completed successfully!')
      setProgressValue(100)
      setTimeout(() => {
        setShowProgressBar(false)
        setProgressValue(0)
        loadFiles(currentPath)
      }, 1000)
    } catch (e: any) {
      showError(e.message)
      setShowProgressBar(false)
      setProgressValue(0)
    }
  }

  const goUp = () => {
    if (!currentPath) return
    const parts = currentPath.split('/')
    parts.pop()
    loadFiles(parts.join('/'))
  }

  const refresh = () => {
    loadFiles(currentPath)
    setTreeCache({})
    loadTree()
  }

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
    localStorage.setItem('sidebarVisible', (!sidebarVisible).toString())
  }

  const getFilePath = (name: string) => {
    return currentPath ? `${currentPath}/${name}` : name
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    const icons: Record<string, string> = {
      php: '🐘', js: '📜', json: '📋', html: '🌐', css: '🎨',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
      pdf: '📕', doc: '📘', docx: '📘',
      zip: '📦', rar: '📦', '7z': '📦',
      mp3: '🎵', mp4: '🎬', avi: '🎬',
      txt: '📄', md: '📝'
    }
    return icons[ext] || '📄'
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const showSuccess = (msg: string) => {
    // Implement toast notification
    toast.success(msg)
  }

  const showError = (msg: string) => {
    // Implement toast notification
    toast.warning('Error: ' + msg)
  }

  const count = selected.size
  const single = count === 1
  const singleFile = single && !files[[...selected][0]].isDir

  return (
    <>
    <div className="file-manager">
      <Header />

      {/* Toolbar */}
      <div className="toolbar">
        <button className="btn" onClick={toggleSidebar}>☰ Tree</button>
        <button className="btn" onClick={goUp}>⬆️ Up</button>
        <button className="btn" onClick={refresh}>🔄 Refresh</button>
        <div className="divider"></div>
        <button className="btn btn-primary" onClick={() => setUploadModalOpen(true)}>⬆️ Upload</button>
        <button className="btn" onClick={() => setFileModalOpen(true)}>📄 New File</button>
        <button className="btn" onClick={() => setFolderModalOpen(true)}>📁 New Folder</button>
        <div className="divider"></div>
        <button className="btn" disabled={!singleFile} onClick={editSelected}>✏️ Edit</button>
        <button className="btn" disabled={!single} onClick={renameSelected}>✏️ Rename</button>
        <button className="btn" disabled={!singleFile} onClick={downloadSelected}>⬇️ Download</button>
        <button className="btn btn-danger" disabled={count === 0} onClick={deleteSelected}>🗑️ Delete</button>
      </div>

      <Breadcrumb currentPath={currentPath || ''} loadFiles={loadFiles} />

      {/* Main Layout */}
      <div className="main-layout">

        {/* Sidebar */}
        <DirectoryTree
          treeCache={treeCache}
          expandedFolders={expandedFolders}
          currentPath={currentPath}
          sidebarVisible={sidebarVisible}
          toggleTreeFolder={toggleTreeFolder}
          loadFiles={loadFiles}
        />

        {/* Container */}
        <div
          className={`container ${isDragOver ? 'drag-over' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Drop Zone */}
          {isDragOver && (
            <div className="drop-zone active">
              <div className="drop-zone-content">
                <div className="drop-zone-icon">📤</div>
                <div className="drop-zone-text">Drop files here to upload</div>
                <div className="drop-zone-hint">Release to start uploading</div>
              </div>
            </div>
          )}

          <div className="file-grid">
            <div className="file-header">
              <div><input type="checkbox" className="checkbox" checked={selected.size === files.length && files.length > 0} onChange={toggleSelectAll} /></div>
              <div>Name</div>
              <div>Size</div>
              <div>Modified</div>
            </div>
            <div className="file-list">
              {files.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📂</div>
                  <div>This folder is empty</div>
                </div>
              ) : (
                files.map((file, i) => (
                  <div
                    key={i}
                    className={`file-row ${selected.has(i) ? 'selected' : ''}`}
                    onClick={(e) => handleRowClick(e, i)}
                    onDoubleClick={() => handleDoubleClick(i)}
                    onContextMenu={(e) => showContextMenu(e, i)}
                  >
                    <div>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleSelect(i)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="file-name">
                      <span className="file-icon">{file.isDir ? '📁' : getFileIcon(file.name)}</span>
                      <span>{file.name}</span>
                    </div>
                    <div className="file-size">{file.isDir ? '-' : formatSize(file.size)}</div>
                    <div className="file-date">{new Date(file.mtime).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuPos.show && contextTarget !== null && (
        <div
          className="context-menu"
          style={{
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            display: 'block'
          }}
        >
          <div className="context-menu-item" onClick={() => { handleDoubleClick(contextTarget); setContextMenuPos({ ...contextMenuPos, show: false }) }}>
            <span className="context-menu-icon">📂</span>
            <span>Open</span>
          </div>
          <div className="context-menu-item" onClick={() => { editFile(contextTarget); setContextMenuPos({ ...contextMenuPos, show: false }) }}>
            <span className="context-menu-icon">✏️</span>
            <span>Edit</span>
          </div>
          <div className="context-menu-separator"></div>
          <div className="context-menu-item" onClick={() => {
            setCurrentMoveFile(files[contextTarget].name)
            setMovePath('')
            setMoveModalOpen(true)
            setContextMenuPos({ ...contextMenuPos, show: false })
          }}>
            <span className="context-menu-icon">➡️</span>
            <span>Move</span>
          </div>
          <div className="context-menu-item" onClick={() => {
            setCurrentCopyFile(files[contextTarget].name)
            setCopyPath('')
            setCopyNewName('')
            setCopyModalOpen(true)
            setContextMenuPos({ ...contextMenuPos, show: false })
          }}>
            <span className="context-menu-icon">📋</span>
            <span>Copy</span>
          </div>
          <div className="context-menu-item" onClick={() => {
            setSelected(new Set([contextTarget]))
            renameSelected()
            setContextMenuPos({ ...contextMenuPos, show: false })
          }}>
            <span className="context-menu-icon">✏️</span>
            <span>Rename</span>
          </div>
          <div className="context-menu-separator"></div>
          <div className="context-menu-item" onClick={() => {
            setSelected(new Set([contextTarget]))
            downloadSelected()
            setContextMenuPos({ ...contextMenuPos, show: false })
          }}>
            <span className="context-menu-icon">⬇️</span>
            <span>Download</span>
          </div>
          <div className="context-menu-item danger" onClick={() => {
            setSelected(new Set([contextTarget]))
            deleteSelected()
            setContextMenuPos({ ...contextMenuPos, show: false })
          }}>
            <span className="context-menu-icon">🗑️</span>
            <span>Delete</span>
          </div>
        </div>
      )}

      {/* Modals - Upload */}
      {uploadModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Files</h3>
              <button className="close-btn" onClick={() => setUploadModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <input type="file" id="fileInput" multiple onChange={handleFileInputChange} style={{ display: 'none' }} />
              <button className="btn btn-primary" onClick={() => document.getElementById('fileInput')?.click()}>Choose Files</button>
              <div style={{ marginTop: '15px' }}>
                {uploadFiles.map((f, i) => (
                  <div key={i}>📄 {f.name} ({formatSize(f.size)})</div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setUploadModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={doUploadFiles}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - New Folder */}
      {folderModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>New Folder</h3>
              <button className="close-btn" onClick={() => setFolderModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Folder Name</label>
                <input type="text" className="form-control" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Enter folder name" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setFolderModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createFolder}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - New File */}
      {fileModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>New File</h3>
              <button className="close-btn" onClick={() => setFileModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>File Name</label>
                <input type="text" className="form-control" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="example.txt" />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea className="form-control" value={fileContent} onChange={(e) => setFileContent(e.target.value)}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setFileModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createFile}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Edit File */}
      {editModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editTitle}</h3>
              <button className="close-btn" onClick={() => setEditModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <textarea className="form-control" value={editContent} onChange={(e) => setEditContent(e.target.value)}></textarea>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveFile}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Rename */}
      {renameModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Rename</h3>
              <button className="close-btn" onClick={() => setRenameModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Name</label>
                <input type="text" className="form-control" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setRenameModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={doRename}>Rename</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Move */}
      {moveModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Move To</h3>
              <button className="close-btn" onClick={() => setMoveModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Destination Path</label>
                <input type="text" className="form-control" value={movePath} onChange={(e) => setMovePath(e.target.value)} placeholder="folder/subfolder" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setMoveModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={doMove}>Move</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Copy */}
      {copyModalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Copy To</h3>
              <button className="close-btn" onClick={() => setCopyModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Destination Path</label>
                <input type="text" className="form-control" value={copyPath} onChange={(e) => setCopyPath(e.target.value)} placeholder="folder/subfolder" />
              </div>
              <div className="form-group">
                <label>New Name (optional)</label>
                <input type="text" className="form-control" value={copyNewName} onChange={(e) => setCopyNewName(e.target.value)} placeholder="Leave empty to keep same name" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setCopyModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={doCopy}>Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Delete Confirmation */}
      {deleteConfirmModalOpen && (
        <div className="modal confirm-modal show">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="close-btn" onClick={() => setDeleteConfirmModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="confirm-icon">⚠️</div>
              <div className="confirm-message">
                {selected.size === 1 ? 'Are you sure you want to delete this item?' : `Are you sure you want to delete ${selected.size} items?`}
              </div>
              <div className="confirm-details">
                {[...selected].map(i => {
                  const file = files[i]
                  return (
                    <div key={i} className="confirm-file-item">
                      {file.isDir ? '📁' : '📄'} {file.name}
                    </div>
                  )
                })}
              </div>
              <p style={{ marginTop: '16px', color: '#dc3545', fontSize: '14px', textAlign: 'center' }}>
                <strong>This action cannot be undone!</strong>
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setDeleteConfirmModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <ProgressBar
        progress={progressValue}
        isVisible={showProgressBar}
        operationType={progressOperation}
        fileName={progressFileName}
        message={progressMessage}
      />
    </div>
    <ToastContainer />
    </>
  )
}