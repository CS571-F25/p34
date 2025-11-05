import { HashRouter, Routes, Route } from 'react-router'
import './App.css'
import Home from './assets/components/Home.jsx'
import AboutMe from './assets/components/AboutMe.jsx'
import Players from './assets/components/Players.jsx'
import Layout from './assets/components/Layout.jsx'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/about" element={<AboutMe />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
