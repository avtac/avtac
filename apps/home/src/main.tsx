import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@avtac/ui/global.css'
import Nav from './Nav.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Nav />
  </StrictMode>,
)
