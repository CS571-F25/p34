"""
Pulls current-season roster + PPR fantasy points from nfl_data_py and writes a
static JSON file under public/data/players_2024.json for the frontend.
"""

from __future__ import annotations

import json
import ssl
from pathlib import Path

import pandas as pd
from nfl_data_py import import_seasonal_rosters, import_weekly_data

YEAR = 2024
OUTPUT = Path(__file__).resolve().parent.parent / "public" / "data" / "players_2024.json"

ALLOWED_POSITIONS = {"QB", "RB", "WR", "TE", "K", "DEF", "DST"}

TEAM_DETAILS = {
    "ATL": {"name": "Atlanta Falcons"},
    "BAL": {"name": "Baltimore Ravens"},
    "BUF": {"name": "Buffalo Bills"},
    "CAR": {"name": "Carolina Panthers"},
    "CHI": {"name": "Chicago Bears"},
    "CIN": {"name": "Cincinnati Bengals"},
    "CLE": {"name": "Cleveland Browns"},
    "DAL": {"name": "Dallas Cowboys"},
    "DEN": {"name": "Denver Broncos"},
    "DET": {"name": "Detroit Lions"},
    "GB": {"name": "Green Bay Packers"},
    "HOU": {"name": "Houston Texans"},
    "IND": {"name": "Indianapolis Colts"},
    "JAX": {"name": "Jacksonville Jaguars"},
    "KC": {"name": "Kansas City Chiefs"},
    "LV": {"name": "Las Vegas Raiders"},
    "LAC": {"name": "Los Angeles Chargers"},
    "LAR": {"name": "Los Angeles Rams"},
    "MIA": {"name": "Miami Dolphins"},
    "MIN": {"name": "Minnesota Vikings"},
    "NE": {"name": "New England Patriots"},
    "NO": {"name": "New Orleans Saints"},
    "NYG": {"name": "New York Giants"},
    "NYJ": {"name": "New York Jets"},
    "PHI": {"name": "Philadelphia Eagles"},
    "PIT": {"name": "Pittsburgh Steelers"},
    "SEA": {"name": "Seattle Seahawks"},
    "SF": {"name": "San Francisco 49ers"},
    "TB": {"name": "Tampa Bay Buccaneers"},
    "TEN": {"name": "Tennessee Titans"},
    "WAS": {"name": "Washington Commanders"},
}


def map_status(raw: str | None) -> str:
    if not raw:
        return "Active"
    s = raw.lower()
    if "doubt" in s:
        return "Doubtful"
    if "quest" in s or s == "q":
        return "Questionable"
    if any(x in s for x in ("out", "pup", "ir", "dnp")):
        return "Out"
    if "sus" in s:
        return "Suspended"
    return "Active"


def main() -> None:
    # Some environments need this for nflverse parquet fetches.
    ssl._create_default_https_context = ssl._create_unverified_context  # type: ignore

    rosters = import_seasonal_rosters([YEAR])
    weekly = import_weekly_data([YEAR])

    weekly_points = (
        weekly.groupby("player_id")
        .agg(points=("fantasy_points_ppr", "sum"), games=("week", "nunique"))
        .reset_index()
    )

    merged = rosters.merge(weekly_points, on="player_id", how="left")
    merged["points"] = merged["points"].fillna(0)
    merged["games"] = merged["games"].fillna(0)

    merged["avg_points"] = merged.apply(
        lambda row: float(row.points) / row.games if row.games else float(row.points),
        axis=1,
    )

    output_records = []
    for _, row in merged.iterrows():
        pos = str(row.position or "").upper()
        if pos == "DEF":
            pos = "DST"
        if pos not in ALLOWED_POSITIONS:
            continue

        team = str(row.team or "").upper()
        if team not in TEAM_DETAILS:
            continue

        name = row.player_name or f"{row.first_name or ''} {row.last_name or ''}".strip()
        output_records.append(
            {
                "id": f"player-{row.player_id}",
                "rawId": row.player_id,
                "name": name,
                "position": pos,
                "team": team,
                "teamName": TEAM_DETAILS[team]["name"],
                "points": float(row.points),
                "avgPoints": float(row.avg_points),
                "status": map_status(row.status),
                "byeWeek": None,
            }
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(
            {
                "season": YEAR,
                "count": len(output_records),
                "updated": pd.Timestamp.utcnow().isoformat(),
                "players": output_records,
            },
            indent=2,
        )
    )
    print(f"Saved {len(output_records)} players to {OUTPUT}")


if __name__ == "__main__":  # pragma: no cover
    main()
