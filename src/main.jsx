import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Chart as ChartJS } from 'chart.js'

// Tooltip grafik muncul saat diklik, tidak mengikuti kursor (berlaku untuk semua chart)
ChartJS.defaults.events = ['click']

// Klik di luar canvas grafik menyembunyikan tooltip yang sedang terbuka
document.addEventListener('click', (event) => {
  Object.values(ChartJS.instances).forEach((chart) => {
    if (chart.canvas === event.target) return
    chart.setActiveElements([])
    chart.tooltip?.setActiveElements([], { x: 0, y: 0 })
    chart.update('none')
  })
})
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
