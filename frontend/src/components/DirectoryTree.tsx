'use client'

import React from 'react'

import { FileItem } from '@/types'

interface Props {
  treeCache: Record<string, FileItem[]>
  expandedFolders: Set<string>
  currentPath: string
  sidebarVisible: boolean
  toggleTreeFolder: (path: string) => void
  loadFiles: (path: string) => void
}

export default function DirectoryTree({
  treeCache,
  expandedFolders,
  currentPath,
  sidebarVisible,
  toggleTreeFolder,
  loadFiles
}: Props) {

  const renderTree = (folders: FileItem[], basePath: string): React.ReactNode => {
    return folders.map(folder => {
      const folderPath = basePath ? `${basePath}/${folder.name}` : folder.name
      const isExpanded = expandedFolders.has(folderPath)
      const isActive = currentPath === folderPath

      return (
        <div key={folderPath} className="tree-item-wrapper">
          <div className={`tree-item ${isActive ? 'active' : ''}`}>
            <span
              className={`tree-toggle ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleTreeFolder(folderPath)}
            >
              ▶
            </span>
            <span className="tree-icon">📁</span>
            <span className="tree-name" onClick={() => loadFiles(folderPath)}>
              {folder.name}
            </span>
          </div>

          {isExpanded && (
            <div className="tree-children expanded">
              {treeCache[folderPath] ? (
                treeCache[folderPath].length > 0 ? (
                  renderTree(treeCache[folderPath], folderPath)
                ) : (
                  <div style={{ padding: '8px 16px', fontSize: '12px', color: '#999' }}>
                    Empty folder
                  </div>
                )
              ) : (
                <div className="loading" style={{ padding: '8px 16px', fontSize: '12px' }}>
                  Loading...
                </div>
              )}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className={`sidebar ${!sidebarVisible ? 'hidden' : ''}`}>
      <div className="sidebar-header">📁 Directory Tree</div>
      <div className="tree-view">
        {treeCache['']
          ? renderTree(treeCache[''], '')
          : <div className="loading">Loading...</div>}
      </div>
    </div>
  )
}
