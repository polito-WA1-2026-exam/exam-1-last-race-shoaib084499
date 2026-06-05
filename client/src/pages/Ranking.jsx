import { useEffect, useState } from 'react'
import api from '../api/client'

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

export default Ranking
