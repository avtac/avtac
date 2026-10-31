import type { ReactNode } from 'react';
import './Header.css'

function Header({ title, children }: { title: string, children?: ReactNode }): ReactNode {
  return (
    <header id='header'>
      <nav>{children}</nav>
      <a href='/'>
        <h1>
          <img
            src="/favicon.svg"
            alt={title + ' Icon'} />
          <span>{title}</span>
        </h1>
      </a>
    </header>
  );
}

export default Header;
