import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import './App.css'

const API_URL = 'http://localhost:3001/api'
const PLANNING_SECONDS = 90

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? 'Request failed')
  }
  if (response.status === 204) return null
  return response.json()
}

function useSession() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/sessions/current')
      .then((data) => setUser(data.user))
      .finally(() => setLoading(false))
  }, [])

  return { user, setUser, loading }
}

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

function Protected({ user, loading, children }) {
  if (loading) return <p className="status">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Instructions({ user }) {
  return (
    <section className="page intro">
      <div>
        <p className="eyebrow">Single-player metro challenge</p>
        <h1>Plan the route before the clock expires.</h1>
        <p className="lead">
          Registered players receive a random start and destination station,
          reconstruct the hidden connections from segment pairs, and then ride
          the selected path while random events change the coin total.
        </p>
        <div className="actions">
          {user ? (
            <Link className="primary" to="/game">
              Start game
            </Link>
          ) : (
            <Link className="primary" to="/login">
              Login to play
            </Link>
          )}
          {user && <Link to="/ranking">View ranking</Link>}
        </div>
      </div>
      <div className="rules-panel">
        <h2>Rules</h2>
        <ul>
          <li>Each game starts with 20 coins.</li>
          <li>Planning lasts 90 seconds.</li>
          <li>Each segment can be selected only once.</li>
          <li>Line changes are allowed only at interchange stations.</li>
          <li>Invalid or incomplete routes score zero.</li>
        </ul>
      </div>
    </section>
  )
}

function Login({ setUser }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('alice@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const data = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(data.user)
      navigate('/game')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page narrow">
      <h1>Login</h1>
      <form className="form" onSubmit={submit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </section>
  )
}

function NetworkMap({ network, planning = false, selectedRoute = [] }) {
  const selectedKeys = new Set(selectedRoute.map((segment) => segment.key))

  return (
    <svg className="network-map" viewBox="0 0 1040 620" role="img" aria-label="Underground network map">
      {!planning &&
        network.lines.map((line) =>
          line.stations.slice(0, -1).map((station, index) => {
            const next = line.stations[index + 1]
            return (
              <line
                key={`${line.id}-${station.id}-${next.id}`}
                x1={station.x}
                y1={station.y}
                x2={next.x}
                y2={next.y}
                stroke={line.color}
                strokeWidth="12"
                strokeLinecap="round"
              />
            )
          }),
        )}
      {planning &&
        network.segments?.map((segment) => (
          <line
            key={segment.key}
            x1={segment.from.x}
            y1={segment.from.y}
            x2={segment.to.x}
            y2={segment.to.y}
            className={selectedKeys.has(segment.key) ? 'route-line' : 'ghost-line'}
          />
        ))}
      {network.stations.map((station) => (
        <g key={station.id}>
          <circle
            cx={station.x}
            cy={station.y}
            r={station.interchange ? 15 : 11}
            className={station.interchange ? 'station interchange' : 'station'}
          />
          <text x={station.x + 18} y={station.y - 14}>
            {station.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Game() {
  const [phase, setPhase] = useState('setup')
  const [network, setNetwork] = useState(null)
  const [game, setGame] = useState(null)
  const [route, setRoute] = useState([])
  const [seconds, setSeconds] = useState(PLANNING_SECONDS)
  const [result, setResult] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/network').then(setNetwork).catch((err) => setError(err.message))
  }, [])

  const stationById = useMemo(() => {
    const stations = game?.stations ?? network?.stations ?? []
    return new Map(stations.map((station) => [station.id, station]))
  }, [game, network])

  const planningNetwork = useMemo(() => {
    if (!game) return null
    return {
      stations: game.stations,
      segments: game.segments.map((segment) => ({
        ...segment,
        from: { ...segment.from, ...stationById.get(segment.from.id) },
        to: { ...segment.to, ...stationById.get(segment.to.id) },
      })),
    }
  }, [game, stationById])

  const startGame = async () => {
    setError('')
    const newGame = await api('/games', { method: 'POST' })
    setGame(newGame)
    setRoute([])
    setResult(null)
    setStepIndex(0)
    setSeconds(PLANNING_SECONDS)
    setPhase('planning')
  }

  const addSegment = (segment) => {
    if (route.some((item) => item.key === segment.key)) return
    if (route.length === 0) {
      if (segment.from.id === game.start.id) {
        setRoute([{ key: segment.key, fromId: segment.from.id, toId: segment.to.id }])
      } else if (segment.to.id === game.start.id) {
        setRoute([{ key: segment.key, fromId: segment.to.id, toId: segment.from.id }])
      }
      return
    }

    const currentStation = route.at(-1).toId
    if (segment.from.id === currentStation) {
      setRoute([...route, { key: segment.key, fromId: segment.from.id, toId: segment.to.id }])
    } else if (segment.to.id === currentStation) {
      setRoute([...route, { key: segment.key, fromId: segment.to.id, toId: segment.from.id }])
    }
  }

  const undo = () => setRoute(route.slice(0, -1))

  const submitRoute = useCallback(async () => {
    if (!game || phase !== 'planning') return
    setPhase('execution')
    try {
      const data = await api(`/games/${game.gameId}/route`, {
        method: 'POST',
        body: JSON.stringify({ route }),
      })
      setResult(data)
      setStepIndex(0)
    } catch (err) {
      setError(err.message)
      setPhase('planning')
    }
  }, [game, phase, route])

  useEffect(() => {
    if (phase !== 'planning') return undefined
    if (seconds <= 0) {
      const submitTimer = setTimeout(() => submitRoute(), 0)
      return () => clearTimeout(submitTimer)
    }
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, seconds, submitRoute])

  if (error) return <p className="status error">{error}</p>
  if (!network) return <p className="status">Loading network...</p>

  if (phase === 'setup') {
    return (
      <section className="page">
        <div className="split-head">
          <div>
            <p className="eyebrow">Setup</p>
            <h1>Study the full network.</h1>
          </div>
          <button type="button" onClick={startGame}>
            Ready to play
          </button>
        </div>
        <NetworkMap network={network} />
        <div className="line-list">
          {network.lines.map((line) => (
            <span key={line.id} style={{ borderColor: line.color }}>
              {line.name}
            </span>
          ))}
        </div>
      </section>
    )
  }

  if (phase === 'planning') {
    return (
      <section className="page game-grid">
        <div className="game-main">
          <div className="split-head">
            <div>
              <p className="eyebrow">Planning</p>
              <h1>{seconds}s remaining</h1>
            </div>
            <button type="button" onClick={submitRoute}>
              Submit route
            </button>
          </div>
          <div className="assignment">
            <strong>{game.start.name}</strong>
            <span>to</span>
            <strong>{game.destination.name}</strong>
          </div>
          <NetworkMap network={planningNetwork} planning selectedRoute={route} />
        </div>
        <aside className="segments-panel">
          <h2>Segments</h2>
          <div className="route-summary">
            {route.length === 0 ? (
              <span>No segment selected</span>
            ) : (
              route.map((item) => (
                <span key={item.key}>
                  {stationById.get(item.fromId)?.name} &rarr; {stationById.get(item.toId)?.name}
                </span>
              ))
            )}
          </div>
          <button type="button" onClick={undo} disabled={route.length === 0}>
            Undo
          </button>
          <div className="segment-list">
            {game.segments.map((segment) => {
              const used = route.some((item) => item.key === segment.key)
              return (
                <button key={segment.key} type="button" disabled={used} onClick={() => addSegment(segment)}>
                  {segment.from.name} - {segment.to.name}
                </button>
              )
            })}
          </div>
        </aside>
      </section>
    )
  }

  if (phase === 'execution' && result) {
    if (!result.valid) {
      return (
        <section className="page narrow">
          <p className="eyebrow">Invalid route</p>
          <h1>Score: 0 coins</h1>
          <p className="lead">{result.reason}</p>
          <button type="button" onClick={() => setPhase('setup')}>
            New game
          </button>
        </section>
      )
    }

    const current = result.steps[stepIndex]
    const finished = stepIndex >= result.steps.length
    return (
      <section className="page narrow">
        <p className="eyebrow">Execution</p>
        {finished ? (
          <>
            <h1>Final score: {result.finalScore} coins</h1>
            <div className="actions">
              <button type="button" onClick={() => setPhase('setup')}>
                New game
              </button>
              <Link to="/ranking">Ranking</Link>
            </div>
          </>
        ) : (
          <>
            <h1>
              Step {current.index} of {result.steps.length}
            </h1>
            <div className="event-box">
              <strong>
                {stationById.get(current.fromId)?.name} &rarr; {stationById.get(current.toId)?.name}
              </strong>
              <h2>{current.event.title}</h2>
              <p>{current.event.description}</p>
              <p className={current.event.effect >= 0 ? 'positive' : 'negative'}>
                {current.event.effect >= 0 ? '+' : ''}
                {current.event.effect} coins
              </p>
              <p>Current total: {current.coins} coins</p>
            </div>
            <button type="button" onClick={() => setStepIndex(stepIndex + 1)}>
              Continue
            </button>
          </>
        )}
      </section>
    )
  }

  return <p className="status">Preparing execution...</p>
}

function Ranking() {
  const [ranking, setRanking] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/ranking')
      .then((data) => setRanking(data.ranking))
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="status error">{error}</p>
  if (!ranking) return <p className="status">Loading ranking...</p>

  return (
    <section className="page narrow">
      <p className="eyebrow">General ranking</p>
      <h1>Best results</h1>
      <ol className="ranking">
        {ranking.map((row) => (
          <li key={row.email}>
            <span>{row.name}</span>
            <strong>{row.best_score} coins</strong>
          </li>
        ))}
      </ol>
    </section>
  )
}

function AppRoutes() {
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
              <Protected user={user} loading={loading}>
                <Game />
              </Protected>
            }
          />
          <Route
            path="/ranking"
            element={
              <Protected user={user} loading={loading}>
                <Ranking />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default AppRoutes
