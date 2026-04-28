import initSqlJs, {
  type Database,
  type QueryExecResult,
  type SqlJsStatic,
} from 'sql.js'

export interface CatalogSummary {
  songs: number
  albums: number
  singers: number
  poets: number
  composers: number
  distributers: number
  featuredSong: string | null
}

export interface SongListItem {
  id: number
  name: string
  lyricsPreview: string | null
  audioPath: string | null
  singerName: string | null
  albumName: string | null
  albumImage: string | null
  poetName: string | null
  composerName: string | null
  distributerName: string | null
  catalogPlayCount: number
  catalogIsFavorite: boolean
}

export interface AlbumListItem {
  id: number
  name: string
  image: string | null
  catalogPlayCount: number
  catalogIsFavorite: boolean
  songCount: number
}

export interface SongDetails extends SongListItem {
  lyrics: string | null
  chordPath: string | null
  notePath: string | null
  pptPicturePath: string | null
  pptWordPath: string | null
  singerId: number | null
  albumId: number | null
  poetId: number | null
  composerId: number | null
  distributerId: number | null
  poetName: string | null
  composerName: string | null
  distributerName: string | null
}

export interface SongSearchResult {
  query: string
  total: number
  songs: SongListItem[]
}

export interface SongSearchParams {
  songName?: string
  songWords?: string
  singerName?: string
  albumName?: string
}

export const expectedCatalogPath = `${import.meta.env.BASE_URL}data/songs_v2.db`

const SOURCE_BASE_URL = 'https://www.taranimarabia.org/'
const AUDIO_BASE_URL = `${SOURCE_BASE_URL}music/`
const ALBUM_IMAGE_BASE_URL = `${SOURCE_BASE_URL}images/album/`
const WASM_ASSET_URL = `${import.meta.env.BASE_URL}sql-wasm.wasm?v=tranem-web-1`

let sqlPromise: Promise<SqlJsStatic> | null = null
let catalogDbPromise: Promise<Database> | null = null

function getSqlRuntime() {
  if (!sqlPromise) {
    sqlPromise = loadSqlRuntime()
  }

  return sqlPromise
}

async function loadSqlRuntime(): Promise<SqlJsStatic> {
  const response = await fetch(WASM_ASSET_URL, {
    cache: 'reload',
  })

  if (!response.ok) {
    throw new Error(`sql.js wasm runtime not found at ${WASM_ASSET_URL}`)
  }

  const wasmBinary = await response.arrayBuffer()
  const wasmBytes = new Uint8Array(wasmBinary)
  const hasWasmMagic =
    wasmBytes[0] === 0x00 &&
    wasmBytes[1] === 0x61 &&
    wasmBytes[2] === 0x73 &&
    wasmBytes[3] === 0x6d

  if (!hasWasmMagic) {
    throw new Error(
      `Expected WebAssembly at ${WASM_ASSET_URL}, but received a different file.`,
    )
  }

  return initSqlJs({ wasmBinary })
}

async function getCatalogDatabase(): Promise<Database> {
  if (catalogDbPromise) {
    return catalogDbPromise
  }

  catalogDbPromise = openCatalogDatabase()
  return catalogDbPromise
}

