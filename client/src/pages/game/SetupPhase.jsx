import NetworkMap from './NetworkMap'

function SetupPhase({ network, onStart }) {
  return (
    <section className="page">
      <div className="split-head">
        <div>
          <p className="eyebrow">Setup</p>
          <h1>Study the full network.</h1>
        </div>
        <button type="button" onClick={onStart}>
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

export default SetupPhase
