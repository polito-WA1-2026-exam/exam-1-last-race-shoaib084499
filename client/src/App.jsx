import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import useSession from './hooks/useSession'
import Game from './pages/Game'
import Instructions from './pages/Instructions'
import Login from './pages/Login'
import Ranking from './pages/Ranking'
import './App.css'

function App() {
  const { user, setUser, loading } = useSession()

  return (
    <BrowserRouter>
      <Layout user={user} setUser={setUser}>
        <Routes>
          <Route path="/" element={<Instructions user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route
            path="/game"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Game />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <ProtectedRoute user={user} loading={loading}>
                <Ranking />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
