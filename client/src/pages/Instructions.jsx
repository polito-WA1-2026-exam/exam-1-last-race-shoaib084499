import { Link } from 'react-router-dom'

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

export default Instructions
