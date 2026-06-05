import NetworkMap from './NetworkMap'

function PlanningPhase({
  game,
  planningNetwork,
  route,
  seconds,
  stationById,
  onAddSegment,
  onSubmitRoute,
  onUndo,
}) {
  return (
    <section className="page game-grid">
      <div className="game-main">
        <div className="split-head">
          <div>
            <p className="eyebrow">Planning</p>
            <h1>{seconds}s remaining</h1>
          </div>
          <button type="button" onClick={onSubmitRoute}>
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
        <button type="button" onClick={onUndo} disabled={route.length === 0}>
          Undo
        </button>
        <div className="segment-list">
          {game.segments.map((segment) => {
            const used = route.some((item) => item.key === segment.key)
            return (
              <button key={segment.key} type="button" disabled={used} onClick={() => onAddSegment(segment)}>
                {segment.from.name} - {segment.to.name}
              </button>
            )
          })}
        </div>
      </aside>
    </section>
  )
}

export default PlanningPhase
