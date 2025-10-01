import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext()
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, opts = { type: 'info', timeout: 3000 }) => {
    const id = Date.now().toString(36)
    setToasts((t) => [...t, { id, msg, ...opts }])
    if (opts.timeout) setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.timeout)
  }, [])
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed right-6 bottom-6 z-60">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="mb-3">
              <div className="px-4 py-3 rounded-md bg-white/6 text-white shadow-soft-3xl">{t.msg}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}


