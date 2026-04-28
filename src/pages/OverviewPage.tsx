import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { expectedCatalogPath } from '../lib/catalog/catalog'
import { useCatalogSummary } from '../lib/catalog/useCatalogSummary'

function OverviewPage() {
  const { t } = useTranslation()
  const summary = useCatalogSummary()
  const migrationPoints = t('overview.migrationPoints', {
    returnObjects: true,
  }) as string[]
  const milestonePoints = t('overview.milestonePoints', {
    returnObjects: true,
  }) as string[]

  const workstreams = [
    { to: '/songs', label: t('nav.songs'), body: t('pages.songs.description') },
    { to: '/albums', label: t('nav.albums'), body: t('pages.albums.description') },
    { to: '/search', label: t('nav.search'), body: t('pages.search.description') },
    {
      to: '/player-lab',
      label: t('nav.playerLab'),
      body: t('pages.playerLab.description'),
    },
  ]

  return (
    <div className="page-stack">
      <section className="panel panel--hero">
        <p className="eyebrow">{t('overview.introLabel')}</p>
        <h2>{t('overview.introTitle')}</h2>
        <p className="panel__body">{t('overview.introBody')}</p>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>{t('overview.catalogTitle')}</h2>
            <p className="panel__body">{t('common.catalogSource')}: SQLite</p>
          </div>

          <span
            className={
              summary.error ? 'status-badge status-badge--warn' : 'status-badge'
            }
          >
            {summary.loading
              ? t('overview.catalogLoading')
              : summary.error
                ? t('overview.catalogMissing')
                : t('overview.catalogReady')}
          </span>
        </div>

        {summary.loading ? (
          <p className="panel__body">{t('overview.catalogLoading')}</p>
        ) : null}

        {summary.error ? (
          <div className="callout">
            <p>{t('overview.catalogHelp')}</p>
            <p>
              {t('common.openPath')}: <code>{expectedCatalogPath}</code>
            </p>
            <p>
              <code>npm run prepare:catalog</code>
            </p>
          </div>
        ) : null}

        {summary.data ? (
          <div className="metric-grid">
            <article className="metric-card">
              <span>{t('metrics.songs')}</span>
              <strong>{summary.data.songs.toLocaleString()}</strong>
            </article>
            <article className="metric-card">
              <span>{t('metrics.albums')}</span>
              <strong>{summary.data.albums.toLocaleString()}</strong>
            </article>
            <article className="metric-card">
              <span>{t('metrics.singers')}</span>
              <strong>{summary.data.singers.toLocaleString()}</strong>
            </article>
            <article className="metric-card">
              <span>{t('metrics.poets')}</span>
              <strong>{summary.data.poets.toLocaleString()}</strong>
            </article>
            <article className="metric-card">
              <span>{t('metrics.composers')}</span>
              <strong>{summary.data.composers.toLocaleString()}</strong>
            </article>
            <article className="metric-card">
              <span>{t('metrics.distributers')}</span>
              <strong>{summary.data.distributers.toLocaleString()}</strong>
            </article>
            <article className="metric-card metric-card--wide">
              <span>{t('metrics.featuredSong')}</span>
              <strong>{summary.data.featuredSong ?? '—'}</strong>
            </article>
          </div>
        ) : null}
      </section>

      <div className="dual-grid">
        <section className="panel">
          <h2>{t('overview.migrationTitle')}</h2>
          <ul className="plan-list">
            {migrationPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>{t('overview.milestoneTitle')}</h2>
          <ul className="plan-list">
            {milestonePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <div className="panel__header">
          <h2>{t('overview.workstreamsTitle')}</h2>
        </div>

        <div className="workstream-grid">
          {workstreams.map((item) => (
            <Link key={item.to} className="workstream-card" to={item.to}>
              <span className="workstream-card__label">{item.label}</span>
              <p>{item.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default OverviewPage
