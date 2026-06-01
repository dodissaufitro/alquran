/**
 * Server chat rekaman Talaqqi Musyaffahah (Talaqee)
 * REST + WebSocket — jalankan: npm run start (di folder ini) atau npm run talaqqi:chat (dari root)
 */
import cors from 'cors'
import crypto from 'crypto'
import express from 'express'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadEnv } from '../../scripts/load-env.mjs'
import multer from 'multer'
import Database from 'better-sqlite3'
import { WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv(path.join(__dirname, '../..'))
const PORT = Number(process.env.TALAQQI_CHAT_PORT || 3847)
const HOST = process.env.TALAQQI_CHAT_HOST || '0.0.0.0'
const ROOM_ID = process.env.TALAQQI_CHAT_ROOM || 'talaqqi-fatihah'
const DATA_DIR = path.join(__dirname, 'data')
const UPLOAD_DIR = path.join(__dirname, 'uploads')
const MAX_AUDIO_BYTES = 8 * 1024 * 1024

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'talaqqi.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS recordings (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL DEFAULT 'talaqqi-fatihah',
    author_name TEXT NOT NULL,
    author_email TEXT,
    author_role TEXT NOT NULL,
    ayah_number INTEGER,
    audio_file TEXT NOT NULL,
    duration_ms INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    recording_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_recordings_room ON recordings(room_id);
  CREATE INDEX IF NOT EXISTS idx_recordings_created ON recordings(created_at);
  CREATE INDEX IF NOT EXISTS idx_recordings_email ON recordings(author_email);
  CREATE INDEX IF NOT EXISTS idx_comments_recording ON comments(recording_id);
`)

function ensureCommentColumns() {
  const cols = db.prepare('PRAGMA table_info(comments)').all().map((c) => c.name)
  if (!cols.includes('author_email')) {
    db.exec(`ALTER TABLE comments ADD COLUMN author_email TEXT NOT NULL DEFAULT ''`)
  }
  if (!cols.includes('audio_file')) {
    db.exec(`ALTER TABLE comments ADD COLUMN audio_file TEXT NOT NULL DEFAULT ''`)
  }
  if (!cols.includes('duration_ms')) {
    db.exec(`ALTER TABLE comments ADD COLUMN duration_ms INTEGER NOT NULL DEFAULT 0`)
  }
}
ensureCommentColumns()

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = mimeToExt(file.mimetype) || 'webm'
      cb(null, `${newId()}.${ext}`)
    },
  }),
  limits: { fileSize: MAX_AUDIO_BYTES },
})

/** @type {import('ws').WebSocket[]} */
const wsClients = new Set()

function newId() {
  return crypto.randomBytes(8).toString('hex')
}

function mimeToExt(mime) {
  const map = {
    'audio/webm': 'webm',
    'video/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'application/octet-stream': 'webm',
  }
  return map[mime] || null
}

function normalizeEmail(email) {
  const e = String(email || '')
    .trim()
    .toLowerCase()
  if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    const err = new Error('Email tidak valid.')
    err.status = 400
    throw err
  }
  return e
}

function audioUrl(req, file) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http'
  const host = req.headers['x-forwarded-host'] || req.get('host')
  return `${proto}://${host}/api/talaqqi/audio.php?f=${encodeURIComponent(file)}`
}

function rowToComment(c, req) {
  const audioFile = c.audio_file || ''
  return {
    id: c.id,
    recordingId: c.recording_id,
    authorName: c.author_name,
    authorEmail: c.author_email || null,
    authorRole: c.author_role,
    body: c.body,
    audioUrl: audioFile ? audioUrl(req, audioFile) : null,
    durationMs: c.duration_ms || 0,
    createdAt: c.created_at,
  }
}

function rowToRecording(row, comments, req) {
  return {
    id: row.id,
    authorName: row.author_name,
    authorEmail: row.author_email || null,
    authorRole: row.author_role,
    ayahNumber: row.ayah_number ?? null,
    durationMs: row.duration_ms,
    audioUrl: audioUrl(req, row.audio_file),
    createdAt: row.created_at,
    comments,
  }
}

