import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import weave from '@wandb/weave';
import App from './App.tsx';
import './index.css';

// Initialize W&B Weave for hackathon eligibility
weave.init('dj-tillu-hackathon');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
