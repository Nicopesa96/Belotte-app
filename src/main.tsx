import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './db/supabase'

const KEEP_ALIVE_KEY = 'supabase_last_ping'
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

const lastPing = parseInt(localStorage.getItem(KEEP_ALIVE_KEY) || '0')
if (Date.now() - lastPing > THREE_DAYS_MS) {
  supabase.from('games').select('id').limit(1).then(() => {
    localStorage.setItem(KEEP_ALIVE_KEY, String(Date.now()))
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
