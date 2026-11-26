/* Little Grove — meal photos. They're kept in the browser's own database on this device (they're far too big
   for the rest of your data), made smaller when you add them, and included in backups. */
'use strict';

const PH = { db: null, urls: new Map(), pending: new Map() }; // pending: photo id → timer, for photos waiting out an Undo
const PHOTO_MAX = 1200;   // longest side of the photo you see when you open a meal
const THUMB_MAX = 480;    // the small one for tiles

function phDb() {
  if (PH.db) return PH.db;
  PH.db = new Promise((resolve, reject) => {
    let r;
    try { r = indexedDB.open('little-grove', 1); } catch (e) { reject(e); return; }
    r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos'); };
    r.onsuccess = () => { const db = r.result; db.onversionchange = () => { db.close(); PH.db = null; }; resolve(db); };
    r.onerror = () => { PH.db = null; reject(r.error); };
    r.onblocked = () => { PH.db = null; reject(new Error('blocked')); };
  });
  return PH.db;
}
async function phDo(mode, fn) {
  const db = await phDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode);
    let out;
    const req = fn(tx.objectStore('photos'));
    if (req) req.onsuccess = () => { out = req.result; };
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('aborted'));
  });
}
// Photos are kept as plain bytes, not Blobs: Safari in private mode and some older iPhones can't keep a Blob in the database.
const toBuf = b => (typeof b.arrayBuffer === 'function' ? b.arrayBuffer() : new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsArrayBuffer(b);
}));
async function packRec(rec) {
  const out = {};
  for (const k of ['full', 'thumb']) if (rec && rec[k]) out[k] = { b: await toBuf(rec[k]), t: rec[k].type || 'image/jpeg' };
  return out;
}
function unpackRec(rec) {
  if (!rec) return rec;
  const out = {};
  for (const k of ['full', 'thumb']) {
    const v = rec[k];
    if (v instanceof Blob) out[k] = v;
    else if (v && v.b) out[k] = new Blob([v.b], { type: v.t || 'image/jpeg' });
  }
  return out.full ? out : null;
}
const phGet = async id => unpackRec(await phDo('readonly', s => s.get(id)));
const phPut = async (id, rec) => { const packed = await packRec(rec); return phDo('readwrite', s => s.put(packed, id)); };
const phKeys = () => phDo('readonly', s => s.getAllKeys());
const phClear = () => phDo('readwrite', s => s.clear());
async function phDel(id) {
  forgetPhoto(id);
  try { await phDo('readwrite', s => s.delete(id)); } catch (e) { /* already gone */ }
}

