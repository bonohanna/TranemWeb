import { useDeferredValue, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AlbumList from '../components/AlbumList'
import SearchBox from '../components/SearchBox'
import SongList from '../components/SongList'
import {
  getAlbumsByIds,
  getMostPlayedAlbums,
  getMostPlayedSongs,
  getSongsByIds,
  type AlbumListItem,
  type SongListItem,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

type LoadState = 'loading' | 'ready' | 'error'
type MostPlayedTab = 'songs' | 'albums'

function MostPlayedPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<MostPlayedTab>('songs')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const playCounts = useUserLibraryStore((state) => state.playCounts)
  const albumPlayCounts = useUserLibraryStore((state) => state.albumPlayCounts)
  const [songs, setSongs] = useState<SongListItem[]>([])
  const [albums, setAlbums] = useState<AlbumListItem[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      const localPlayedSongIds = Object.entries(playCounts)
        .filter(([, count]) => count > 0)
        .map(([songId]) => Number(songId))

      setStatus('loading')
      setError(null)

      const localPlayedAlbumIds = Object.entries(albumPlayCounts)
        .filter(([, count]) => count > 0)
        .map(([albumId]) => Number(albumId))

      const resultPromise =
        activeTab === 'songs'
          ? Promise.all([
              getSongsByIds(localPlayedSongIds, deferredQuery),
              getMostPlayedSongs(deferredQuery),
            ]).then(([localSongs, catalogSongs]) => {
              const mergedSongs = new Map<number, SongListItem>()
              catalogSongs.forEach((song) => mergedSongs.set(song.id, song))
              localSongs.forEach((song) => mergedSongs.set(song.id, song))

              return {
                songs: [...mergedSongs.values()]
                  .filter((song) => song.catalogPlayCount + (playCounts[song.id] ?? 0) > 0)
                  .sort((a, b) => {
                    const aCount = a.catalogPlayCount + (playCounts[a.id] ?? 0)
                    const bCount = b.catalogPlayCount + (playCounts[b.id] ?? 0)

                    return bCount - aCount || a.name.localeCompare(b.name, 'ar')
                  }),
                albums: [],
              }
            })
          : Promise.all([
              getAlbumsByIds(localPlayedAlbumIds, deferredQuery),
              getMostPlayedAlbums(deferredQuery),
            ]).then(([localAlbums, catalogAlbums]) => {
              const mergedAlbums = new Map<number, AlbumListItem>()
              catalogAlbums.forEach((album) => mergedAlbums.set(album.id, album))
              localAlbums.forEach((album) => mergedAlbums.set(album.id, album))

              return {
                songs: [],
                albums: [...mergedAlbums.values()]
                  .filter(
                    (album) =>
                      album.catalogPlayCount + (albumPlayCounts[album.id] ?? 0) > 0,
                  )
                  .sort((a, b) => {
                    const aCount = a.catalogPlayCount + (albumPlayCounts[a.id] ?? 0)
                    const bCount = b.catalogPlayCount + (albumPlayCounts[b.id] ?? 0)

                    return bCount - aCount || a.name.localeCompare(b.name, 'ar')
                  }),
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
        .catch((mostPlayedError: unknown) => {
          if (!active) {
            return
          }

          setError(
            mostPlayedError instanceof Error
              ? mostPlayedError.message
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
  }, [activeTab, albumPlayCounts, deferredQuery, playCounts, t])

  const hasResults = activeTab === 'songs' ? songs.length > 0 : albums.length > 0

  return (
    <div className="advanced-search-screen">
      <div className="content-tabs" role="tablist" aria-label={t('nav.mostPlayed')}>
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

      <section className="search-panel" aria-label={t('nav.mostPlayed')}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={
            activeTab === 'songs'
              ? t('mostPlayed.searchSongsPlaceholder')
              : t('mostPlayed.searchAlbumsPlaceholder')
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
            ? t('mostPlayed.noSongs')
            : t('mostPlayed.noAlbums')}
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

export default MostPlayedPage