async function openCatalogDatabase(): Promise<Database> {
  const response = await fetch(expectedCatalogPath)

  if (!response.ok) {
    throw new Error(`Catalog not found at ${expectedCatalogPath}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const SQL = await getSqlRuntime()
  return new SQL.Database(bytes)
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
}

function firstResult(db: Database, query: string): QueryExecResult | undefined {
  return db.exec(query)[0]
}

function readNumber(db: Database, query: string): number {
  const result = firstResult(db, query)
  return Number(result?.values?.[0]?.[0] ?? 0)
}

function readString(db: Database, query: string): string | null {
  const result = firstResult(db, query)
  const value = result?.values?.[0]?.[0]
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown): number {
  return Number(value ?? 0)
}

function asNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function toSongListItem(row: Record<string, unknown>): SongListItem {
  const lyrics = asNullableString(row.song_words)

  return {
    id: asNumber(row.id),
    name: asString(row.name),
    lyricsPreview: lyrics ? lyrics.replace(/\s+/g, ' ').slice(0, 140) : null,
    audioPath: asNullableString(row.audio_mp3),
    singerName: asNullableString(row.singer_name),
    albumName: asNullableString(row.album_name),
    albumImage: asNullableString(row.album_image),
    poetName: asNullableString(row.poet_name),
    composerName: asNullableString(row.composer_name),
    distributerName: asNullableString(row.distributer_name),
    catalogPlayCount: asNumber(row.play_count),
    catalogIsFavorite: asNumber(row.is_favorite) === 1,
  }
}

function toAlbumListItem(row: Record<string, unknown>): AlbumListItem {
  return {
    id: asNumber(row.id),
    name: asString(row.name),
    image: asNullableString(row.image),
    catalogPlayCount: asNumber(row.play_count),
    catalogIsFavorite: asNumber(row.is_favorite) === 1,
    songCount: asNumber(row.song_count),
  }
}

function baseSongSelect() {
  return `
    SELECT s.id,
           s.name,
           s.song_words,
           s.audio_mp3,
           s.song_chord,
           s.song_note,
           s.song_pptpicture,
           s.song_pptword,
           s.singer_id,
           s.album_id,
           s.poet_id,
           s.composer_id,
           s.distributer_id,
           s.play_count,
           s.is_favorite,
           si.name AS singer_name,
           a.name AS album_name,
           a.image AS album_image,
           p.name AS poet_name,
           c.name AS composer_name,
           d.name AS distributer_name
    FROM songs s
    LEFT JOIN singers si ON s.singer_id = si.id
    LEFT JOIN albums a ON s.album_id = a.id
    LEFT JOIN poets p ON s.poet_id = p.id
    LEFT JOIN composers c ON s.composer_id = c.id
    LEFT JOIN distributers d ON s.distributer_id = d.id
  `
}

function baseAlbumSelect() {
  return `
    SELECT a.id,
           a.name,
           a.image,
           a.play_count,
           a.is_favorite,
           COUNT(s.id) AS song_count
    FROM albums a
    LEFT JOIN songs s ON s.album_id = a.id
  `
}

function broadSearchWhereClause() {
  return `
    WHERE :query = ''
       OR s.name_norm LIKE :likeQuery
       OR s.words_norm LIKE :likeQuery
       OR si.name_norm LIKE :likeQuery
       OR a.name_norm LIKE :likeQuery
  `
}

function advancedSearchWhereClause() {
  return `
    WHERE (:songName = '' OR s.name_norm LIKE :songNameLike)
      AND (:songWords = '' OR s.words_norm LIKE :songWordsLike)
      AND (:singerName = '' OR si.name_norm LIKE :singerNameLike)
      AND (:albumName = '' OR a.name_norm LIKE :albumNameLike)
  `
}

export async function getCatalogSummary(): Promise<CatalogSummary> {
  const db = await getCatalogDatabase()

  return {
    songs: readNumber(db, 'SELECT COUNT(*) FROM songs'),
    albums: readNumber(db, 'SELECT COUNT(*) FROM albums'),
    singers: readNumber(db, 'SELECT COUNT(*) FROM singers'),
    poets: readNumber(db, 'SELECT COUNT(*) FROM poets'),
    composers: readNumber(db, 'SELECT COUNT(*) FROM composers'),
    distributers: readNumber(db, 'SELECT COUNT(*) FROM distributers'),
    featuredSong: readString(
      db,
      "SELECT name FROM songs WHERE name IS NOT NULL AND name != '' ORDER BY is_favorite DESC, play_count DESC, name ASC LIMIT 1",
    ),
  }
}

export async function searchSongs(
  query: string,
  limit = 80,
): Promise<SongSearchResult> {
  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const params = {
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
  }

  const countStmt = db.prepare(`
    SELECT COUNT(*) AS total
    FROM songs s
    LEFT JOIN singers si ON s.singer_id = si.id
    LEFT JOIN albums a ON s.album_id = a.id
    ${broadSearchWhereClause()}
  `)

  countStmt.bind(params)
  const total = countStmt.step()
    ? asNumber(countStmt.getAsObject().total)
    : 0
  countStmt.free()

  const stmt = db.prepare(`
    ${baseSongSelect()}
    ${broadSearchWhereClause()}
    ORDER BY s.is_favorite DESC, s.play_count DESC, s.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ...params,
    ':limit': limit,
  })

  const songs: SongListItem[] = []
  while (stmt.step()) {
    songs.push(toSongListItem(stmt.getAsObject()))
  }
  stmt.free()

  return {
    query: normalizedQuery,
    total,
    songs,
  }
}

