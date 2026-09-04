"""
Fetch elevation data for NE India coordinates using Open-Elevation API.
Computes slope from elevation gradients between neighboring points.

Public data source: Open-Elevation (https://open-elevation.com/)
- Based on SRTM (Shuttle Radar Topography Mission) 90m resolution
- Free, open-source, no API key required

Usage:
    cd C:\\Users\\Saroj\\OneDrive\\Desktop\\LandAlert
    ml\\.venv\\Scripts\\python.exe ml\\fetch_terrain.py
"""

import pandas as pd
import numpy as np
import requests
import json
import time
import os

LANDSLIDE_DATA = "datasets/ne_india_landslide_enriched.csv"
TERRAIN_OUT = "datasets/ne_terrain_lookup.csv"
TERRAIN_CACHE = "datasets/_terrain_cache.json"

# Open-Elevation API (free, no key needed)
ELEVATION_API = "https://api.open-elevation.com/api/v1/lookup"

# Fallback: approximate elevation ranges by state/region for NE India
# Based on SRTM data and geographical knowledge
STATE_ELEVATION_RANGES = {
    "Arunachal Pradesh": (200, 4000),  # Himalayan foothills to high mountains
    "Assam": (30, 900),                # Brahmaputra valley to low hills
    "Manipur": (200, 2500),            # Valley to surrounding hills
    "Meghalaya": (100, 1900),          # Shillong plateau
    "Mizoram": (200, 2300),            # Hill ranges
    "Nagaland": (200, 3000),           # Naga hills
    "Sikkim": (300, 5000),             # High Himalayan state
    "Tripura": (30, 950),              # Tripura hills
    "West Bengal": (50, 3600),         # Plains to Darjeeling hills
    "Other": (200, 2000),
}

# Approximate slope ranges by state (degrees)
STATE_SLOPE_RANGES = {
    "Arunachal Pradesh": (15, 45),
    "Assam": (2, 20),
    "Manipur": (10, 35),
    "Meghalaya": (10, 40),
    "Mizoram": (15, 40),
    "Nagaland": (15, 40),
    "Sikkim": (20, 55),
    "Tripura": (10, 30),
    "West Bengal": (5, 45),
    "Other": (10, 35),
}


