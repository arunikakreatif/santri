// Fix for Chrome 128+ html2canvas bug: disable Intl.Segmenter so html2canvas uses reliable breakWords fallback
if (typeof window !== 'undefined' && (window as any).Intl) {
  try {
    delete (window as any).Intl.Segmenter;
  } catch {
    (window as any).Intl.Segmenter = undefined;
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
