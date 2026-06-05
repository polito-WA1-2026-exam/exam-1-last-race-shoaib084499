import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import ExecutionPhase from './game/ExecutionPhase'
import PlanningPhase from './game/PlanningPhase'
import SetupPhase from './game/SetupPhase'

const PLANNING_SECONDS = 90

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
    return <SetupPhase network={network} onStart={startGame} />
  }

  if (phase === 'planning') {
    return (
      <PlanningPhase
        game={game}
        planningNetwork={planningNetwork}
        route={route}
        seconds={seconds}
        stationById={stationById}
        onAddSegment={addSegment}
        onSubmitRoute={submitRoute}
        onUndo={() => setRoute(route.slice(0, -1))}
      />
    )
  }

  if (phase === 'execution' && result) {
    return (
      <ExecutionPhase
        result={result}
        stepIndex={stepIndex}
        stationById={stationById}
        onNextStep={() => setStepIndex(stepIndex + 1)}
        onNewGame={() => setPhase('setup')}
      />
    )
  }

  return <p className="status">Preparing execution...</p>
}

export default Game
