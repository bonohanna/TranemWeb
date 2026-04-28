import { useDeferredValue, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AlbumList from '../components/AlbumList'
import SearchBox from '../components/SearchBox'
import SongList from '../components/SongList'
import {
  getAlbumsByIds,
  getFavoriteAlbums,
  getFavoriteSongs,
  getSongsByIds,
  type AlbumListItem,
  type SongListItem,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

type LoadState = 'loading' | 'ready' | 'error'
type FavoriteTab = 'songs' | 'albums'

function FavoritesPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<FavoriteTab>('songs')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const favoriteSongIds = useUserLibraryStore((state) => state.favoriteSongIds)
  const favoriteAlbumIds = useUserLibraryStore((state) => state.favoriteAlbumIds)
  const [songs, setSongs] = useState<SongListItem[]>([])
  const [albums, setAlbums] = useState<AlbumListItem[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setStatus('loading')
      setError(null)

      const resultPromise =
        activeTab === 'songs'
          ? Promise.all([
              getSongsByIds(favoriteSongIds, deferredQuery),
              getFavoriteSongs(deferredQuery),
            ]).then(([localSongs, catalogSongs]) => {
              const mergedSongs = new Map<number, SongListItem>()
              catalogSongs.forEach((song) => mergedSongs.set(song.id, song))
              localSongs.forEach((song) => mergedSongs.set(song.id, song))
              return {
                songs: [...mergedSongs.values()],
                albums: [],
              }
            })
          : Promise.all([
              getAlbumsByIds(favoriteAlbumIds, deferredQuery),
              getFavoriteAlbums(deferredQuery),
            ]).then(([localAlbums, catalogAlbums]) => {
              const mergedAlbums = new Map<number, AlbumListItem>()
              catalogAlbums.forEach((album) => mergedAlbums.set(album.id, album))
              localAlbums.forEach((album) => mergedAlbums.set(album.id, album))
              return {
                songs: [],
                albums: [...mergedAlbums.values()],
              }
            })

      void resultPromise
        .then((result) => {
          if (!active) {
            return
          }

          setSongs(result.songs)
          setAlbums(result.albums)
          setStatus('ready')
        })
        .catch((favoriteError: unknown) => {
          if (!active) {
            return
          }

          setError(
            favoriteError instanceof Error
              ? favoriteError.message
              : t('songs.unknownError'),
          )
          setSongs([])
          setAlbums([])
          setStatus('error')
        })
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [activeTab, deferredQuery, favoriteAlbumIds, favoriteSongIds, t])

  const hasResults = activeTab === 'songs' ? songs.length > 0 : albums.length > 0

  return (
    <div className="advanced-search-screen">
      <div className="content-tabs" role="tablist" aria-label={t('nav.favorites')}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'songs'}
          className={activeTab === 'songs' ? 'content-tab content-tab--active' : 'content-tab'}
          onClick={() => setActiveTab('songs')}
        >
          {t('nav.songs')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'albums'}
          className={activeTab === 'albums' ? 'content-tab content-tab--active' : 'content-tab'}
          onClick={() => setActiveTab('albums')}
        >
          {t('nav.albums')}
        </button>
      </div>

      <section className="search-panel" aria-label={t('nav.favorites')}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={
            activeTab === 'songs'
              ? t('favorites.searchSongsPlaceholder')
              : t('favorites.searchAlbumsPlaceholder')
          }
          autoFocus
        />
      </section>

      {status === 'error' ? (
        <div className="empty-state">
          <strong>{t('songs.catalogError')}</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === 'ready' && !hasResults ? (
        <div className="empty-state">
          {activeTab === 'songs'
            ? t('favorites.noSongs')
            : t('favorites.noAlbums')}
        </div>
      ) : null}

      {activeTab === 'songs' ? (
        <SongList songs={songs} loading={status === 'loading'} />
      ) : (
        <AlbumList albums={albums} loading={status === 'loading'} />
      )}
    </div>
  )
}

export default FavoritesPage
