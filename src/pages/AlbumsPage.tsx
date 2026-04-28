import { useDeferredValue, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AlbumList from '../components/AlbumList'
import SearchBox from '../components/SearchBox'
import {
  getAlbumsByIds,
  searchAlbums,
  type AlbumListItem,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

type LoadState = 'loading' | 'ready' | 'error'

function AlbumsPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const favoriteAlbumIds = useUserLibraryStore((state) => state.favoriteAlbumIds)
  const albumPlayCounts = useUserLibraryStore((state) => state.albumPlayCounts)
  const [albums, setAlbums] = useState<AlbumListItem[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setStatus('loading')
      setError(null)

      const localPlayedAlbumIds = Object.entries(albumPlayCounts)
        .filter(([, count]) => count > 0)
        .map(([albumId]) => Number(albumId))
      const localPriorityAlbumIds = [...favoriteAlbumIds, ...localPlayedAlbumIds]

      void Promise.all([
        searchAlbums(deferredQuery),
        getAlbumsByIds(localPriorityAlbumIds, deferredQuery),
      ])
        .then(([catalogAlbums, localAlbums]) => {
          if (!active) {
            return
          }

          const mergedAlbums = new Map<number, AlbumListItem>()
          catalogAlbums.forEach((album) => mergedAlbums.set(album.id, album))
          localAlbums.forEach((album) => mergedAlbums.set(album.id, album))

          setAlbums([...mergedAlbums.values()])
          setStatus('ready')
        })
        .catch((albumError: unknown) => {
          if (!active) {
            return
          }

          setError(
            albumError instanceof Error
              ? albumError.message
              : t('albums.unknownError'),
          )
          setAlbums([])
          setStatus('error')
        })
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [albumPlayCounts, deferredQuery, favoriteAlbumIds, t])

  return (
    <div className="advanced-search-screen">
      <section className="search-panel" aria-label={t('albums.toolbar')}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t('albums.searchPlaceholder')}
          autoFocus
        />
      </section>

      {status === 'error' ? (
        <div className="empty-state">
          <strong>{t('albums.catalogError')}</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === 'ready' && albums.length === 0 ? (
        <div className="empty-state">{t('albums.noResults')}</div>
      ) : null}

      <AlbumList albums={albums} loading={status === 'loading'} />
    </div>
  )
}

export default AlbumsPage
