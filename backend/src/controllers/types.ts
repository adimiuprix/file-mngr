export interface FileInfo {
  name: string
  isDir: boolean
  size: number
  mtime: number
}

export interface FileListResponse {
  path: string
  items: FileInfo[]
}

export interface FileContentResponse {
  content: string
}

export interface ExtractResponse {
  extractedTo: string
}