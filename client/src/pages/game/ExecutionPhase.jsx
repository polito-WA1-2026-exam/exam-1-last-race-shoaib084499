import { Link } from 'react-router-dom'

function ExecutionPhase({ result, stepIndex, stationById, onNextStep, onNewGame }) {
  if (!result.valid) {
    return (
      <section className="page narrow">
        <p className="eyebrow">Invalid route</p>
        <h1>Score: 0 coins</h1>
        <p className="lead">{result.reason}</p>
        <button type="button" onClick={onNewGame}>
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
            <button type="button" onClick={onNewGame}>
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
          <button type="button" onClick={onNextStep}>
            Continue
          </button>
        </>
      )}
    </section>
  )
}

export default ExecutionPhase
