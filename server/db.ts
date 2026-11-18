import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_CMS_STATE } from '../src/data/defaultCmsState.ts';
import type {
  ActivityLogItem,
  CmsSiteState,
  ContactMessage,
  DashboardOverview,
  MediaFolder,
  MediaItem,
  MessageStatus,
} from '../src/types/cms.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DB_PATH = path.join(DATA_DIR, 'portfolio.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS server_secrets (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS site_documents (
    doc_key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media_folders (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media_items (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    media_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    url TEXT NOT NULL,
    folder_id TEXT NOT NULL DEFAULT 'general',
    usage_location TEXT NOT NULL DEFAULT 'Library',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    service TEXT NOT NULL,
    budget TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function nowIso(): string {
  return new Date().toISOString();
}

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  const existing = db
    .prepare('SELECT value FROM server_secrets WHERE key = ?')
    .get('session_secret') as { value: string } | undefined;
  if (existing?.value) return existing.value;

  const generated = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO server_secrets (key, value) VALUES (?, ?)').run(
    'session_secret',
    generated
  );
  return generated;
}

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash: derived, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function deepMergeDefaults<T>(defaults: T, incoming: unknown): T {
  if (Array.isArray(defaults)) {
    return (Array.isArray(incoming) ? incoming : defaults) as T;
  }
  if (defaults && typeof defaults === 'object') {
    const out: Record<string, unknown> = {};
    const defObj = defaults as Record<string, unknown>;
    const incObj =
      incoming && typeof incoming === 'object' && !Array.isArray(incoming)
        ? (incoming as Record<string, unknown>)
        : {};
    for (const key of Object.keys(defObj)) {
      out[key] =
        key in incObj ? deepMergeDefaults(defObj[key], incObj[key]) : defObj[key];
    }
    return out as T;
  }
  return (incoming !== undefined ? incoming : defaults) as T;
}

export function bootstrapDatabase(): void {
  const ts = nowIso();

  // Seed default folders
  const defaultFolders = [
    { id: 'general', name: 'General Library' },
    { id: 'hero', name: 'Hero & Portrait' },
    { id: 'projects', name: 'Projects Media' },
    { id: 'gallery', name: 'Gallery Archive' },
    { id: 'services', name: 'Services & Icons' },
  ];
  const insertFolder = db.prepare(
    'INSERT OR IGNORE INTO media_folders (id, name, created_at) VALUES (?, ?, ?)'
  );
  for (const folder of defaultFolders) {
    insertFolder.run(folder.id, folder.name, ts);
  }

  // Seed draft and published documents if absent
  const publishedRow = db
    .prepare('SELECT doc_key FROM site_documents WHERE doc_key = ?')
    .get('published') as { doc_key: string } | undefined;
  const draftRow = db
    .prepare('SELECT doc_key FROM site_documents WHERE doc_key = ?')
    .get('draft') as { doc_key: string } | undefined;

  const serializedDefault = JSON.stringify(DEFAULT_CMS_STATE);
  if (!publishedRow) {
    db.prepare('INSERT INTO site_documents (doc_key, payload, updated_at) VALUES (?, ?, ?)').run(
      'published',
      serializedDefault,
      ts
    );
  }
  if (!draftRow) {
    db.prepare('INSERT INTO site_documents (doc_key, payload, updated_at) VALUES (?, ?, ?)').run(
      'draft',
      serializedDefault,
      ts
    );
  }

  // Seed default admin user when no admin exists yet
  const userCountRow = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as {
    count: number;
  };
  if (userCountRow.count === 0) {
    const email = (process.env.ADMIN_EMAIL || 'sinan906181@gmail.com').trim().toLowerCase();
    const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const { hash, salt } = process.env.ADMIN_PASSWORD
      ? hashPassword(process.env.ADMIN_PASSWORD)
      : {
          hash: 'dd1b8cefd7e5f74a502bf3a9cceae0e3ce9025a6f6c46ef30bd3dced52c523722191cb5b16cf77b79a7f5cc8166e417a60717867b68019ae86a30dbb5cd6604a',
          salt: '93784cac892f9abbfaa9470ce4e1dc68',
        };
    db.prepare(
      `INSERT INTO admin_users (id, email, username, password_hash, salt, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'ADMIN', ?, ?)`
    ).run(crypto.randomUUID(), email, username, hash, salt, ts, ts);
  }

  // Initial activity log & sample messages only on clean DB
  const logCount = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get() as {
    count: number;
  };
  if (logCount.count === 0) {
    logActivity('SYSTEM_INIT', 'Portfolio CMS', 'Initialized studio database and live configuration.');
  }

  const msgCount = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get() as {
    count: number;
  };
  if (msgCount.count === 0) {
    db.prepare(
      `INSERT INTO contact_messages (id, name, email, service, budget, message, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      crypto.randomUUID(),
      'Elena Vance',
      'elena@vespera.design',
      'Web Development',
      '$15,000 – $30,000',
      'We are launching a new monochrome digital flagship in Q4 and would love to discuss an interactive particle landing experience.',
      'NEW',
      '',
      ts,
      ts
    );
  }
}

export function logActivity(action: string, target: string, detail: string): void {
  db.prepare(
    'INSERT INTO activity_logs (id, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), action, target, detail, nowIso());
}

export function getSiteDocument(docKey: 'draft' | 'published'): {
  state: CmsSiteState;
  updatedAt: string | null;
} {
  const row = db
    .prepare('SELECT payload, updated_at FROM site_documents WHERE doc_key = ?')
    .get(docKey) as { payload: string; updated_at: string } | undefined;

  if (!row) {
    return { state: DEFAULT_CMS_STATE, updatedAt: null };
  }
  try {
    const parsed = JSON.parse(row.payload);
    return {
      state: deepMergeDefaults(DEFAULT_CMS_STATE, parsed),
      updatedAt: row.updated_at,
    };
  } catch {
    return { state: DEFAULT_CMS_STATE, updatedAt: row.updated_at };
  }
}

export function saveSiteDocument(docKey: 'draft' | 'published', nextState: CmsSiteState): string {
  const merged = deepMergeDefaults(DEFAULT_CMS_STATE, nextState);
  const ts = nowIso();
  db.prepare(
    `INSERT INTO site_documents (doc_key, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(doc_key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
  ).run(docKey, JSON.stringify(merged), ts);
  return ts;
}

export function hasAdminUsers(): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  return row.count > 0;
}

export function createAdminUser(params: {
  email: string;
  username: string;
  password: string;
}): { id: string; email: string; username: string } {
  const id = crypto.randomUUID();
  const ts = nowIso();
  const email = params.email.trim().toLowerCase();
  const username = params.username.trim().toLowerCase();
  const { hash, salt } = hashPassword(params.password);

  db.prepare(
    `INSERT INTO admin_users (id, email, username, password_hash, salt, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'ADMIN', ?, ?)`
  ).run(id, email, username, hash, salt, ts, ts);

  logActivity('ADMIN_CREATED', username, `Initialized admin account (${email})`);
  return { id, email, username };
}

export function authenticateAdmin(
  identifier: string,
  password: string
): { id: string; email: string; username: string } | null {
  const normalized = identifier.trim().toLowerCase();
  const user = db
    .prepare(
      'SELECT id, email, username, password_hash, salt FROM admin_users WHERE lower(email) = ? OR lower(username) = ?'
    )
    .get(normalized, normalized) as
    | {
        id: string;
        email: string;
        username: string;
        password_hash: string;
        salt: string;
      }
    | undefined;

  if (!user) return null;
  if (!verifyPassword(password, user.password_hash, user.salt)) return null;
  return { id: user.id, email: user.email, username: user.username };
}

export function authenticateAdminByPassword(
  password: string
): { id: string; email: string; username: string } | null {
  if (!password) return null;
  const users = db
    .prepare('SELECT id, email, username, password_hash, salt FROM admin_users')
    .all() as {
    id: string;
    email: string;
    username: string;
    password_hash: string;
    salt: string;
  }[];

  for (const user of users) {
    if (verifyPassword(password, user.password_hash, user.salt)) {
      return { id: user.id, email: user.email, username: user.username };
    }
  }
  return null;
}

export function updateAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): { ok: boolean; error?: string } {
  const user = db
    .prepare('SELECT id, password_hash, salt FROM admin_users WHERE id = ?')
    .get(userId) as { id: string; password_hash: string; salt: string } | undefined;
  if (!user) return { ok: false, error: 'Account not found.' };
  if (!verifyPassword(currentPassword, user.password_hash, user.salt)) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE admin_users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?').run(
    hash,
    salt,
    nowIso(),
    userId
  );
  logActivity('PASSWORD_CHANGED', 'Security', 'Updated admin account password.');
  return { ok: true };
}

export function signSessionToken(tokenId: string): string {
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(tokenId)
    .digest('hex');
  return `${tokenId}.${sig}`;
}

export function verifySignedToken(signedToken: string): string | null {
  const parts = signedToken.split('.');
  if (parts.length !== 2) return null;
  const [tokenId, providedSig] = parts;
  if (!tokenId || !providedSig) return null;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(tokenId)
    .digest('hex');
  const a = Buffer.from(providedSig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length || a.length === 0) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return tokenId;
}

export function createSession(userId: string): { signedToken: string; expiresAt: string } {
  const tokenId = crypto.randomUUID();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO admin_sessions (token_id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(tokenId, userId, expiresAt, createdAt);
  return { signedToken: signSessionToken(tokenId), expiresAt };
}

export function getSessionUser(signedToken: string | undefined | null): {
  id: string;
  email: string;
  username: string;
} | null {
  if (!signedToken) return null;
  const tokenId = verifySignedToken(signedToken);
  if (!tokenId) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.email, u.username, s.expires_at
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_id = ?`
    )
    .get(tokenId) as
    | { id: string; email: string; username: string; expires_at: string }
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM admin_sessions WHERE token_id = ?').run(tokenId);
    return null;
  }
  return { id: row.id, email: row.email, username: row.username };
}

export function deleteSession(signedToken: string | undefined | null): void {
  if (!signedToken) return;
  const tokenId = verifySignedToken(signedToken);
  if (tokenId) {
    db.prepare('DELETE FROM admin_sessions WHERE token_id = ?').run(tokenId);
  }
}

export function listMediaFolders(): MediaFolder[] {
  return db
    .prepare('SELECT id, name, created_at as createdAt FROM media_folders ORDER BY name ASC')
    .all() as unknown as MediaFolder[];
}

export function createMediaFolder(name: string): MediaFolder {
  const id = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `folder-${Date.now()}`;
  const ts = nowIso();
  db.prepare('INSERT INTO media_folders (id, name, created_at) VALUES (?, ?, ?)').run(
    id,
    name.trim(),
    ts
  );
  logActivity('FOLDER_CREATED', name.trim(), 'Created new media folder.');
  return { id, name: name.trim(), createdAt: ts };
}

export function deleteMediaFolder(folderId: string): void {
  if (folderId === 'general') return;
  db.prepare("UPDATE media_items SET folder_id = 'general' WHERE folder_id = ?").run(folderId);
  db.prepare('DELETE FROM media_folders WHERE id = ?').run(folderId);
  logActivity('FOLDER_DELETED', folderId, 'Deleted media folder and moved assets to General Library.');
}

export function listMediaItems(): MediaItem[] {
  return db
    .prepare(
      `SELECT id, filename, original_name as originalName, mime_type as mimeType,
              media_type as mediaType, size_bytes as sizeBytes, url,
              folder_id as folderId, usage_location as usageLocation,
              created_at as createdAt, updated_at as updatedAt
       FROM media_items ORDER BY created_at DESC`
    )
    .all() as unknown as MediaItem[];
}

export function getMediaItemById(id: string): MediaItem | undefined {
  return db
    .prepare(
      `SELECT id, filename, original_name as originalName, mime_type as mimeType,
              media_type as mediaType, size_bytes as sizeBytes, url,
              folder_id as folderId, usage_location as usageLocation,
              created_at as createdAt, updated_at as updatedAt
       FROM media_items WHERE id = ?`
    )
    .get(id) as MediaItem | undefined;
}

export function insertMediaItem(item: MediaItem): MediaItem {
  db.prepare(
    `INSERT INTO media_items (id, filename, original_name, mime_type, media_type, size_bytes, url, folder_id, usage_location, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    item.id,
    item.filename,
    item.originalName,
    item.mimeType,
    item.mediaType,
    item.sizeBytes,
    item.url,
    item.folderId,
    item.usageLocation,
    item.createdAt,
    item.updatedAt
  );
  logActivity('MEDIA_UPLOADED', item.originalName, `Uploaded ${item.mediaType} to ${item.folderId}`);
  return item;
}

export function updateMediaItemRecord(
  id: string,
  updates: Partial<{
    filename: string;
    originalName: string;
    mimeType: string;
    mediaType: 'image' | 'video';
    sizeBytes: number;
    url: string;
    folderId: string;
    usageLocation: string;
  }>
): MediaItem | undefined {
  const existing = getMediaItemById(id);
  if (!existing) return undefined;
  const next: MediaItem = {
    ...existing,
    ...updates,
    updatedAt: nowIso(),
  };
  db.prepare(
    `UPDATE media_items
     SET filename = ?, original_name = ?, mime_type = ?, media_type = ?,
         size_bytes = ?, url = ?, folder_id = ?, usage_location = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    next.filename,
    next.originalName,
    next.mimeType,
    next.mediaType,
    next.sizeBytes,
    next.url,
    next.folderId,
    next.usageLocation,
    next.updatedAt,
    id
  );
  logActivity('MEDIA_UPDATED', next.originalName, 'Updated media metadata or replaced file.');
  return next;
}

export function deleteMediaItemRecord(id: string): MediaItem | undefined {
  const existing = getMediaItemById(id);
  if (!existing) return undefined;
  db.prepare('DELETE FROM media_items WHERE id = ?').run(id);
  logActivity('MEDIA_DELETED', existing.originalName, 'Deleted media asset from library.');
  return existing;
}

export function listContactMessages(): ContactMessage[] {
  return db
    .prepare(
      `SELECT id, name, email, service, budget, message, status, notes,
              created_at as createdAt, updated_at as updatedAt
       FROM contact_messages ORDER BY created_at DESC`
    )
    .all() as unknown as ContactMessage[];
}

export function createContactMessage(input: {
  name: string;
  email: string;
  service: string;
  budget: string;
  message: string;
}): ContactMessage {
  const id = crypto.randomUUID();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO contact_messages (id, name, email, service, budget, message, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'NEW', '', ?, ?)`
  ).run(id, input.name, input.email, input.service, input.budget, input.message, ts, ts);
  logActivity('CONTACT_RECEIVED', input.name, `Inquiry received for ${input.service}`);
  return {
    id,
    name: input.name,
    email: input.email,
    service: input.service,
    budget: input.budget,
    message: input.message,
    status: 'NEW',
    notes: '',
    createdAt: ts,
    updatedAt: ts,
  };
}

export function updateContactMessageRecord(
  id: string,
  updates: { status?: MessageStatus; notes?: string }
): ContactMessage | undefined {
  const existing = db
    .prepare(
      `SELECT id, name, email, service, budget, message, status, notes,
              created_at as createdAt, updated_at as updatedAt
       FROM contact_messages WHERE id = ?`
    )
    .get(id) as ContactMessage | undefined;
  if (!existing) return undefined;
  const nextStatus = updates.status || existing.status;
  const nextNotes = updates.notes !== undefined ? updates.notes : existing.notes;
  const ts = nowIso();
  db.prepare('UPDATE contact_messages SET status = ?, notes = ?, updated_at = ? WHERE id = ?').run(
    nextStatus,
    nextNotes,
    ts,
    id
  );
  logActivity('MESSAGE_UPDATED', existing.name, `Marked message status as ${nextStatus}`);
  return { ...existing, status: nextStatus, notes: nextNotes, updatedAt: ts };
}

export function deleteContactMessageRecord(id: string): boolean {
  const existing = db
    .prepare('SELECT id, name FROM contact_messages WHERE id = ?')
    .get(id) as { id: string; name: string } | undefined;
  if (!existing) return false;
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);
  logActivity('MESSAGE_DELETED', existing.name, 'Removed inquiry from inbox.');
  return true;
}

export function listRecentActivity(limit = 40): ActivityLogItem[] {
  return db
    .prepare(
      'SELECT id, action, target, detail, created_at as createdAt FROM activity_logs ORDER BY created_at DESC LIMIT ?'
    )
    .all(limit) as unknown as ActivityLogItem[];
}

export function getDashboardOverview(): DashboardOverview {
  const draftDoc = getSiteDocument('draft');
  const publishedDoc = getSiteDocument('published');
  const media = listMediaItems();
  const messages = listContactMessages();
  const activity = listRecentActivity(35);

  const hasUnpublishedChanges =
    JSON.stringify(draftDoc.state) !== JSON.stringify(publishedDoc.state);

  return {
    counts: {
      projects: draftDoc.state.projects.items.length,
      skills: draftDoc.state.skills.items.length,
      services: draftDoc.state.services.items.length,
      media: media.length,
      messages: messages.length,
      unreadMessages: messages.filter((m) => m.status === 'NEW').length,
      galleryItems: draftDoc.state.gallery.items.length,
    },
    websiteStatus: publishedDoc.state.settings.maintenanceMode ? 'MAINTENANCE' : 'LIVE',
    hasUnpublishedChanges,
    lastPublishedAt: publishedDoc.updatedAt,
    lastDraftUpdatedAt: draftDoc.updatedAt,
    recentMedia: media.slice(0, 6),
    recentMessages: messages.slice(0, 6),
    recentActivity: activity,
    draft: draftDoc.state,
    published: publishedDoc.state,
  };
}
