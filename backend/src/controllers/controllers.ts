import fs, { Stats } from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import decompress from 'decompress'
import AdmZip from 'adm-zip'
import type { FileInfo, FileListResponse, FileContentResponse, ExtractResponse } from './types'

// Tentukan root path nya
const STORAGE = 'C:\\My Web Sites'

export function safePath(rel: string): string | null {
  const target = path.normalize(path.join(STORAGE, rel))
  if (!path.resolve(target).startsWith(path.resolve(STORAGE))) return null
  return target
}

export const listFiles = async (rel: string): Promise<FileListResponse> => {
  const dir = safePath(rel)
  if (!dir) throw new Error('invalid path')

  const items = await fsp.readdir(dir, { withFileTypes: true })
  const out: FileInfo[] = await Promise.all(
    items.map(async (it) => {
      const p = path.join(dir, it.name)
      const stat = await fsp.stat(p)
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
  const content = await fsp.readFile(fp, 'utf8')
  return { content }
}

export const saveFile = async (rel: string, content: string): Promise<void> => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  await fsp.writeFile(fp, content, 'utf8')
}

export const downloadFile = (rel: string) => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  const stream = fs.readFileSync(fp) // Hono expects a Buffer/Uint8Array
  return { stream, name: path.basename(fp) }
}

export const makeDir = async (rel: string): Promise<void> => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  await fsp.mkdir(fp, { recursive: true })
}

export const deleteItem = async (rel: string): Promise<void> => {
  const fp = safePath(rel)
  if (!fp) throw new Error('invalid path')
  const stat = await fsp.stat(fp)
  if (stat.isDirectory()) {
    await fsp.rm(fp, { recursive: true, force: true })
  } else {
    await fsp.unlink(fp)
  }
}

export const renameItem = async (from: string, to: string): Promise<void> => {
  const f = safePath(from)
  const t = safePath(to)
  if (!f || !t) throw new Error('invalid path')
  await fsp.rename(f, t)
}

export const uploadFile = async (rel: string, buf: ArrayBuffer): Promise<void> => {
  const dest = safePath(rel)
  if (!dest) throw new Error('invalid path')
  await fsp.writeFile(dest, Buffer.from(buf))
}

export const extractArchive = async (
  rel: string,
  destination?: string
): Promise<ExtractResponse> => {
  const filePath = safePath(rel)
  if (!filePath) throw new Error('invalid path')

  let stat: Stats
  try {
    stat = await fsp.stat(filePath)
  } catch {
    throw new Error('file not found')
  }
  if (!stat.isFile()) throw new Error('not a file')

  const extractTo = destination
    ? safePath(destination)
    : path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)))

  if (!extractTo) throw new Error('invalid destination path')

  await fsp.mkdir(extractTo, { recursive: true })
  await decompress(filePath, extractTo)

  const relativePath = path.relative(STORAGE, extractTo)
  return { extractedTo: relativePath }
}

export const compressItems = async (
  targetPaths: string | string[], 
  outputName: string
) => {
  const paths = Array.isArray(targetPaths) ? targetPaths : [targetPaths]
  
  if (!paths || paths.length === 0) {
    throw new Error('No items specified for compression')
  }

  if (!outputName || outputName.trim() === '') {
    throw new Error('Output archive name is required')
  }

  const finalOutputName = outputName.endsWith('.zip') 
    ? outputName 
    : `${outputName}.zip`

  const zipPath = safePath(finalOutputName)
  if (!zipPath) {
    throw new Error('Invalid output path')
  }

  if (fs.existsSync(zipPath)) {
    throw new Error(`Archive already exists: ${finalOutputName}`)
  }

  const validItems: Array<{ absolute: string; name: string; isDir: boolean }> = []
  const errors: string[] = []

  for (const targetPath of paths) {
    if (!targetPath || targetPath.trim() === '') {
      errors.push('Empty path provided')
      continue
    }

    const absolute = safePath(targetPath)
    
    if (!absolute) {
      errors.push(`Invalid path: ${targetPath}`)
      continue
    }

    if (!fs.existsSync(absolute)) {
      errors.push(`Path not found: ${targetPath}`)
      continue
    }

    const stats = fs.statSync(absolute)
    const name = path.basename(absolute)

    validItems.push({
      absolute,
      name,
      isDir: stats.isDirectory()
    })
  }

  if (validItems.length === 0) {
    const errorMsg = errors.length > 0 
      ? `No valid items to compress. Errors: ${errors.join(', ')}`
      : 'No valid items to compress'
    throw new Error(errorMsg)
  }

  if (errors.length > 0) {
    console.warn(`Warning: ${errors.length} item(s) skipped:`, errors)
  }

  try {
    const zip = new AdmZip()

    for (const item of validItems) {
      if (item.isDir) {
        zip.addLocalFolder(item.absolute, item.name)
      } else {
        zip.addLocalFile(item.absolute)
      }
    }

    zip.writeZip(zipPath)

    const archiveStats = fs.statSync(zipPath)

    return {
      success: true,
      output: zipPath,
      name: finalOutputName,
      itemCount: validItems.length,
      totalItems: paths.length,
      skipped: errors.length,
      size: archiveStats.size,
      items: validItems.map(item => ({
        name: item.name,
        type: item.isDir ? 'folder' : 'file'
      }))
    }

  } catch (error: any) {
    if (fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath)
      } catch (cleanupError) {
        console.error('Failed to cleanup partial archive:', cleanupError)
      }
    }

    throw new Error(`Compression failed: ${error.message}`)
  }
}