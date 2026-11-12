// Genera le icone PWA (PNG) senza dipendenze esterne.
// Disegno: quadrato arrotondato color sabbia con una piccola rete di nodi (atlante dei significati).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function png(size, draw) {
  const px = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x / size, y / size)
      const i = (y * size + x) * 4
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
      px[i + 3] = a
    }
  }
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const sand = [246, 242, 233]
const ink = [37, 48, 74]
const green = [63, 125, 110]
const amber = [226, 160, 63]
const blue = [91, 127, 184]

const nodes = [
  { x: 0.5, y: 0.3, r: 0.085, c: green },
  { x: 0.29, y: 0.63, r: 0.075, c: amber },
  { x: 0.71, y: 0.63, r: 0.075, c: blue },
  { x: 0.5, y: 0.78, r: 0.05, c: ink },
]
const edges = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 3],
]

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  const ex = ax + t * dx - px
  const ey = ay + t * dy - py
  return Math.hypot(ex, ey)
}

const draw = (u, v) => {
  // angoli arrotondati
  const m = 0.03
  const rad = 0.2
  const cx = Math.min(Math.max(u, m + rad), 1 - m - rad)
  const cy = Math.min(Math.max(v, m + rad), 1 - m - rad)
  const inside =
    u > m && u < 1 - m && v > m && v < 1 - m && Math.hypot(u - cx, v - cy) <= rad + 0.0001
  if (!inside) return [0, 0, 0, 0]
  let col = sand
  for (const [a, b] of edges) {
    if (segDist(u, v, nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y) < 0.022) col = ink
  }
  for (const n of nodes) {
    if (Math.hypot(u - n.x, v - n.y) < n.r) col = n.c
  }
  return [...col, 255]
}

mkdirSync('public/icons', { recursive: true })
for (const size of [192, 512, 180, 32]) {
  writeFileSync(`public/icons/icon-${size}.png`, png(size, draw))
}
console.log('icons written')
