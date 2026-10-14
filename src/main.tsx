import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerMediaServiceWorker } from './utils/mediaCache';

registerMediaServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);