/* ---------- making photos smaller ---------- */
function imageFrom(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn’t a photo Little Grove can open.')); };
    img.src = url;
  });
}
// Halves the size a step at a time, so big phone photos stay crisp when they shrink.
function scaled(img, max, q) {
  const w0 = img.naturalWidth, h0 = img.naturalHeight;
  const k = Math.min(1, max / Math.max(w0, h0));
  const W = Math.max(1, Math.round(w0 * k)), H = Math.max(1, Math.round(h0 * k));
  let src = img, sw = w0, sh = h0;
  while (sw / 2 > W * 1.2) {
    const c = document.createElement('canvas');
    c.width = Math.round(sw / 2);
    c.height = Math.round(sh / 2);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    src = c; sw = c.width; sh = c.height;
  }
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const g = out.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, W, H);
  return new Promise((resolve, reject) => out.toBlob(b => (b ? resolve(b) : reject(new Error('Couldn’t make the photo smaller.'))), 'image/jpeg', q));
}
// A photo from the camera or your library, ready to keep: { full, thumb, w, h }.
async function makePhoto(file) {
  if (!file || (file.type && !/^image\//.test(file.type))) throw new Error('That file isn’t a photo.');
  const { img, url } = await imageFrom(file);
  try {
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('That photo looks empty.');
    const full = await scaled(img, PHOTO_MAX, 0.8);
    const thumb = await scaled(img, THUMB_MAX, 0.74);
    const k = Math.min(1, PHOTO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    return { full, thumb, w: Math.round(img.naturalWidth * k), h: Math.round(img.naturalHeight * k) };
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- showing them ---------- */
const photoKey = (id, size) => `${id}:${size}`;
const photoNow = (id, size = 'thumb') => PH.urls.get(photoKey(id, size)) || '';
async function photoUrl(id, size = 'thumb') {
  const k = photoKey(id, size);
  if (PH.urls.has(k)) return PH.urls.get(k);
  const rec = await phGet(id);
  if (!rec) return '';
  const blob = rec[size] || rec.full;
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  PH.urls.set(k, url);
  return url;
}
function forgetPhoto(id) {
  for (const size of ['thumb', 'full']) {
    const k = photoKey(id, size), url = PH.urls.get(k);
    if (url) { URL.revokeObjectURL(url); PH.urls.delete(k); }
  }
}
// <img> for a stored photo: shows straight away when it's been seen before, else fillPhotos loads it.
function photoImg(id, alt, size = 'thumb') {
  const src = photoNow(id, size);
  return `<img data-photo="${id}" data-size="${size}" alt="${esc(alt)}"${src ? ` src="${src}"` : ''} decoding="async">`;
}
async function fillPhotos(root) {
  for (const img of $$('img[data-photo]', root)) {
    if (img.getAttribute('src')) continue;
    let url = '';
    try { url = await photoUrl(img.dataset.photo, img.dataset.size || 'thumb'); } catch (e) { url = ''; }
    if (!img.isConnected) continue;
    if (url) img.src = url;
    else img.closest('[data-ph]') && img.closest('[data-ph]').classList.add('no-photo');
  }
}

/* ---------- tidying, backups ---------- */
const photosInUse = () => new Set(S.meals.map(m => m.photo).filter(Boolean));
// Removes photos no meal uses. Photos waiting out an Undo are left alone.
async function tidyPhotos() {
  try {
    const used = photosInUse();
    for (const k of await phKeys()) if (!used.has(k) && !PH.pending.has(k)) await phDel(k);
  } catch (e) { /* no photo storage on this device */ }
}
// A deleted meal's photo goes once the chance to undo has passed (if no meal has it again by then).
// One timer per photo: deleting the same meal again restarts its wait rather than adding a second, earlier one.
function dropPhotoLater(id, ms = 9000) {
  if (!id) return;
  clearTimeout(PH.pending.get(id));
  PH.pending.set(id, setTimeout(() => {
    PH.pending.delete(id);
    if (!photosInUse().has(id)) phDel(id);
  }, ms));
}
const blobToDataUrl = blob => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});
function dataUrlToBlob(s) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''));
  if (!m) return null;
  const bin = atob(m[2]);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: m[1] });
}
// The photos the meals use, as text for a backup file: [[id, full, thumb], …].
async function photosForBackup() {
  const out = [];
  for (const id of photosInUse()) {
    let rec = null;
    try { rec = await phGet(id); } catch (e) { rec = null; }
    if (!rec || !rec.full) continue;
    out.push([id, await blobToDataUrl(rec.full), rec.thumb ? await blobToDataUrl(rec.thumb) : '']);
  }
  return out;
}
// Puts a backup's photos back. Returns how many were restored.
async function restorePhotos(list) {
  let n = 0;
  for (const x of Array.isArray(list) ? list : []) {
    if (!Array.isArray(x)) continue;
    const id = cleanRef(x[0]), full = dataUrlToBlob(x[1]);
    if (!id || !full) continue;
    const thumb = dataUrlToBlob(x[2]) || full;
    forgetPhoto(id);
    await phPut(id, { full, thumb });
    n++;
  }
  return n;
}
const fmtBytes = n => (n >= 1048576 ? `${(n / 1048576).toFixed(n >= 1048576 * 10 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