def fetch_elevation_batch(coords, batch_size=100):
    """Fetch elevation for a batch of (lat, lon) coordinates."""
    elevations = {}
    
    for i in range(0, len(coords), batch_size):
        batch = coords[i:i + batch_size]
        locations = [{"latitude": lat, "longitude": lon} for lat, lon in batch]
        
        try:
            resp = requests.post(
                ELEVATION_API,
                json={"locations": locations},
                timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            
            for j, result in enumerate(data.get("results", [])):
                lat, lon = batch[j]
                elevations[(lat, lon)] = result.get("elevation", None)
            
            print(f"  Fetched batch {i // batch_size + 1}: {len(batch)} coordinates")
            time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            print(f"  Warning: Batch {i // batch_size + 1} failed: {e}")
            # Continue with next batch
            continue
    
    return elevations


def compute_slope(elevations, coord_list):
    """
    Compute slope (in degrees) for each coordinate using neighboring elevation values.
    Slope = arctan(max_elevation_diff / distance) * (180 / pi)
    """
    slopes = {}
    
    # Build a spatial index for quick neighbor lookup
    coord_array = np.array(coord_list)
    
    for i, (lat, lon) in enumerate(coord_list):
        elev = elevations.get((lat, lon))
        if elev is None:
            slopes[(lat, lon)] = None
            continue
        
        # Find neighbors within ~0.1 degree (~10km)
        neighbors = []
        for j, (nlat, nlon) in enumerate(coord_list):
            if i == j:
                continue
            dist = np.sqrt((lat - nlat)**2 + (lon - nlon)**2)
            if dist < 0.1 and dist > 0.001:  # Within 10km, not same point
                n_elev = elevations.get((nlat, nlon))
                if n_elev is not None:
                    # Approximate distance in meters (1 degree ~ 111km)
                    dist_m = dist * 111000
                    elev_diff = abs(n_elev - elev)
                    slope_rad = np.arctan(elev_diff / dist_m)
                    slope_deg = np.degrees(slope_rad)
                    neighbors.append(slope_deg)
        
        if neighbors:
            # Use median slope from neighbors
            slopes[(lat, lon)] = round(np.median(neighbors), 2)
        else:
            slopes[(lat, lon)] = None
    
    return slopes


def generate_fallback_terrain(df):
    """
    Generate terrain data using state-based approximation when API is unavailable.
    Uses random sampling from realistic elevation/slope ranges for each state.
    """
    np.random.seed(42)
    
    elevations = {}
    slopes = {}
    
    for _, row in df.iterrows():
        lat, lon = row["latitude"], row["longitude"]
        state = row["state"]
        
        # Get state-specific ranges
        elev_range = STATE_ELEVATION_RANGES.get(state, (200, 2000))
        slope_range = STATE_SLOPE_RANGES.get(state, (10, 35))
        
        # Add some spatial variation based on latitude
        # Higher latitude in NE India generally means higher elevation
        lat_factor = (lat - 21) / 9  # Normalize 21-30 to 0-1
        
        # Elevation: base + lat-based variation + noise
        elev_base = elev_range[0] + (elev_range[1] - elev_range[0]) * lat_factor
        elev_noise = np.random.normal(0, (elev_range[1] - elev_range[0]) * 0.1)
        elev = np.clip(elev_base + elev_noise, elev_range[0], elev_range[1])
        
        # Slope: correlated with elevation (higher = steeper generally)
        slope_base = slope_range[0] + (slope_range[1] - slope_range[0]) * lat_factor * 0.7
        slope_noise = np.random.normal(0, (slope_range[1] - slope_range[0]) * 0.15)
        slope = np.clip(slope_base + slope_noise, slope_range[0], slope_range[1])
        
        elevations[(lat, lon)] = round(float(elev), 1)
        slopes[(lat, lon)] = round(float(slope), 2)
    
    return elevations, slopes


def main():
    print("=" * 60)
    print("TERRAIN DATA ENRICHMENT FOR NE INDIA LANDSLIDE MODEL")
    print("=" * 60)
    
    # Load training data
    df = pd.read_csv(LANDSLIDE_DATA)
    df = df.dropna(subset=["latitude", "longitude", "state"]).copy()
    print(f"\nLoaded {len(df)} rows from {LANDSLIDE_DATA}")
    
    # Get unique coordinates
    unique_coords = list(set(zip(df["latitude"], df["longitude"])))
    print(f"Unique coordinates: {len(unique_coords)}")
    
    # Check for cached terrain data
    elevations = {}
    slopes = {}
    
    if os.path.exists(TERRAIN_CACHE):
        print(f"\nLoading cached terrain data from {TERRAIN_CACHE}...")
        with open(TERRAIN_CACHE, "r") as f:
            cache = json.load(f)
        elevations = {tuple(k): v for k, v in cache.get("elevations", {}).items()}
        slopes = {tuple(k): v for k, v in cache.get("slopes", {}).items()}
        print(f"  Cached: {len(elevations)} elevations, {len(slopes)} slopes")
    
    # Find coordinates not yet cached
    missing_coords = [c for c in unique_coords if c not in elevations]
    
    if missing_coords:
        print(f"\nFetching elevation for {len(missing_coords)} new coordinates...")
        print("Using Open-Elevation API (SRTM 90m data)...")
        
        new_elevations = fetch_elevation_batch(missing_coords)
        elevations.update(new_elevations)
        
        # Compute slopes from elevation gradients
        print("\nComputing slopes from elevation gradients...")
        new_slopes = compute_slope(elevations, list(elevations.keys()))
        slopes.update(new_slopes)
        
        # Cache results
        cache_data = {
            "elevations": {str(k): v for k, v in elevations.items()},
            "slopes": {str(k): v for k, v in slopes.items()},
        }
        with open(TERRAIN_CACHE, "w") as f:
            json.dump(cache_data, f, indent=2)
        print(f"  Cached terrain data to {TERRAIN_CACHE}")
    
    # Check how many coordinates have real API data vs fallback
    api_elevations = sum(1 for v in elevations.values() if v is not None)
    api_slopes = sum(1 for v in slopes.values() if v is not None)
    
    print(f"\nTerrain data status:")
    print(f"  Elevations: {api_elevations}/{len(unique_coords)} from API")
    print(f"  Slopes: {api_slopes}/{len(unique_coords)} computed")
    
    # If API data is sparse, use fallback for missing
    if api_elevations < len(unique_coords) * 0.5:
        print("\nAPI data sparse — generating fallback terrain from state地理 knowledge...")
        fallback_elev, fallback_slope = generate_fallback_terrain(df)
        
        for coord in unique_coords:
            if coord not in elevations or elevations[coord] is None:
                elevations[coord] = fallback_elev.get(coord)
            if coord not in slopes or slopes[coord] is None:
                slopes[coord] = fallback_slope.get(coord)
        
        print(f"  After fallback: {len([v for v in elevations.values() if v])} elevations")
    
    # Create terrain lookup DataFrame
    terrain_rows = []
    for lat, lon in unique_coords:
        terrain_rows.append({
            "latitude": lat,
            "longitude": lon,
            "elevation_m": elevations.get((lat, lon)),
            "slope_deg": slopes.get((lat, lon)),
        })
    
    terrain_df = pd.DataFrame(terrain_rows)
    
    # Statistics
    print(f"\nTerrain statistics:")
    print(f"  Elevation: min={terrain_df['elevation_m'].min():.0f}m, "
          f"max={terrain_df['elevation_m'].max():.0f}m, "
          f"mean={terrain_df['elevation_m'].mean():.0f}m")
    print(f"  Slope: min={terrain_df['slope_deg'].min():.1f}°, "
          f"max={terrain_df['slope_deg'].max():.1f}°, "
          f"mean={terrain_df['slope_deg'].mean():.1f}°")
    
    # Save terrain lookup
    terrain_df.to_csv(TERRAIN_OUT, index=False)
    print(f"\nSaved terrain lookup -> {TERRAIN_OUT}")
    print(f"  {len(terrain_df)} coordinate -> terrain mappings")
    
    return terrain_df


if __name__ == "__main__":
    main()
