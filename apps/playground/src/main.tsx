import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { MyCmdkDemo } from './MyCmdk'
import './styles.css'

// Visit /?mycmdk to load the teaching scaffold instead of the full playground.
const useMyCmdk = new URLSearchParams(window.location.search).has('mycmdk')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {useMyCmdk ? <MyCmdkDemo /> : <App />}
  </React.StrictMode>,
)
