import { HashRouter, Routes, Route } from 'react-router'
import './App.css'
import Home from './assets/components/Home.jsx'
import AboutMe from './assets/components/AboutMe.jsx'

function App() {
  return <HashRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutMe />} />
    </Routes>
  </HashRouter>
}

export default App
