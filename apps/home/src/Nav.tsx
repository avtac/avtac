import './Nav.css'
import { Header } from '@avtac/ui'

function Nav() {

  return (
    <>
      <Header title='AVTAC' />
      <a href={'/'}>Balance</a>
      <a href={'/config'}>Balance Config</a>
    </>
  )
}

export default Nav
