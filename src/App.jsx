import { HashRouter, Routes, Route } from 'react-router'
import './App.css'

import Home from './assets/components/Home.jsx'
import AboutMe from './assets/components/AboutMe.jsx'
import Players from './assets/components/Players.jsx'
import Layout from './assets/components/Layout.jsx'

import PlayerDetails from './assets/components/PlayerDetails.jsx'
import LeagueStats from './assets/components/LeagueStats.jsx'
import Watchlist from "./assets/components/Watchlist.jsx"


function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/player/:id" element={<PlayerDetails />} />
          <Route path="/league" element={<LeagueStats />} />
          <Route path="/about" element={<AboutMe />} />
          <Route path="/watchlist" element={<Watchlist />} />

        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
