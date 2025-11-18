import { useParams } from 'react-router'
import { Card, Button } from 'react-bootstrap'

export default function PlayerDetails() {
  const { id } = useParams()
  const player = window.__GLOBAL_PLAYERS__?.find(p => p.id === id)

  if (!player) return <h2 style={{ color: '#0f172a' }}>Player not found.</h2>

  return (
    <Card style={{ maxWidth: '650px' }}>
      <Card.Body>
        <Card.Title>{player.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {player.team} · {player.position}
        </Card.Subtitle>
        <p>Total Points: {player.points.toFixed(1)}</p>
        <p>Avg/Game: {player.avgPoints.toFixed(1)}</p>
        <p>Status: {player.status}</p>
        <Button href="#/players" variant="primary">Back</Button>
      </Card.Body>
    </Card>
  )
}
