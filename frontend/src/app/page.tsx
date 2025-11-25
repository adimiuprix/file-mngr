'use client'

import { useState, useEffect, useRef } from 'react'
import ProgressBar from '@/components/ProgressBar'
import Header from '@/components/Header'
import Breadcrumb from '@/components/Breadcrumb'
import DirectoryTree from '@/components/DirectoryTree'
import ContextMenu from '@/components/ContextMenu'
import ToolBar from '@/components/ToolBar'
import DropZone from '@/components/DropZone'

// Modal components
import UploadModal from '@/components/modal/UploadModal'
import FolderModal from '@/components/modal/FolderModal'
import NewFileModal from '@/components/modal/NewFileModal'
import EditModal from '@/components/modal/EditModal'
import RenameModal from '@/components/modal/RenameModal'
import MoveModal from '@/components/modal/MoveModal'
import CopyModal from '@/components/modal/CopyModal'
import DeleteConfirmModal from '@/components/modal/DeleteConfirmModal'
import CompressModal from '@/components/modal/CompressModal'

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
  const [compressModalOpen, setCompressModalOpen] = useState(false)

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

  const [currentCompressItem, setCurrentCompressItem] = useState('')
  const [compressOutputName, setCompressOutputName] = useState('')

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

  const extractSelected = async () => {
    if (selected.size !== 1) return
    
    const index = [...selected][0]
    const file = files[index]
    
    if (file.isDir) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      showError('File is not an archive')
      return
    }

    try {
      setShowProgressBar(true)
      setProgressOperation('upload')
      setProgressMessage('Preparing to extract...')
      setProgressFileName(file.name)
      setProgressValue(0)

      // Phase 1: Smooth progress to 30% (preparation)
      let currentProgress = 0
      const phase1Interval = setInterval(() => {
        currentProgress += 2
        if (currentProgress >= 30) {
          clearInterval(phase1Interval)
          setProgressMessage('Extracting archive...')
        }
        setProgressValue(currentProgress)
      }, 50)

      // Wait for phase 1 to complete
      await new Promise(resolve => setTimeout(resolve, 750))

      // Phase 2: Progress from 30% to 85%
      const phase2Interval = setInterval(() => {
        currentProgress += 1.5
        if (currentProgress >= 85) {
          clearInterval(phase2Interval)
        }
        setProgressValue(currentProgress)
      }, 100)

      const res = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: getFilePath(file.name),
          destination: ''
        })
      })

      clearInterval(phase2Interval)

      const data = await res.json()
      
      if (data.error) throw new Error(data.error)

      // Phase 3: Complete to 100%
      setProgressMessage('Finalizing...')
      const finalInterval = setInterval(() => {
        currentProgress += 5
        if (currentProgress >= 100) {
          clearInterval(finalInterval)
          setProgressValue(100)
          setProgressMessage('Extraction completed!')
        } else {
          setProgressValue(currentProgress)
        }
      }, 50)
      
      setTimeout(() => {
        setShowProgressBar(false)
        setProgressValue(0)
        showSuccess(`Extracted successfully`)
        loadFiles(currentPath)
      }, 2000)
    } catch (e: any) {
      showError(e.message)
      setShowProgressBar(false)
      setProgressValue(0)
    }
  }

  const compressSelected = () => {
    if (selected.size !== 1) return
    
    const index = [...selected][0]
    const item = files[index]
    
    // Set default output name
    const defaultOutputName = `${item.name}.zip`
    
    setCurrentCompressItem(item.name)
    setCompressOutputName(defaultOutputName)
    setCompressModalOpen(true)
  }

  const doCompress = async () => {
    if (!compressOutputName.trim()) {
      showError('Please enter output archive name')
      return
    }

    const itemPath = getFilePath(currentCompressItem)
    const outputPath = getFilePath(compressOutputName)

    try {
      setShowProgressBar(true)
      setProgressOperation('upload')
      setProgressMessage('Preparing to compress...')
      setProgressFileName(currentCompressItem)
      setProgressValue(0)

      let currentProgress = 0
      const phase1Interval = setInterval(() => {
        currentProgress += 2
        if (currentProgress >= 30) {
          clearInterval(phase1Interval)
          setProgressMessage('Compressing...')
        }
        setProgressValue(currentProgress)
      }, 50)

      await new Promise(resolve => setTimeout(resolve, 750))

      const phase2Interval = setInterval(() => {
        currentProgress += 1.5
        if (currentProgress >= 85) {
          clearInterval(phase2Interval)
        }
        setProgressValue(currentProgress)
      }, 100)

      // API Call
      const res = await fetch(`${API_BASE}/api/compress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: itemPath,
          output: outputPath
        })
      })

      clearInterval(phase2Interval)

      const data = await res.json()
      
      if (data.error) throw new Error(data.error)

      setProgressMessage('Finalizing...')
      const finalInterval = setInterval(() => {
        currentProgress += 5
        if (currentProgress >= 100) {
          clearInterval(finalInterval)
          setProgressValue(100)
          setProgressMessage('Compression completed!')
        } else {
          setProgressValue(currentProgress)
        }
      }, 50)
      
      setTimeout(() => {
        setShowProgressBar(false)
        setProgressValue(0)
        setCompressModalOpen(false)
        showSuccess(`Compressed successfully: ${compressOutputName}`)
        loadFiles(currentPath)
      }, 2000)

    } catch (e: any) {
      showError(e.message)
      setShowProgressBar(false)
      setProgressValue(0)
    }
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
      <ToolBar
        onToggleSidebar={toggleSidebar}
        onGoUp={goUp}
        onRefresh={refresh}
        onUpload={() => setUploadModalOpen(true)}
        onNewFile={() => setFileModalOpen(true)}
        onNewFolder={() => setFolderModalOpen(true)}
        onEdit={editSelected}
        onRename={renameSelected}
        onDownload={downloadSelected}
        onDelete={deleteSelected}
        onExtract={extractSelected}
        onCompress={compressSelected}
        singleFile={singleFile}
        single={single}
        count={count}
      />

      {/* Breadcrumb component */}
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
          <DropZone isVisible={isDragOver} />

          <div className="file-grid">
            <div className="file-header">

              <div>
                <input type="checkbox" className="checkbox" checked={selected.size === files.length && files.length > 0} onChange={toggleSelectAll} />
              </div>

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

      {/* ContextMenu Component */}
      <ContextMenu
        show={contextMenuPos.show}
        x={contextMenuPos.x}
        y={contextMenuPos.y}
        contextTarget={contextTarget}
        files={files}
        onClose={() => setContextMenuPos({ ...contextMenuPos, show: false })}
        onOpen={handleDoubleClick}
        onEdit={editFile}
        onMove={(fileName) => {
          setCurrentMoveFile(fileName)
          setMovePath('')
          setMoveModalOpen(true)
        }}
        onCopy={(fileName) => {
          setCurrentCopyFile(fileName)
          setCopyPath('')
          setCopyNewName('')
          setCopyModalOpen(true)
        }}
        onRename={(index) => {
          setSelected(new Set([index]))
          renameSelected()
        }}
        onDownload={(index) => {
          setSelected(new Set([index]))
          downloadSelected()
        }}
        onDelete={(index) => {
          setSelected(new Set([index]))
          deleteSelected()
        }}
        onExtract={(index) => {
          setSelected(new Set([index]))
          extractSelected()
        }}
      />

      {/* Modal Upload */}
      <UploadModal
        isOpen={uploadModalOpen}
        uploadFiles={uploadFiles}
        onClose={() => setUploadModalOpen(false)}
        onFileInputChange={handleFileInputChange}
        onUpload={doUploadFiles}
        formatSize={formatSize}
      />

      {/* Modal New Folder */}
      <FolderModal
        isOpen={folderModalOpen}
        folderName={folderName}
        onClose={() => setFolderModalOpen(false)}
        onFolderNameChange={setFolderName}
        onCreate={createFolder}
      />

      {/* Modal New File */}
      <NewFileModal
        isOpen={fileModalOpen}
        fileName={fileName}
        fileContent={fileContent}
        onClose={() => setFileModalOpen(false)}
        onFileNameChange={setFileName}
        onFileContentChange={setFileContent}
        onCreate={createFile}
      />

      {/* Modal Edit File */}
      <EditModal
        isOpen={editModalOpen}
        title={editTitle}
        content={editContent}
        onClose={() => setEditModalOpen(false)}
        onContentChange={setEditContent}
        onSave={saveFile}
      />

      {/* Modal Rename */}
      <RenameModal
        isOpen={renameModalOpen}
        name={renameName}
        onClose={() => setRenameModalOpen(false)}
        onNameChange={setRenameName}
        onRename={doRename}
      />

      {/* Modal Move */}
      <MoveModal
        isOpen={moveModalOpen}
        path={movePath}
        onClose={() => setMoveModalOpen(false)}
        onPathChange={setMovePath}
        onMove={doMove}
      />

      {/* Modal Copy */}
      <CopyModal
        isOpen={copyModalOpen}
        path={copyPath}
        newName={copyNewName}
        onClose={() => setCopyModalOpen(false)}
        onPathChange={setCopyPath}
        onNewNameChange={setCopyNewName}
        onCopy={doCopy}
      />

      {/* Modal Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteConfirmModalOpen}
        selectedCount={selected.size}
        selectedItems={Array.from(selected)}
        files={files}
        onClose={() => setDeleteConfirmModalOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Modal Compress File & Folder selected */}
      <CompressModal
        isOpen={compressModalOpen}
        currentItem={currentCompressItem}
        outputName={compressOutputName}
        onClose={() => setCompressModalOpen(false)}
        onOutputChange={setCompressOutputName}
        onCompress={doCompress}
      />

      {/* Progress Bar */}
      <ProgressBar
        progress={progressValue}
        isVisible={showProgressBar}
        operationType={progressOperation}
        fileName={progressFileName}
        message={progressMessage}
      />
    </div>

    {/* Toast Component */}
    <ToastContainer />
    
    </>
  )
}