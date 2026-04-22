import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Toast from '../common/Toast'
import { useToast } from '../../hooks/useApi'
import { createContext, useContext } from 'react'

const ToastContext = createContext(null)
export const useGlobalToast = () => useContext(ToastContext)

export default function AppLayout() {
  const { toast, showToast } = useToast()

  return (
    <ToastContext.Provider value={showToast}>
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark font-display">
        <div className="max-w-md mx-auto relative min-h-screen">
          <Outlet />
          <BottomNav />
          {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
      </div>
    </ToastContext.Provider>
  )
}