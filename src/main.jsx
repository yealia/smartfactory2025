import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './layouts/Sidebar.jsx'
import MaterialRegistration from './pages/MaterialRegistration.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  //</React.StrictMode>,
)
