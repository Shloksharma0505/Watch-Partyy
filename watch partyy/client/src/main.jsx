import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// No <StrictMode>: its dev-only double-mount would open two socket sessions (and create two rooms).
createRoot(document.getElementById('root')).render(<App />);
