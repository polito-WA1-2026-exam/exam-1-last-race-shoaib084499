import { useEffect, useState } from 'react'
import api from '../api/client'

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

export default useSession
