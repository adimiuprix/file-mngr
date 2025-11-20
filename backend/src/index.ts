import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { fileURLToPath } from 'url'
import path from 'path'

// Import controllers
import * as controller from './controllers/controllers'

const __filename = fileURLToPath(import.meta.url)
path.dirname(__filename)

const app = new Hono()

app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'x-filename'],
  credentials: true,
}))

const handleError = (c: any, e: Error) =>
  e.message === 'invalid path'
    ? c.json({ error: e.message }, 400)
    : c.json({ error: e.message }, 500)

// Routes
app.get('/api/list', async (c) => {
  try {
    const res = await controller.listFiles(c.req.query('path') || '')
    return c.json(res)
  } catch (e: any) {
    return handleError(c, e)
  }
})

app.get('/api/file', async (c) => {
  const rel = c.req.query('path')
  if (rel === undefined) {
    return c.json({ error: 'missing path query' }, 400)
  }
  try {
    const res = await controller.getFile(rel)
    return c.json(res)
  } catch (e: unknown) {
    return handleError(c, e)
  }
})

app.post('/api/save', async (c) => {
  try {
    const { path, content } = await c.req.json()
    await controller.saveFile(path, content)
    return c.json({ ok: true })
  } catch (e: any) {
    return handleError(c, e)
  }
})

app.get('/api/download', async (c) => {
  try {
    const { stream, name } = controller.downloadFile(c.req.query('path'))
    return c.body(stream, 200, { 'Content-Disposition': `attachment; filename="${name}"` })
  } catch (e: any) {
    return c.text(e.message, e.message === 'invalid path' ? 400 : 500)
  }
})

app.post('/api/mkdir', async (c) => {
  try {
    const { path } = await c.req.json()
    await controller.makeDir(path)
    return c.json({ ok: true })
  } catch (e: any) {
    return handleError(c, e)
  }
})

app.post('/api/delete', async (c) => {
  try {
    const { path } = await c.req.json()
    await controller.deleteItem(path)
    return c.json({ ok: true })
  } catch (e: any) {
    return handleError(c, e)
  }
})

app.post('/api/rename', async (c) => {
  try {
    const { from, to } = await c.req.json()
    await controller.renameItem(from, to)
    return c.json({ ok: true })
  } catch (e: any) {
    return handleError(c, e)
  }
})

app.post('/api/upload', async (c) => {
  try {
    const filename = c.req.header('x-filename') || 'upload.bin'
    const buf = await c.req.arrayBuffer()
    await controller.uploadFile(filename, buf)
    return c.json({ ok: true })
  } catch (e: any) {
    return handleError(c, e)
  }
})

app.post('/api/extract', async (c) => {
  try {
    const { path, destination } = await c.req.json()
    const { extractedTo } = await controller.extractArchive(path, destination)
    return c.json({ ok: true, extractedTo, message: 'Archive extracted successfully' })
  } catch (e: any) {
    return handleError(c, e)
  }
})

app.get('/storage/*', async (c) => {
  try {
    const { stream } = controller.downloadFile(c.req.param('0'))
    return c.body(stream)
  } catch (e: any) {
    return c.text(e.message, e.message === 'invalid path' ? 400 : 500)
  }
})

const port = process.env.PORT || 8787
serve({ fetch: app.fetch, port: Number(port) })

console.log(`💾 File Manager API running at http://localhost:${port}`)
console.log(`📁 Storage directory: C:\\My Web Sites`)
console.log(`🌐 CORS enabled for: http://localhost:3000, http://localhost:3001`)