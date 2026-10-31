import '../../index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ConfigBuilder from './ConfigBuilder';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigBuilder />
  </StrictMode>,
)
