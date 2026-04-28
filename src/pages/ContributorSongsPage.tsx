import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SongList from '../components/SongList'
import {
  getContributorName,
  getSongsByContributor,
  type ContributorType,
  type SongListItem,
} from '../lib/catalog/catalog'

type LoadState = 'loading' | 'ready' | 'missing' | 'error'

const contributorTypes = ['singer', 'poet', 'composer', 'distributer'] as const

function ContributorSongsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { type, contributorId } = useParams()
  const numericContributorId = Number(contributorId)
  const contributorType = isContributorType(type) ? type : null
  const [name, setName] = useState<string | null>(null)
  const [songs, setSongs] = useState<SongListItem[]>([])
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
      getSongsByContributor(contributorType, numericContributorId),
    ])
      .then(([contributorName, contributorSongs]) => {
        if (!active) {
          return
        }

        setName(contributorName)
        setSongs(contributorSongs)
        setStatus(contributorName || contributorSongs.length > 0 ? 'ready' : 'missing')
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
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [contributorType, numericContributorId, t])

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

  return (
    <div className="advanced-search-screen contributor-screen">
      <section className="contributor-hero">
        <span className="contributor-hero__label">
          {getContributorLabel(contributorType, t)}
        </span>
        <h1>{status === 'loading' ? t('contributors.loading') : name}</h1>
        {status === 'ready' ? (
          <p>{t('contributors.songsCount', { count: songs.length })}</p>
        ) : null}
      </section>

      {status === 'error' ? (
        <div className="empty-state">
          <strong>{t('songs.catalogError')}</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === 'ready' && songs.length === 0 ? (
        <div className="empty-state">{t('songs.noResults')}</div>
      ) : null}

      <SongList songs={songs} loading={status === 'loading'} />
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
