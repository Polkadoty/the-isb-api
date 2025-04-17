import sqlite3
import pandas as pd

# Connect to the database
conn = sqlite3.connect('armada_fleets-357111.db')
cursor = conn.cursor()

# Get table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in the database:", tables)

# Get column information
cursor.execute("PRAGMA table_info(fleets)")
columns = cursor.fetchall()
print("\nColumns in the fleets table:")
for col in columns:
    print(col)

# Count total records
cursor.execute("SELECT COUNT(*) FROM fleets")
count = cursor.fetchone()[0]
print(f"\nTotal records: {count}")

# Sample data query (first 5 records)
cursor.execute("SELECT numerical_id, fleet_name, faction, commander, points FROM fleets LIMIT 5")
sample_data = cursor.fetchall()
print("\nSample data:")
for row in sample_data:
    print(row)

# Using pandas for more complex analysis
df = pd.read_sql_query("SELECT * FROM fleets", conn)
print("\nDatabase summary using pandas:")
print(df.describe())

# Faction distribution
print("\nFaction distribution:")
print(df['faction'].value_counts())

# Close the connection
conn.close()