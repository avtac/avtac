import type { ReactNode } from 'react'
import ConfigBuilder from './pages/config/ConfigBuilder.tsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Balance from './pages/home/Balance.tsx'
import LCIO from './pages/lcio_visual/LCIO.tsx'

function App(): ReactNode {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Balance />} />
        <Route path='/config' element={<ConfigBuilder />} />
        <Route path='/lcio' element={<LCIO />} />
      </Routes>
    </Router>
  )
}

export default App
