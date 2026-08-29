import csv
import random
from datetime import datetime

SRC = "datasets/Global_Landslide_Catalog_Export_rows (1).csv"
OUT = "datasets/ne_india_landslide.csv"

STATES = {
    "arunachal": "Arunachal Pradesh",
    "assam": "Assam",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "tripura": "Tripura",
    "sikkim": "Sikkim",
    "darjeeling": "West Bengal",
    "west bengal": "West Bengal",
}


def parse_state(text):
    t = (text or "").lower()
    for key, name in STATES.items():
        if key in t:
            return name
    return "Other"


def fnum(x):
    try:
        return float(x)
    except Exception:
        return None


def parse_date(s):
    for fmt in ("%m/%d/%Y %I:%M:%S %p", "%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s.strip(), fmt)
        except Exception:
            continue
    return None


def main():
    rows = list(csv.DictReader(open(SRC, encoding="utf-8", errors="replace")))
    india = [r for r in rows if (r.get("country_name") or "").strip().lower() == "india"]

    ne = []
    for r in india:
        lat = fnum(r["latitude"])
        lon = fnum(r["longitude"])
        if not (lat and lon):
            continue
        if not (21.0 <= lat <= 30.0 and 87.0 <= lon <= 98.0):
            continue
        d = parse_date(r["event_date"])
        if not d:
            continue
        ne.append(
            {
                "latitude": lat,
                "longitude": lon,
                "month": d.month,
                "year": d.year,
                "state": parse_state(r.get("location_description")),
            }
        )

    print(f"NE positive events: {len(ne)}")

    random.seed(42)
    years = list(range(2007, 2025))
    out_rows = []
    for ev in ne:
        out_rows.append({**ev, "landslide_occurred": 1})
        # location-matched negatives: same spot, other months/years
        for _ in range(3):
            out_rows.append(
                {
                    "latitude": ev["latitude"],
                    "longitude": ev["longitude"],
                    "month": random.randint(1, 12),
                    "year": random.choice(years),
                    "state": ev["state"],
                    "landslide_occurred": 0,
                }
            )

    with open(OUT, "w", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["latitude", "longitude", "month", "year", "state", "landslide_occurred"],
        )
        w.writeheader()
        w.writerows(out_rows)

    pos = sum(1 for r in out_rows if r["landslide_occurred"] == 1)
    print(f"Wrote {len(out_rows)} rows ({pos} positive) -> {OUT}")


if __name__ == "__main__":
    main()
