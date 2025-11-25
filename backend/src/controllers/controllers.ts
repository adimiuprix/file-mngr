import fs from 'fs/promises'
import { Stats } from 'fs'
import path from 'path'
import decompress from 'decompress'
import type { FileInfo, FileListResponse, FileContentResponse, ExtractResponse } from './types'

// Tentukan root path nya
const STORAGE = 'C:\\My Web Sites'

export function safePath(rel: string): string | null {
  const target = path.normalize(path.join(STORAGE, rel))
  // Pastikan tidak keluar dari STORAGE (path traversal protection)
  if (!path.resolve(target).startsWith(path.resolve(STORAGE))) return null
  return target
}

export const listFiles = async (rel: string): Promise<FileListResponse> => {
  const dir = safePath(rel)
  if (!dir) throw new Error('invalid path')

  const items = await fs.readdir(dir, { withFileTypes: true })
  const out: FileInfo[] = await Promise.all(
    items.map(async (it) => {
      const p = path.join(dir, it.name)
      const stat = await fs.stat(p)
      return {
        name: it.name,
        isDir: it.isDirectory(),
        size: stat.size,
        mtime: stat.mtimeMs,
      }
    })
  )

  return { path: rel, items: out }
}

export const getFile = async (rel: string): Promise<FileContentResponse> => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  const content = await fs.readFile(fp, 'utf8')
  return { content }
}

export const saveFile = async (rel: string, content: string): Promise<void> => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  await fs.writeFile(fp, content, 'utf8')
}

export const downloadFile = (rel: string) => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  const stream = fs.readFile(fp)
  return { stream, name: path.basename(fp) }
}

export const makeDir = async (rel: string): Promise<void> => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  await fs.mkdir(fp, { recursive: true })
}

export const deleteItem = async (rel: string): Promise<void> => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  const stat = await fs.stat(fp)
  if (stat.isDirectory()) {
    await fs.rm(fp, { recursive: true, force: true })
  } else {
    await fs.unlink(fp)
  }
}

export const renameItem = async (from: string, to: string): Promise<void> => {
  const f = safePath(from)
  const t = safePath(to)
  if (!f || !t) throw new Error('invalid path')
  await fs.rename(f, t)
}

export const uploadFile = async (rel: string, buf: ArrayBuffer): Promise<void> => {
  const dest = safePath(rel)
  if (!dest) throw new Error('invalid path')
  await fs.writeFile(dest, Buffer.from(buf))
}

export const extractArchive = async (
  rel: string,
  destination?: string
): Promise<ExtractResponse> => {
  const filePath = safePath(rel)
  if (!filePath) throw new Error('invalid path')

  // Cek keberadaan file via try/catch, bukan existsSync
  let stat: Stats
  try {
    stat = await fs.stat(filePath)
  } catch (err) {
    throw new Error('file not found')
  }
  if (!stat.isFile()) throw new Error('not a file')

  const extractTo = destination
    ? safePath(destination)
    : path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)))

  if (!extractTo) throw new Error('invalid destination path')

  await fs.mkdir(extractTo, { recursive: true })
  await decompress(filePath, extractTo)

  const relativePath = path.relative(STORAGE, extractTo)
  return { extractedTo: relativePath }
}