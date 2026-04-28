import { useDeferredValue, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AlbumList from '../components/AlbumList'
import SearchBox from '../components/SearchBox'
import SongList from '../components/SongList'
import {
  getAlbumsByContributor,
  getContributorName,
  getSongsByContributor,
  type AlbumListItem,
  type ContributorType,
  type SongListItem,
} from '../lib/catalog/catalog'

type LoadState = 'loading' | 'ready' | 'missing' | 'error'
type ContributorTab = 'songs' | 'albums'

const contributorTypes = ['singer', 'poet', 'composer', 'distributer'] as const

function ContributorSongsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { type, contributorId } = useParams()
  const numericContributorId = Number(contributorId)
  const contributorType = isContributorType(type) ? type : null
  const [activeTab, setActiveTab] = useState<ContributorTab>('songs')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [name, setName] = useState<string | null>(null)
  const [songs, setSongs] = useState<SongListItem[]>([])
  const [albums, setAlbums] = useState<AlbumListItem[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contributorType || !Number.isFinite(numericContributorId)) {
      return
    }

    let active = true

    void Promise.resolve().then(() => {
      if (!active) {
        return
      }

      setStatus('loading')
      setError(null)
    })

    void Promise.all([
      getContributorName(contributorType, numericContributorId),
      getSongsByContributor(contributorType, numericContributorId, deferredQuery),
      getAlbumsByContributor(contributorType, numericContributorId, deferredQuery),
    ])
      .then(([contributorName, contributorSongs, contributorAlbums]) => {
        if (!active) {
          return
        }

        setName(contributorName)
        setSongs(contributorSongs)
        setAlbums(contributorAlbums)
        setStatus(
          contributorName || contributorSongs.length > 0 || contributorAlbums.length > 0
            ? 'ready'
            : 'missing',
        )
      })
      .catch((contributorError: unknown) => {
        if (!active) {
          return
        }

        setError(
          contributorError instanceof Error
            ? contributorError.message
            : t('songs.unknownError'),
        )
        setSongs([])
        setAlbums([])
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [contributorType, deferredQuery, numericContributorId, t])

  if (!contributorType || !Number.isFinite(numericContributorId)) {
    return <Navigate to="/" replace />
  }

  if (status === 'missing') {
    return (
      <div className="empty-state">
        <strong>{t('contributors.notFound')}</strong>
        <button type="button" className="text-button" onClick={() => navigate(-1)}>
          {t('songDetail.backToSongs')}
        </button>
      </div>
    )
  }

  const hasResults = activeTab === 'songs' ? songs.length > 0 : albums.length > 0
  const activeCount = activeTab === 'songs' ? songs.length : albums.length

  return (
    <div className="advanced-search-screen contributor-screen">
      <section className="contributor-hero">
        <span className="contributor-hero__label">
          {getContributorLabel(contributorType, t)}
        </span>
        <h1>{status === 'loading' ? t('contributors.loading') : name}</h1>
        {status === 'ready' ? (
          <p>
            {activeTab === 'songs'
              ? t('contributors.songsCount', { count: activeCount })
              : t('contributors.albumsCount', { count: activeCount })}
          </p>
        ) : null}
      </section>

      <div className="content-tabs" role="tablist" aria-label={name ?? undefined}>
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

      <section className="search-panel" aria-label={name ?? undefined}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={
            activeTab === 'songs'
              ? t('contributors.searchSongsPlaceholder')
              : t('contributors.searchAlbumsPlaceholder')
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
          {activeTab === 'songs' ? t('songs.noResults') : t('albums.noResults')}
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

function isContributorType(value: string | undefined): value is ContributorType {
  return contributorTypes.includes(value as ContributorType)
}

function getContributorLabel(
  type: ContributorType,
  t: (key: string) => string,
) {
  switch (type) {
    case 'singer':
      return t('songDetail.singer')
    case 'poet':
      return t('songDetail.poet')
    case 'composer':
      return t('songDetail.composer')
    case 'distributer':
      return t('songDetail.distributer')
  }
}

export default ContributorSongsPage
