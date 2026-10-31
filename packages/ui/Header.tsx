import type { ReactNode } from 'react';
import './Header.css'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredEvent: BeforeInstallPromptEvent;

window.addEventListener('beforeinstallprompt', (e) => {
  // prevent the browser from displaying the default install dialog
  e.preventDefault();

  // Stash the event so it can be triggered later when the user clicks the button
  deferredEvent = e as BeforeInstallPromptEvent;
});

function Header({ title }: { title: string }): ReactNode {
  return (
    <header id='header'>
      <nav>
        <button onClick={() => window.location.href = '/'}>Balance</button>
        <button onClick={() => window.location.href = '/config'}>Balance Config</button>
      </nav>
      <h1>
        <img
          style={{ cursor: "pointer" }}
          src="/favicon.svg"
          alt={title + ' Icon'}
          onClick={() => { if (deferredEvent) deferredEvent.prompt() }} />
        <span>{title}</span>
      </h1>
    </header>
  );
}

export default Header;
