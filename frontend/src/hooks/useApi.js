import { useState, useEffect, useCallback } from 'react'

// Generic fetch hook
export const useFetch = (fetchFn, deps = []) => {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchFn()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}

// Toast hook
export const useToast = () => {
  const [toast, setToast] = useState(null)

  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2800)
  }

  return { toast, showToast: show }
}
