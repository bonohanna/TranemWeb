import { useTranslation } from 'react-i18next'

type PageKey =
  | 'songs'
  | 'albums'
  | 'search'
  | 'favorites'
  | 'mostPlayed'
  | 'playerLab'

interface PlaceholderPageProps {
  pageKey: PageKey
}

function PlaceholderPage({ pageKey }: PlaceholderPageProps) {
  const { t } = useTranslation()

  return (
    <div className="placeholder-screen">
      <h1>{t(`nav.${pageKey}`)}</h1>
      <p>{t('songs.noResults')}</p>
    </div>
  )
}

export default PlaceholderPage
