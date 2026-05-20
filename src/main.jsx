import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer } from 'react-toastify'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer
      position="bottom-right"
      autoClose={2500}
      theme="dark"
      toastStyle={{
        background: '#131920',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#f0f4f8',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px',
      }}
    />
  </StrictMode>
)
