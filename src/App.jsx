import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Games from './pages/Games'
import GameDetails from './pages/GameDetails'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check if user has dark mode preference saved
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    
    // Apply dark mode class to body if enabled
    if (savedDarkMode) {
      document.body.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    if (newDarkMode) {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }

  return (
    <AuthProvider>
      <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-gray-900 text-gray-100' : ''}`}>
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:gameId" element={<GameDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App