function fetchFeed(req, { since = null, authorEmail = null, roomId = ROOM_ID, page = 1, limit = 10 } = {}) {
  const params = [roomId]
  let where = 'room_id = ?'

  if (since != null && since > 0) {
    where += ' AND created_at > ?'
    params.push(since)
    if (authorEmail) {
      where += ' AND author_email = ?'
      params.push(normalizeEmail(authorEmail))
    }
    const sql = `SELECT * FROM recordings WHERE ${where} ORDER BY created_at ASC LIMIT 200`
    const rows = db.prepare(sql).all(...params)
    const items = mapRecordingRows(rows, req)
    return {
      items,
      total: items.length,
      page: 1,
      limit: Math.max(1, items.length),
      totalPages: 1,
    }
  }

  if (authorEmail) {
    where += ' AND author_email = ?'
    params.push(normalizeEmail(authorEmail))
  }

  const safePage = Math.max(1, Number(page) || 1)
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10))
  const total = db.prepare(`SELECT COUNT(*) AS c FROM recordings WHERE ${where}`).get(...params).c
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const currentPage = Math.min(safePage, totalPages)
  const offset = (currentPage - 1) * safeLimit

  const sql = `SELECT * FROM recordings WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  const rows = db.prepare(sql).all(...params, safeLimit, offset)
  const items = mapRecordingRows(rows, req)

  return {
    items,
    total,
    page: currentPage,
    limit: safeLimit,
    totalPages,
  }
}

function mapRecordingRows(rows, req) {
  if (!rows.length) return []

  const ids = rows.map((r) => r.id)
  const placeholders = ids.map(() => '?').join(',')
  const commentRows = db
    .prepare(
      `SELECT * FROM comments WHERE recording_id IN (${placeholders}) ORDER BY created_at ASC`,
    )
    .all(...ids)

  const byRecording = {}
  for (const c of commentRows) {
    if (!byRecording[c.recording_id]) byRecording[c.recording_id] = []
    byRecording[c.recording_id].push(rowToComment(c, req))
  }

  return rows.map((row) => rowToRecording(row, byRecording[row.id] || [], req))
}

function broadcast(payload) {
  const data = JSON.stringify(payload)
  for (const client of wsClients) {
    if (client.readyState === 1) client.send(data)
  }
}

function sendJson(res, data, code = 200) {
  res.status(code).json(data)
}

function sendError(res, message, code = 400) {
  sendJson(res, { ok: false, error: message }, code)
}

function handleOptions(_req, res) {
  res.sendStatus(204)
}

function handleHealth(_req, res) {
  sendJson(res, {
    ok: true,
    service: 'faithfulpath-talaqqi-chat',
    room: ROOM_ID,
    version: 1,
    serverTime: Date.now(),
  })
}

function handleFeed(req, res) {
  try {
    const since = req.query.since ? Number(req.query.since) : null
    const email = req.query.email ? String(req.query.email) : null
    const page = req.query.page ? Number(req.query.page) : 1
    const limit = req.query.limit ? Number(req.query.limit) : 10
    const feed = fetchFeed(req, { since, authorEmail: email || null, page, limit })
    sendJson(res, { ok: true, ...feed, serverTime: Date.now() })
  } catch (e) {
    sendError(res, e.message || 'Gagal memuat feed', e.status || 500)
  }
}

function handleSantri(_req, res) {
  try {
    const rows = db
      .prepare(
        `SELECT author_email AS email,
                MAX(author_name) AS name,
                COUNT(*) AS recording_count,
                MAX(created_at) AS last_activity
         FROM recordings
         WHERE room_id = ? AND author_email IS NOT NULL AND author_email != ''
         GROUP BY author_email
         ORDER BY last_activity DESC`,
      )
      .all(ROOM_ID)

    const santri = rows.map((row) => ({
      email: row.email,
      name: row.name || row.email,
      recordingCount: row.recording_count,
      lastActivity: row.last_activity,
    }))

    sendJson(res, { ok: true, santri, serverTime: Date.now() })
  } catch (e) {
    sendError(res, e.message || 'Gagal memuat daftar santri', e.status || 500)
  }
}

function handleRecording(req, res) {
  if (req.body?.action === 'delete') {
    return handleDeleteRecording(req, res)
  }
  try {
    const authorName = String(req.body.authorName || '').trim()
    const authorEmail = String(req.body.authorEmail || '').trim()
    const authorRole = String(req.body.authorRole || 'santri').trim()
    const ayahRaw = req.body.ayahNumber
    const durationMs = Number(req.body.durationMs || 0)

    if (!authorName || authorName.length > 50) {
      return sendError(res, 'Nama wajib diisi (maks. 50 karakter).')
    }
    if (!authorEmail) {
      return sendError(res, 'Login diperlukan. Email pengguna wajib dikirim.')
    }
    const email = normalizeEmail(authorEmail)
    const role = ['santri', 'guru'].includes(authorRole) ? authorRole : 'santri'

    if (!req.file) {
      return sendError(res, 'File audio tidak diterima.')
    }

    let ayahNumber = null
    if (ayahRaw !== undefined && ayahRaw !== '') {
      ayahNumber = Number(ayahRaw)
      if (ayahNumber < 1 || ayahNumber > 7) {
        return sendError(res, 'Ayat harus 1–7.')
      }
    }

    const id = newId()
    const createdAt = Date.now()
    const audioFile = path.basename(req.file.filename)

    db.prepare(
      `INSERT INTO recordings (id, room_id, author_name, author_email, author_role, ayah_number, audio_file, duration_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, ROOM_ID, authorName, email, role, ayahNumber, audioFile, durationMs, createdAt)

    const row = db.prepare('SELECT * FROM recordings WHERE id = ?').get(id)
    const item = rowToRecording(row, [], req)

    broadcast({ type: 'recording', room: ROOM_ID, item })
    sendJson(res, { ok: true, item })
  } catch (e) {
    sendError(res, e.message || 'Gagal menyimpan rekaman', e.status || 500)
  }
}

