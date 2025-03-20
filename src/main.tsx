import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@carbon/styles/css/styles.css'
import './index.css'
import App from './App.tsx'
import './styles.scss'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
