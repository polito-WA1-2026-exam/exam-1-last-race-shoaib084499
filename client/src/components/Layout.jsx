import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'

function Layout({ user, setUser, children }) {
  const navigate = useNavigate()

  const logout = async () => {
    await api('/sessions/current', { method: 'DELETE' })
    setUser(null)
    navigate('/')
  }

  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">
          Last Race
        </Link>
        <nav>
          <Link to="/">Instructions</Link>
          {user && <Link to="/game">Play</Link>}
          {user && <Link to="/ranking">Ranking</Link>}
        </nav>
        <div className="session">
          {user ? (
            <>
              <span>{user.name}</span>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="button-link" to="/login">
              Login
            </Link>
          )}
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}

export default Layout
