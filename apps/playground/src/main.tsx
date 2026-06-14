import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { MarketingPage } from './MarketingPage'
import { MyCmdkDemo } from './MyCmdk'
import { ReproPage } from './ReproPage'
import './styles.css'
import './marketing.css'

// Visit /?mycmdk to load the teaching scaffold instead of the full playground.
// Visit /?repro  to load the isolated upstream-bug reproductions.
// Visit /?demo   to load the full compatibility and fix playground.
const params = new URLSearchParams(window.location.search)
const useMyCmdk = params.has('mycmdk')
const useRepro = params.has('repro')
const useDemo = params.has('demo') || params.has('fixes')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {useRepro ? <ReproPage /> : useMyCmdk ? <MyCmdkDemo /> : useDemo ? <App /> : <MarketingPage />}
  </React.StrictMode>,
)
