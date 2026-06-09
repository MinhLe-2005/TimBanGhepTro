import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DialogProvider } from './components/ui/DialogProvider.tsx';

window.onerror = function (message, source, lineno, colno, error) {
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
    <h2>Runtime Error!</h2>
    <p>${message}</p>
    <pre>${error?.stack || ''}</pre>
  </div>`;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </StrictMode>,
);
