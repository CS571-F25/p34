import { useEffect, useState } from 'react'
import { Table } from 'react-bootstrap'

export default function LeagueStats() {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    async function load() {
      const resp = await fetch("https://api.nflfastR.com/team_stats?season=2024")
      const json = await resp.json()
      setTeams(json)
    }
    load()
  }, [])

  return (
    <div style={{ width: '100%', maxWidth: '900px' }}>
      <h1>League Stats</h1>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Team</th>
            <th>Wins</th>
            <th>Points For</th>
            <th>Points Against</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <tr key={t.team}>
              <td>{t.team}</td>
              <td>{t.wins}</td>
              <td>{t.points_for}</td>
              <td>{t.points_against}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
