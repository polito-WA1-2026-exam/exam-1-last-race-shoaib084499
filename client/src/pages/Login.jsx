import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

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

export default Login
