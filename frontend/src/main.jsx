import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<div style="padding:20px;color:red;font-family:monospace"><h2>Error</h2><p>${msg}</p><p>${src}:${line}</p></div>`
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
