import requests
from bs4 import BeautifulSoup
import time
import sqlite3
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

# Database setup
def setup_database():
    conn = sqlite3.connect('armada_fleets.db')
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS fleets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        fleet_data TEXT,
        faction TEXT,
        fleet_name TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        commander TEXT,
        points INTEGER,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        legends BOOLEAN DEFAULT 0,
        legacy BOOLEAN DEFAULT 0,
        old_legacy BOOLEAN DEFAULT 0,
        arc BOOLEAN DEFAULT 0,
        shared BOOLEAN DEFAULT 0,
        numerical_id INTEGER
    )
    ''')
    conn.commit()
    return conn, cursor

# Setup Selenium WebDriver
def setup_driver():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # Run in headless mode
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)

# Extract fleet data
def extract_fleet_data(fleet_id, driver):
    try:
        # First check if the fleet exists
        fleet_url = f"https://armada.ryankingston.com/fleet/{fleet_id}/"
        driver.get(fleet_url)
        
        # Wait for the page to load
        time.sleep(2)
        
        # Check if redirected to home page (private or non-existent fleet)
        if driver.current_url == "https://armada.ryankingston.com/":
            print(f"Fleet {fleet_id} is private or doesn't exist. Skipping...")
            return None
        
        # Find and click the export button
        try:
            export_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.export"))
            )
            export_button.click()
            
            # Switch to the new tab that opened
            driver.switch_to.window(driver.window_handles[-1])
            
            # Wait for the export page to load
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Get the text from the export page
            export_text = driver.find_element(By.TAG_NAME, "body").text
            
            # Close the export tab and switch back to the main tab
            driver.close()
            driver.switch_to.window(driver.window_handles[0])
            
            # Extract fleet information
            fleet_name_match = re.search(r"Name:\s+(.*)", export_text)
            faction_match = re.search(r"Faction:\s+(.*)", export_text)
            commander_match = re.search(r"Commander:\s+(.*)", export_text)
            points_match = re.search(r"Total Points:\s+(\d+)", export_text)
            
            fleet_name = fleet_name_match.group(1) if fleet_name_match else ""
            faction = faction_match.group(1) if faction_match else ""
            commander = commander_match.group(1) if commander_match else ""
            points = int(points_match.group(1)) if points_match else 0
            
            # Check if total points is less than 375
            if points < 375:
                print(f"Fleet {fleet_id} has only {points} points. Skipping...")
                return None
                
            # Return fleet data
            return {
                "fleet_data": export_text,
                "faction": faction,
                "fleet_name": fleet_name,
                "commander": commander,
                "points": points,
                "numerical_id": fleet_id
            }
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"Error processing fleet {fleet_id}: {e}")
            return None
            
    except Exception as e:
        print(f"Unexpected error for fleet {fleet_id}: {e}")
        return None

# Main function
def main():
    conn, cursor = setup_database()
    driver = setup_driver()
    
    try:
        # Loop through fleet IDs in descending order
        for fleet_id in range(361538, 100000, -1):
            print(f"Processing fleet ID: {fleet_id}")
            
            # Check if already in database
            cursor.execute("SELECT numerical_id FROM fleets WHERE numerical_id = ?", (fleet_id,))
            if cursor.fetchone():
                print(f"Fleet {fleet_id} already in database. Skipping...")
                continue
                
            # Extract fleet data
            fleet_data = extract_fleet_data(fleet_id, driver)
            
            if fleet_data:
                # Insert into database
                cursor.execute('''
                INSERT INTO fleets 
                (fleet_data, faction, fleet_name, commander, points, numerical_id, shared)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                ''', (
                    fleet_data["fleet_data"],
                    fleet_data["faction"],
                    fleet_data["fleet_name"],
                    fleet_data["commander"],
                    fleet_data["points"],
                    fleet_data["numerical_id"]
                ))
                
                conn.commit()
                print(f"Added fleet {fleet_id} to database")
            
            # Add a small delay to be respectful to the server
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("Script interrupted by user")
    except Exception as e:
        print(f"Error in main execution: {e}")
    finally:
        driver.quit()
        conn.close()
        print("Script execution completed")

if __name__ == "__main__":
    main()