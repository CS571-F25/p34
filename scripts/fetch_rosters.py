"""
Fetch 2024 offensive players from nfl_data_py weekly rosters, normalize, and
export to JSON + Parquet for the front-end.

Usage:
  python scripts/fetch_rosters.py

Outputs:
  public/data/players_2024.json
  public/data/nfl_rosters_2024.parquet
"""

import json
from pathlib import Path

import pandas as pd
from nfl_data_py import import_weekly_rosters
import ssl

# Allow running in environments without system certs
ssl._create_default_https_context = ssl._create_unverified_context

OUTPUT_JSON = Path("public/data/players_2024.json")
OUTPUT_PARQUET = Path("public/data/nfl_rosters_2024.parquet")
SEASONS = [2024]
OFFENSE_POSITIONS = {"QB", "RB", "WR", "TE", "FB"}


def canonical_position(pos: str) -> str | None:
  if not pos:
    return None
  upper = pos.upper()
  if upper == "FB":
    return "RB"
  return upper if upper in OFFENSE_POSITIONS else None


def main():
  roster = import_weekly_rosters(SEASONS)
  roster = roster[roster["team"].notna() & (roster["team"] != "FA")]

  roster["position"] = roster["position"].apply(canonical_position)
  roster = roster[roster["position"].notna()]

  roster["player_name"] = roster["player_name"].fillna("")
  need_name = roster["player_name"] == ""
  roster.loc[need_name, "player_name"] = (
    roster.loc[need_name, "first_name"].fillna("")
    + " "
    + roster.loc[need_name, "last_name"].fillna("")
  ).str.strip()

  id_fields = [
    "gsis_id",
    "pfr_id",
    "pff_id",
    "sportradar_id",
    "yahoo_id",
    "fantasy_data_id",
    "rotowire_id",
    "rotoworld_id",
  ]

  def build_external(row):
    ids = {k: row[k] for k in id_fields if pd.notna(row.get(k))}
    ids["app_id"] = f"player-{row['player_id']}"
    ids["player_id"] = row["player_id"]
    return ids

  roster["external_ids"] = roster.apply(build_external, axis=1)
  roster["app_id"] = roster["player_id"].apply(lambda pid: f"player-{pid}")
  roster["status"] = roster["status"].fillna("active")

  if "bye_week" not in roster.columns:
    roster["bye_week"] = None

  columns = [
    "player_id",
    "app_id",
    "player_name",
    "position",
    "team",
    "status",
    "bye_week",
    "first_name",
    "last_name",
    "external_ids",
  ]

  normalized = roster[columns].copy()
  normalized = normalized.drop_duplicates(subset=["player_id"])

  OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
  normalized.to_json(OUTPUT_JSON, orient="records")

  # Cache the richer source data too
  roster.to_parquet(OUTPUT_PARQUET, index=False)

  print(f"Wrote {len(normalized)} players to {OUTPUT_JSON}")
  print(f"Cached roster parquet to {OUTPUT_PARQUET}")


if __name__ == "__main__":
  main()
