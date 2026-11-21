import { useMemo as useEffect, useState, type ReactNode } from 'react';
import './Header.css'

function Header({ title, children }: { title: string, children?: ReactNode }): ReactNode {
  const [dark, setDark] = useState(false);

  let savedColor = localStorage.getItem("colorMode");
  if (savedColor === undefined) {
    savedColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  useEffect(() => {
    const body = document.getElementsByTagName("body")[0];
    if (savedColor === 'dark')
      body.classList.add("dark");

    setDark(savedColor === 'dark')
  }, [])

  function toggleDarkMode() {
    const isDark = !dark;

    const body = document.getElementsByTagName("body")[0];
    if (isDark)
      body.classList.add("dark");
    else
      body.classList.remove("dark");

    localStorage.setItem("colorMode", isDark ? "dark" : "light")

    setDark(isDark);
  }

  return (
    <header id='header'>
      <div id='header-left-holder'>
        <nav>
          {children}
        </nav>
        <div id='dark-mode-toggle' onClick={toggleDarkMode}>
          <p className={'fa-solid fa-sun' + (!dark ? ' active' : '')}></p><p className={'fa-solid fa-moon' + (dark ? ' active' : '')}></p>
        </div>
      </div>
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
