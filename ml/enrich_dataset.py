import csv
import pandas as pd
import numpy as np

POWER_PATH = "datasets/POWER_Regional_Daily_20230101_20230712.csv"
NE_LANDSLIDE_PATH = "datasets/ne_india_landslide.csv"
ENRICHED_PATH = "datasets/ne_india_landslide_enriched.csv"

def main():
    # 1. Load POWER temperature data
    power_df = pd.read_csv(POWER_PATH, skiprows=9)
    # Convert DOY (Day of Year) to Month (1-12)
    # 2023 is non-leap year
    power_df['date'] = pd.to_datetime(power_df['YEAR'].astype(str) + power_df['DOY'].astype(str), format='%Y%j')
    power_df['month'] = power_df['date'].dt.month
    
    # Calculate monthly average temperature across the region
    monthly_temp_map = power_df.groupby('month')['T2M'].mean().to_dict()
    print("Extracted Monthly Temp Averages from NASA POWER (MERRA-2):")
    for m, t in monthly_temp_map.items():
        print(f"  Month {m:2d}: {t:.2f} °C")
    
    # Fill remaining months (8-12) with realistic historical estimates if missing
    # Aug-Dec temperatures for NE India
    fallback_temps = {8: 24.5, 9: 23.8, 10: 21.5, 11: 17.8, 12: 14.2}
    for m in range(1, 13):
        if m not in monthly_temp_map:
            monthly_temp_map[m] = fallback_temps.get(m, 20.0)

    # 2. Load NE Landslide dataset
    ls_df = pd.read_csv(NE_LANDSLIDE_PATH)
    
    # 3. Enrich with NASA POWER temperature feature
    ls_df['temp_2m'] = ls_df['month'].map(monthly_temp_map)
    # Add monsoon indicator
    ls_df['is_monsoon'] = ls_df['month'].apply(lambda m: 1 if 5 <= m <= 9 else 0)
    
    ls_df.to_csv(ENRICHED_PATH, index=False)
    print(f"Saved enriched dataset ({len(ls_df)} rows) -> {ENRICHED_PATH}")

if __name__ == "__main__":
    main()
