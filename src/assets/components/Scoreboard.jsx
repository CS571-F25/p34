export default function Scoreboard({ games }) {
  return (
    <div>
      {games.map((g, i) => (
        <div key={i} className="scoreboard-row">
          <strong>{g.home}</strong> {g.homeScore} – {g.awayScore} <strong>{g.away}</strong>
        </div>
      ))}
    </div>
  )
}
