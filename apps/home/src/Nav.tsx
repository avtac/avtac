import './Nav.css'
import { Header } from '@avtac/ui'

function Nav() {

  return (
    <>
      <Header title='AVTAC' />
      <a href={'/'}>Home</a>
      <a href={'/balance'}>Balance</a>
      <a href={'/lcio'}>LCIO</a>
    </>
  )
}

export default Nav