export async function advancedSearchSongs(
  search: SongSearchParams,
  limit = 80,
): Promise<SongSearchResult> {
  const db = await getCatalogDatabase()
  const songName = normalizeSearch(search.songName ?? '')
  const songWords = normalizeSearch(search.songWords ?? '')
  const singerName = normalizeSearch(search.singerName ?? '')
  const albumName = normalizeSearch(search.albumName ?? '')
  const params = {
    ':songName': songName,
    ':songNameLike': `%${songName}%`,
    ':songWords': songWords,
    ':songWordsLike': `%${songWords}%`,
    ':singerName': singerName,
    ':singerNameLike': `%${singerName}%`,
    ':albumName': albumName,
    ':albumNameLike': `%${albumName}%`,
  }

  const countStmt = db.prepare(`
    SELECT COUNT(*) AS total
    FROM songs s
    LEFT JOIN singers si ON s.singer_id = si.id
    LEFT JOIN albums a ON s.album_id = a.id
    ${advancedSearchWhereClause()}
  `)

  countStmt.bind(params)
  const total = countStmt.step()
    ? asNumber(countStmt.getAsObject().total)
    : 0
  countStmt.free()

  const stmt = db.prepare(`
    ${baseSongSelect()}
    ${advancedSearchWhereClause()}
    ORDER BY s.is_favorite DESC, s.play_count DESC, s.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ...params,
    ':limit': limit,
  })

  const songs: SongListItem[] = []
  while (stmt.step()) {
    songs.push(toSongListItem(stmt.getAsObject()))
  }
  stmt.free()

  return {
    query: [songName, songWords, singerName, albumName].filter(Boolean).join(' '),
    total,
    songs,
  }
}

export async function searchAlbums(
  query: string,
  limit = 80,
): Promise<AlbumListItem[]> {
  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const stmt = db.prepare(`
    ${baseAlbumSelect()}
    WHERE :query = '' OR a.name_norm LIKE :likeQuery
    GROUP BY a.id, a.name, a.image, a.play_count, a.is_favorite
    ORDER BY a.is_favorite DESC, a.play_count DESC, a.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
    ':limit': limit,
  })

  const albums: AlbumListItem[] = []
  while (stmt.step()) {
    albums.push(toAlbumListItem(stmt.getAsObject()))
  }
  stmt.free()

  return albums
}

export async function getAlbumsByIds(
  albumIds: number[],
  query = '',
): Promise<AlbumListItem[]> {
  const ids = [...new Set(albumIds)].filter((id) => Number.isFinite(id))
  if (ids.length === 0) {
    return []
  }

  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const idPlaceholders = ids.map((_, index) => `:id${index}`).join(', ')
  const stmt = db.prepare(`
    ${baseAlbumSelect()}
    WHERE a.id IN (${idPlaceholders})
      AND (:query = '' OR a.name_norm LIKE :likeQuery)
    GROUP BY a.id, a.name, a.image, a.play_count, a.is_favorite
    ORDER BY a.is_favorite DESC, a.play_count DESC, a.name ASC
  `)

  stmt.bind({
    ...Object.fromEntries(ids.map((id, index) => [`:id${index}`, id])),
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
  })

  const albums: AlbumListItem[] = []
  while (stmt.step()) {
    albums.push(toAlbumListItem(stmt.getAsObject()))
  }
  stmt.free()

  return albums
}

export async function getFavoriteAlbums(
  query = '',
  limit = 80,
): Promise<AlbumListItem[]> {
  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const stmt = db.prepare(`
    ${baseAlbumSelect()}
    WHERE a.is_favorite = 1
      AND (:query = '' OR a.name_norm LIKE :likeQuery)
    GROUP BY a.id, a.name, a.image, a.play_count, a.is_favorite
    ORDER BY a.is_favorite DESC, a.play_count DESC, a.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
    ':limit': limit,
  })

  const albums: AlbumListItem[] = []
  while (stmt.step()) {
    albums.push(toAlbumListItem(stmt.getAsObject()))
  }
  stmt.free()

  return albums
}

export async function getMostPlayedAlbums(
  query = '',
  limit = 80,
): Promise<AlbumListItem[]> {
  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const stmt = db.prepare(`
    ${baseAlbumSelect()}
    WHERE a.play_count > 0
      AND (:query = '' OR a.name_norm LIKE :likeQuery)
    GROUP BY a.id, a.name, a.image, a.play_count, a.is_favorite
    ORDER BY a.is_favorite DESC, a.play_count DESC, a.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
    ':limit': limit,
  })

  const albums: AlbumListItem[] = []
  while (stmt.step()) {
    albums.push(toAlbumListItem(stmt.getAsObject()))
  }
  stmt.free()

  return albums
}

export async function getAlbumById(albumId: number): Promise<AlbumListItem | null> {
  const db = await getCatalogDatabase()
  const stmt = db.prepare(`
    ${baseAlbumSelect()}
    WHERE a.id = :albumId
    GROUP BY a.id, a.name, a.image, a.play_count, a.is_favorite
    LIMIT 1
  `)

  stmt.bind({ ':albumId': albumId })

  if (!stmt.step()) {
    stmt.free()
    return null
  }

  const album = toAlbumListItem(stmt.getAsObject())
  stmt.free()
  return album
}

