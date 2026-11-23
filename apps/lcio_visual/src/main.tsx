import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@avtac/ui/colors.css'
import '@avtac/ui/global.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
