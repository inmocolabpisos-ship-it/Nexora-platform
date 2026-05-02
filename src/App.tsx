import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n/config'

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <Routes>
          <Route path="/" element={<div className="flex items-center justify-center min-h-screen">Bienvenido a NEXURA</div>} />
        </Routes>
      </Router>
    </I18nextProvider>
  )
}

export default App