function handleComment(req, res) {
  if (req.body?.action === 'delete') {
    return handleDeleteComment(req, res)
  }
  try {
    const recordingId = String(req.body?.recordingId || '').trim()
    const authorName = String(req.body?.authorName || '').trim()
    const authorEmail = String(req.body?.authorEmail || '')
      .trim()
      .toLowerCase()
    const authorRole = String(req.body?.authorRole || 'guru').trim()
    let body = String(req.body?.body || '').trim()
    const durationMs = Number(req.body?.durationMs || 0)

    if (!recordingId || !authorName) {
      return sendError(res, 'Data komentar tidak lengkap (rekaman/nama).')
    }

    const role = ['santri', 'guru'].includes(authorRole) ? authorRole : 'guru'
    let audioFile = ''

    if (req.file) {
      audioFile = path.basename(req.file.filename)
      if (!body) body = 'Koreksi suara'
    } else if (!body) {
      return sendError(res, 'Isi teks atau rekaman suara wajib ada.')
    }

    if (body.length > 1000) {
      return sendError(res, 'Komentar terlalu panjang.')
    }

    const rec = db.prepare('SELECT id FROM recordings WHERE id = ?').get(recordingId)
    if (!rec) {
      return sendError(res, 'Rekaman tidak ditemukan.', 404)
    }

    const id = newId()
    const createdAt = Date.now()
    db.prepare(
      `INSERT INTO comments (id, recording_id, author_name, author_email, author_role, body, audio_file, duration_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, recordingId, authorName, authorEmail, role, body, audioFile, durationMs, createdAt)

    const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(id)
    const comment = rowToComment(row, req)

    broadcast({ type: 'comment', room: ROOM_ID, recordingId, comment })
    sendJson(res, { ok: true, comment })
  } catch (e) {
    sendError(res, e.message || 'Gagal mengirim komentar', e.status || 500)
  }
}

function actorMayDeleteRecording(actorEmail, row, actorIsSuperAdmin) {
  const owner = String(row.author_email || '').trim().toLowerCase()
  return owner === actorEmail || actorIsSuperAdmin === true
}

function actorMayDeleteComment(actorEmail, commentRow, recordingRow, actorIsSuperAdmin) {
  const commentAuthor = String(commentRow.author_email || '').trim().toLowerCase()
  return commentAuthor === actorEmail || actorIsSuperAdmin === true
}

function unlinkAudioFile(filename) {
  const file = path.basename(String(filename || ''))
  if (!/^[a-f0-9]{16}\.(webm|ogg|mp3|m4a)$/.test(file)) return
  const full = path.join(UPLOAD_DIR, file)
  if (fs.existsSync(full)) fs.unlinkSync(full)
}

function handleDeleteRecording(req, res) {
  try {
    const id = String(req.body?.id || '').trim()
    const actorEmailRaw = String(req.body?.actorEmail || '').trim()
    const actorIsSuperAdmin = req.body?.actorIsSuperAdmin === true

    if (!id) return sendError(res, 'ID rekaman wajib diisi.')
    if (!actorEmailRaw) return sendError(res, 'Login diperlukan untuk menghapus rekaman.')

    const actorEmail = normalizeEmail(actorEmailRaw)
    const row = db.prepare('SELECT * FROM recordings WHERE id = ?').get(id)
    if (!row) return sendError(res, 'Rekaman tidak ditemukan.', 404)

    if (!actorMayDeleteRecording(actorEmail, row, actorIsSuperAdmin)) {
      return sendError(res, 'Anda tidak berhak menghapus rekaman ini.', 403)
    }

    const comments = db.prepare('SELECT audio_file FROM comments WHERE recording_id = ?').all(id)
    for (const c of comments) unlinkAudioFile(c.audio_file)
    db.prepare('DELETE FROM comments WHERE recording_id = ?').run(id)
    db.prepare('DELETE FROM recordings WHERE id = ?').run(id)
    unlinkAudioFile(row.audio_file)

    broadcast({ type: 'recording_deleted', room: ROOM_ID, id })
    sendJson(res, { ok: true, id })
  } catch (e) {
    sendError(res, e.message || 'Gagal menghapus rekaman', e.status || 500)
  }
}

function handleDeleteComment(req, res) {
  try {
    const id = String(req.body?.id || '').trim()
    const actorEmailRaw = String(req.body?.actorEmail || '').trim()
    const actorIsSuperAdmin = req.body?.actorIsSuperAdmin === true

    if (!id) return sendError(res, 'ID komentar wajib diisi.')
    if (!actorEmailRaw) return sendError(res, 'Login diperlukan untuk menghapus komentar.')

    const actorEmail = normalizeEmail(actorEmailRaw)
    const row = db.prepare('SELECT * FROM comments WHERE id = ?').get(id)
    if (!row) return sendError(res, 'Komentar tidak ditemukan.', 404)

    const recording = db.prepare('SELECT * FROM recordings WHERE id = ?').get(row.recording_id)
    if (!recording) return sendError(res, 'Rekaman tidak ditemukan.', 404)

    if (!actorMayDeleteComment(actorEmail, row, recording, actorIsSuperAdmin)) {
      return sendError(res, 'Anda tidak berhak menghapus komentar ini.', 403)
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(id)
    unlinkAudioFile(row.audio_file)

    broadcast({
      type: 'comment_deleted',
      room: ROOM_ID,
      recordingId: row.recording_id,
      id,
    })
    sendJson(res, { ok: true, id, recordingId: row.recording_id })
  } catch (e) {
    sendError(res, e.message || 'Gagal menghapus komentar', e.status || 500)
  }
}

function handleAudio(req, res) {
  const file = path.basename(String(req.query.f || ''))
  if (!/^[a-f0-9]{16}\.(webm|ogg|mp3|m4a)$/.test(file)) {
    return res.sendStatus(404)
  }
  const full = path.join(UPLOAD_DIR, file)
  if (!fs.existsSync(full)) {
    return res.sendStatus(404)
  }
  const types = { webm: 'audio/webm', ogg: 'audio/ogg', mp3: 'audio/mpeg', m4a: 'audio/mp4' }
  const ext = path.extname(file).slice(1)
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  fs.createReadStream(full).pipe(res)
}

const routes = [
  ['options', '/api/talaqqi/health', handleOptions],
  ['options', '/api/talaqqi/health.php', handleOptions],
  ['get', '/api/talaqqi/health', handleHealth],
  ['get', '/api/talaqqi/health.php', handleHealth],
  ['options', '/api/talaqqi/feed', handleOptions],
  ['options', '/api/talaqqi/feed.php', handleOptions],
  ['get', '/api/talaqqi/feed', handleFeed],
  ['get', '/api/talaqqi/feed.php', handleFeed],
  ['options', '/api/talaqqi/santri', handleOptions],
  ['options', '/api/talaqqi/santri.php', handleOptions],
  ['get', '/api/talaqqi/santri', handleSantri],
  ['get', '/api/talaqqi/santri.php', handleSantri],
  ['options', '/api/talaqqi/recording', handleOptions],
  ['options', '/api/talaqqi/recording.php', handleOptions],
  ['post', '/api/talaqqi/recording', upload.single('audio'), handleRecording],
  ['post', '/api/talaqqi/recording.php', upload.single('audio'), handleRecording],
  ['options', '/api/talaqqi/comment', handleOptions],
  ['options', '/api/talaqqi/comment.php', handleOptions],
  ['post', '/api/talaqqi/comment', upload.single('audio'), handleComment],
  ['post', '/api/talaqqi/comment.php', upload.single('audio'), handleComment],
  ['options', '/api/talaqqi/delete-recording', handleOptions],
  ['options', '/api/talaqqi/delete-recording.php', handleOptions],
  ['post', '/api/talaqqi/delete-recording', handleDeleteRecording],
  ['post', '/api/talaqqi/delete-recording.php', handleDeleteRecording],
  ['delete', '/api/talaqqi/delete-recording', handleDeleteRecording],
  ['delete', '/api/talaqqi/delete-recording.php', handleDeleteRecording],
  ['options', '/api/talaqqi/delete-comment', handleOptions],
  ['options', '/api/talaqqi/delete-comment.php', handleOptions],
  ['post', '/api/talaqqi/delete-comment', handleDeleteComment],
  ['post', '/api/talaqqi/delete-comment.php', handleDeleteComment],
  ['delete', '/api/talaqqi/delete-comment', handleDeleteComment],
  ['delete', '/api/talaqqi/delete-comment.php', handleDeleteComment],
  ['get', '/api/talaqqi/audio.php', handleAudio],
]

for (const [method, route, ...handlers] of routes) {
  app[method](route, ...handlers)
}

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/api/talaqqi/ws' })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const room = url.searchParams.get('room') || ROOM_ID
  if (room !== ROOM_ID) {
    ws.close(4001, 'Room tidak dikenal')
    return
  }
  wsClients.add(ws)
  ws.send(JSON.stringify({ type: 'hello', room: ROOM_ID, serverTime: Date.now() }))
  ws.on('close', () => wsClients.delete(ws))
  ws.on('error', () => wsClients.delete(ws))
})

server.listen(PORT, HOST, () => {
  console.log(`Talaqqi chat server: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
  console.log(`  REST:  /api/talaqqi/feed.php`)
  console.log(`  WS:    ws://localhost:${PORT}/api/talaqqi/ws`)
  console.log(`  Room:  ${ROOM_ID}`)
})
