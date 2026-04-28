import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Disc3,
  Heart,
  Music2,
  Play,
  Users,
} from 'lucide-react'

const navKeys = [
  { to: '/', key: 'songs', icon: Music2 },
  { to: '/albums', key: 'albums', icon: Disc3 },
  { to: '/favorites', key: 'favorites', icon: Heart },
  { to: '/most-played', key: 'mostPlayed', icon: Play },
  { to: 'https://www.facebook.com/mrbonh', key: 'contact', icon: Users },
] as const

const appIconUrl = `${import.meta.env.BASE_URL}app-icon.png`

function AppShell() {
  const { t } = useTranslation()

  return (
    <div className="shell">
      <header className="app-header">
        <Link className="app-header__brand" to="/">
          <img className="app-header__icon" src={appIconUrl} alt="" />
          <span>{t('appName')}</span>
        </Link>
      </header>

      <nav className="app-nav" aria-label={t('shell.navigation')}>
        {navKeys.map((item) =>
          item.to.startsWith('https://') ? (
            <a
              key={item.key}
              className="app-nav__link"
              href={item.to}
              target="_blank"
              rel="noreferrer"
            >
              <span className="app-nav__indicator">
                <item.icon size={21} />
              </span>
              <span>{t(`nav.${item.key}`)}</span>
            </a>
          ) : (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
              }
            >
              <span className="app-nav__indicator">
                <item.icon size={21} fill={item.key === 'favorites' ? 'currentColor' : 'none'} />
              </span>
              <span>{t(`nav.${item.key}`)}</span>
            </NavLink>
          ),
        )}
      </nav>

      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
