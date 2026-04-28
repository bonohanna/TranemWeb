import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import AlbumDetailPage from './pages/AlbumDetailPage'
import AlbumsPage from './pages/AlbumsPage'
import FavoritesPage from './pages/FavoritesPage'
import MostPlayedPage from './pages/MostPlayedPage'
import SongDetailPage from './pages/SongDetailPage'
import SongsPage from './pages/SongsPage'

function App() {
  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<SongsPage />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/songs/:songId" element={<SongDetailPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/most-played" element={<MostPlayedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
