import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { MyCmdkDemo } from './MyCmdk'
import { ReproPage } from './ReproPage'
import './styles.css'

// Visit /?mycmdk to load the teaching scaffold instead of the full playground.
// Visit /?repro  to load the isolated upstream-bug reproductions.
const params = new URLSearchParams(window.location.search)
const useMyCmdk = params.has('mycmdk')
const useRepro = params.has('repro')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {useRepro ? <ReproPage /> : useMyCmdk ? <MyCmdkDemo /> : <App />}
  </React.StrictMode>,
)