export async function getSongsByAlbumId(
  albumId: number,
  limit = 120,
): Promise<SongListItem[]> {
  const db = await getCatalogDatabase()
  const stmt = db.prepare(`
    ${baseSongSelect()}
    WHERE s.album_id = :albumId
    ORDER BY s.is_favorite DESC, s.play_count DESC, s.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ':albumId': albumId,
    ':limit': limit,
  })

  const songs: SongListItem[] = []
  while (stmt.step()) {
    songs.push(toSongListItem(stmt.getAsObject()))
  }
  stmt.free()

  return songs
}

export async function getSongsByIds(
  songIds: number[],
  query = '',
): Promise<SongListItem[]> {
  const ids = [...new Set(songIds)].filter((id) => Number.isFinite(id))
  if (ids.length === 0) {
    return []
  }

  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const idPlaceholders = ids.map((_, index) => `:id${index}`).join(', ')
  const stmt = db.prepare(`
    ${baseSongSelect()}
    WHERE s.id IN (${idPlaceholders})
      AND (:query = '' OR s.name_norm LIKE :likeQuery)
    ORDER BY s.is_favorite DESC, s.play_count DESC, s.name ASC
  `)

  stmt.bind({
    ...Object.fromEntries(ids.map((id, index) => [`:id${index}`, id])),
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
  })

  const songs: SongListItem[] = []
  while (stmt.step()) {
    songs.push(toSongListItem(stmt.getAsObject()))
  }
  stmt.free()

  return songs
}

export async function getFavoriteSongs(
  query = '',
  limit = 80,
): Promise<SongListItem[]> {
  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const stmt = db.prepare(`
    ${baseSongSelect()}
    WHERE s.is_favorite = 1
      AND (:query = '' OR s.name_norm LIKE :likeQuery)
    ORDER BY s.is_favorite DESC, s.play_count DESC, s.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
    ':limit': limit,
  })

  const songs: SongListItem[] = []
  while (stmt.step()) {
    songs.push(toSongListItem(stmt.getAsObject()))
  }
  stmt.free()

  return songs
}

export async function getMostPlayedSongs(
  query = '',
  limit = 80,
): Promise<SongListItem[]> {
  const db = await getCatalogDatabase()
  const normalizedQuery = normalizeSearch(query)
  const stmt = db.prepare(`
    ${baseSongSelect()}
    WHERE s.play_count > 0
      AND (:query = '' OR s.name_norm LIKE :likeQuery)
    ORDER BY s.is_favorite DESC, s.play_count DESC, s.name ASC
    LIMIT :limit
  `)

  stmt.bind({
    ':query': normalizedQuery,
    ':likeQuery': `%${normalizedQuery}%`,
    ':limit': limit,
  })

  const songs: SongListItem[] = []
  while (stmt.step()) {
    songs.push(toSongListItem(stmt.getAsObject()))
  }
  stmt.free()

  return songs
}

export async function getSongById(songId: number): Promise<SongDetails | null> {
  const db = await getCatalogDatabase()
  const stmt = db.prepare(`
    ${baseSongSelect()}
    WHERE s.id = :songId
    LIMIT 1
  `)

  stmt.bind({ ':songId': songId })

  if (!stmt.step()) {
    stmt.free()
    return null
  }

  const row = stmt.getAsObject()
  stmt.free()
  const listItem = toSongListItem(row)

  return {
    ...listItem,
    lyrics: asNullableString(row.song_words),
    chordPath: asNullableString(row.song_chord),
    notePath: asNullableString(row.song_note),
    pptPicturePath: asNullableString(row.song_pptpicture),
    pptWordPath: asNullableString(row.song_pptword),
    singerId: asNullableNumber(row.singer_id),
    albumId: asNullableNumber(row.album_id),
    poetId: asNullableNumber(row.poet_id),
    composerId: asNullableNumber(row.composer_id),
    distributerId: asNullableNumber(row.distributer_id),
    poetName: asNullableString(row.poet_name),
    composerName: asNullableString(row.composer_name),
    distributerName: asNullableString(row.distributer_name),
  }
}

export function getAudioUrl(path: string | null) {
  return path ? `${AUDIO_BASE_URL}${path}` : null
}

export function getAlbumImageUrl(path: string | null) {
  return path ? `${ALBUM_IMAGE_BASE_URL}${path}` : null
}
