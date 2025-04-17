import requests
import time
import sqlite3
import re
import os
import argparse
import logging
import socket
import urllib3
from multiprocessing import Process, Value, Lock
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("armada_scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ArmadaScraper")

# Suppress noisy selenium logs
logging.getLogger('selenium.webdriver.remote.remote_connection').setLevel(logging.WARNING)
logging.getLogger('urllib3.connectionpool').setLevel(logging.WARNING)

# Set environment variables for webdriver manager
os.environ['WDM_LOG_LEVEL'] = '0'
os.environ['WDM_PRINT_FIRST_LINE'] = 'False'

# Internet connectivity check
def check_internet_connection(host="8.8.8.8", port=53, timeout=3):
    """Check if there is an internet connection available"""
    try:
        socket.setdefaulttimeout(timeout)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
        return True
    except (socket.error, socket.timeout):
        return False

# Wait for internet connection to be restored with exponential backoff
def wait_for_internet(initial_delay=5, max_delay=300, max_attempts=None):
    """
    Wait for internet connection to be restored with exponential backoff
    Returns True if connection restored, False if max_attempts reached without success
    """
    delay = initial_delay
    attempt = 0
    
    while max_attempts is None or attempt < max_attempts:
        if check_internet_connection():
            return True
            
        logger.warning(f"No internet connection. Waiting {delay} seconds before retry...")
        time.sleep(delay)
        
        # Increase delay with exponential backoff (up to max_delay)
        delay = min(delay * 2, max_delay)
        attempt += 1
    
    return False

# Database setup
def setup_database(db_file):
    """Create and set up the SQLite database"""
    # Retry database connection in case of issues
    for attempt in range(3):
        try:
            conn = sqlite3.connect(db_file, timeout=60)
            conn.execute("PRAGMA journal_mode=WAL")
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
                shared BOOLEAN DEFAULT 1,
                numerical_id INTEGER UNIQUE
            )
            ''')
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_numerical_id ON fleets(numerical_id)')
            
            conn.commit()
            return conn, cursor
        except sqlite3.Error as e:
            if attempt < 2:
                logger.warning(f"Database connection error: {e}. Retrying in 2 seconds...")
                time.sleep(2)
            else:
                logger.error(f"Failed to set up database after multiple attempts: {e}")
                raise

# Setup Selenium WebDriver with robust error prevention
def setup_driver(retry_count=3):
    """Set up Chrome WebDriver with optimized settings for stability"""
    for attempt in range(retry_count):
        try:
            options = webdriver.ChromeOptions()
            
            # Performance and stability options
            options.add_argument('--headless')
            options.add_argument('--disable-gpu')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-features=VizDisplayCompositor')
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-software-rasterizer')
            options.add_argument('--disable-browser-side-navigation')
            
            # Memory management
            options.add_argument('--disable-application-cache')
            options.add_argument('--disable-infobars')
            options.add_argument('--js-flags=--expose-gc')
            options.add_argument('--aggressive-cache-discard')
            options.add_argument('--disable-cache')
            options.add_argument('--disable-notifications')
            
            # Process isolation
            options.add_argument('--disable-background-networking')
            options.add_argument('--disable-background-timer-throttling')
            options.add_argument('--disable-backgrounding-occluded-windows')
            
            # Reduce logging noise
            options.add_argument('--log-level=3')
            options.add_experimental_option('excludeSwitches', ['enable-logging'])
            
            # Set reasonable page load timeout
            options.page_load_strategy = 'eager'
            
            # Check internet connection before attempting driver setup
            if not check_internet_connection():
                logger.warning("No internet connection detected before driver setup. Waiting for connection...")
                if not wait_for_internet():
                    logger.error("Internet connection not restored. Cannot set up WebDriver.")
                    raise ConnectionError("No internet connection available")
            
            # Setup service with automatic chromedriver management
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            driver.set_page_load_timeout(30)
            driver.set_script_timeout(30)
            return driver
            
        except Exception as e:
            if "No internet connection available" in str(e):
                # Let's wait for internet and retry
                if wait_for_internet():
                    continue
                else:
                    raise
                    
            logger.warning(f"Failed to create WebDriver (attempt {attempt+1}/{retry_count}): {e}")
            
            if attempt < retry_count - 1:
                logger.info("Retrying driver setup in 5 seconds...")
                time.sleep(5)
            else:
                # Last attempt with minimal options
                try:
                    logger.info("Trying with minimal Chrome options...")
                    minimal_options = webdriver.ChromeOptions()
                    minimal_options.add_argument('--headless')
                    minimal_options.add_argument('--disable-gpu')
                    minimal_options.add_argument('--no-sandbox')
                    service = Service(ChromeDriverManager().install())
                    driver = webdriver.Chrome(service=service, options=minimal_options)
                    return driver
                except Exception as e2:
                    logger.error(f"Final WebDriver setup attempt failed: {e2}")
                    raise

# Get the highest processed ID from database
def get_highest_processed_id(db_file):
    """Retrieve the highest fleet ID that has been processed in the database"""
    if not os.path.exists(db_file):
        return None
    
    for attempt in range(3):
        try:
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            cursor.execute("SELECT MAX(numerical_id) FROM fleets")
            result = cursor.fetchone()[0]
            conn.close()
            return result
        except sqlite3.Error as e:
            if attempt < 2:
                logger.warning(f"Database error retrieving highest ID: {e}. Retrying...")
                time.sleep(2)
            else:
                logger.error(f"Failed to retrieve highest processed ID: {e}")
                return None

# Safely navigate to URL with connection handling
def safe_navigate(driver, url, max_retries=5):
    """Navigate to URL with retry logic for connection issues"""
    for attempt in range(max_retries):
        try:
            driver.get(url)
            return True
        except WebDriverException as e:
            error_message = str(e).lower()
            
            # Check for connection-related errors
            if any(err in error_message for err in [
                "net::err_internet_disconnected", 
                "net::err_proxy_connection_failed",
                "net::err_connection_reset",
                "net::err_connection_refused",
                "net::err_name_not_resolved",
                "net::err_connection_timed_out"
            ]):
                logger.warning(f"Connection error navigating to {url}: {e}")
                
                # Wait for internet connection to be restored
                if not wait_for_internet(initial_delay=5, max_delay=60):
                    logger.error("Internet connection not restored after multiple attempts")
                    return False
                    
                # If browser crashed, need to recreate it
                if "chrome not reachable" in error_message:
                    logger.warning("Browser crashed. Need to recreate WebDriver.")
                    return False
                
                # Continue to next attempt
                continue
            elif "timeout" in error_message:
                if attempt < max_retries - 1:
                    logger.warning(f"Timeout navigating to {url}. Retrying...")
                    time.sleep(3)
                    continue
                else:
                    logger.error(f"Maximum retries reached for timeout on {url}")
                    return False
            else:
                logger.error(f"Non-connection error navigating to {url}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(3)
                    continue
                else:
                    return False
    
    return False

# Extract fleet data with robust error handling and recovery
def extract_fleet_data(fleet_id, driver, max_retries=3):
    """Extract fleet data from the website with retry mechanism"""
    for attempt in range(max_retries):
        try:
            # Clear cookies and cache between attempts
            if attempt > 0:
                try:
                    driver.delete_all_cookies()
                    driver.execute_script('window.localStorage.clear(); window.sessionStorage.clear();')
                except Exception as e:
                    logger.warning(f"Failed to clear browser state: {e}")
            
            # First check if the fleet exists
            fleet_url = f"https://armada.ryankingston.com/fleet/{fleet_id}/"
            
            # Use safe navigation that handles connection issues
            if not safe_navigate(driver, fleet_url):
                logger.warning(f"Safe navigation failed for fleet {fleet_id}. Checking internet...")
                
                # If we can't navigate, it might be a connection issue
                if not check_internet_connection():
                    logger.warning("Internet connection lost. Waiting for restoration...")
                    if wait_for_internet():
                        # Internet restored, but we need a fresh browser
                        logger.info("Internet restored. Browser needs reset.")
                        # Signal to caller that browser needs reset
                        return {"needs_reset": True}
                    else:
                        logger.error("Internet connection not restored after multiple attempts")
                        return {"needs_reset": True}
                
                # If we have internet but navigation failed, retry with a fresh attempt
                if attempt < max_retries - 1:
                    continue
                else:
                    return None
            
            # Wait for the page to load
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except TimeoutException:
                logger.warning(f"Timeout waiting for fleet page {fleet_id} to load")
                # Check for internet connection issues
                if not check_internet_connection():
                    logger.warning("Internet connection lost during page load. Waiting for restoration...")
                    if wait_for_internet():
                        # Internet restored, but we'll need a fresh browser
                        return {"needs_reset": True}
                    else:
                        logger.error("Internet connection not restored after waiting")
                        return {"needs_reset": True}
                        
                # If internet is ok but page still timed out, continue to next attempt
                if attempt < max_retries - 1:
                    continue
                else:
                    return None
            
            # Check if redirected to home page (private or non-existent fleet)
            if driver.current_url == "https://armada.ryankingston.com/":
                logger.info(f"Fleet {fleet_id} is private or doesn't exist. Skipping...")
                return None
            
            # Find and click the export button
            try:
                # Look for the export button
                try:
                    export_button = WebDriverWait(driver, 8).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, "button.export"))
                    )
                    
                    # Try JavaScript click first (more reliable)
                    try:
                        driver.execute_script("arguments[0].click();", export_button)
                    except Exception as js_e:
                        logger.warning(f"JavaScript click failed, trying regular click: {js_e}")
                        export_button.click()
                    
                    # Wait for new tab to open
                    WebDriverWait(driver, 8).until(lambda d: len(d.window_handles) > 1)
                except TimeoutException:
                    logger.warning(f"Export button not found or not clickable for fleet {fleet_id}")
                    
                    # Check for internet connection issues
                    if not check_internet_connection():
                        logger.warning("Internet connection lost while waiting for export button. Waiting for restoration...")
                        if wait_for_internet():
                            # Internet restored, but need a browser reset
                            return {"needs_reset": True}
                        else:
                            logger.error("Internet connection not restored after waiting")
                            return {"needs_reset": True}
                    
                    if attempt < max_retries - 1:
                        continue
                    else:
                        return None
                
                # Switch to the new tab
                original_window = driver.current_window_handle
                for window_handle in driver.window_handles:
                    if window_handle != original_window:
                        driver.switch_to.window(window_handle)
                        break
                
                # Wait for export page content to load
                try:
                    WebDriverWait(driver, 8).until(
                        EC.presence_of_element_located((By.TAG_NAME, "body"))
                    )
                except TimeoutException:
                    logger.warning(f"Timeout waiting for export page content for fleet {fleet_id}")
                    
                    # Check for internet issues
                    if not check_internet_connection():
                        # Try to close current tab and switch back first
                        try:
                            driver.close()
                            driver.switch_to.window(original_window)
                        except:
                            pass
                            
                        logger.warning("Internet connection lost while loading export page. Waiting for restoration...")
                        if wait_for_internet():
                            # Internet restored, but need a browser reset
                            return {"needs_reset": True}
                        else:
                            logger.error("Internet connection not restored after waiting")
                            return {"needs_reset": True}
                    
                    # Close current tab and switch back
                    try:
                        driver.close()
                        driver.switch_to.window(original_window)
                    except Exception as e:
                        logger.warning(f"Error closing tab after timeout: {e}")
                        # We'll need a browser reset
                        return {"needs_reset": True}
                    
                    if attempt < max_retries - 1:
                        continue
                    else:
                        return None
                
                # Get the text content
                try:
                    export_text = driver.find_element(By.TAG_NAME, "body").text
                except Exception as e:
                    logger.warning(f"Failed to extract text from export page: {e}")
                    export_text = ""
                
                # Always close the export tab and switch back
                try:
                    driver.close()
                    driver.switch_to.window(original_window)
                except Exception as e:
                    logger.warning(f"Error closing export tab: {e}")
                    # Need a browser reset
                    return {"needs_reset": True}
                
                # Skip if export text is empty
                if not export_text.strip():
                    logger.warning(f"Empty export text for fleet {fleet_id}")
                    if attempt < max_retries - 1:
                        continue
                    else:
                        return None
                
                # Extract fleet information with robust error handling
                try:
                    fleet_name_match = re.search(r"Name:\s+(.*)", export_text)
                    faction_match = re.search(r"Faction:\s+(.*)", export_text)
                    commander_match = re.search(r"Commander:\s+(.*)", export_text)
                    points_match = re.search(r"Total Points:\s+(\d+)", export_text)
                    
                    fleet_name = fleet_name_match.group(1) if fleet_name_match else ""
                    faction = faction_match.group(1) if faction_match else ""
                    commander = commander_match.group(1) if commander_match else ""
                    points = int(points_match.group(1)) if points_match and points_match.group(1).isdigit() else 0
                    
                    # Validate points extraction - use 0 if extraction fails
                    if not isinstance(points, int):
                        points = 0
                    
                    # Check if total points is less than 375
                    if points < 375:
                        logger.info(f"Fleet {fleet_id} has only {points} points. Skipping...")
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
                except Exception as e:
                    logger.error(f"Error extracting fleet information for {fleet_id}: {e}")
                    if attempt < max_retries - 1:
                        continue
                    else:
                        return None
                
            except WebDriverException as e:
                error_msg = str(e).lower()
                if any(err in error_msg for err in [
                    "net::err_internet_disconnected", 
                    "net::err_proxy_connection_failed",
                    "net::err_connection_reset",
                    "net::err_connection_refused",
                    "net::err_name_not_resolved",
                    "net::err_connection_timed_out"
                ]):
                    logger.warning(f"Connection error processing fleet {fleet_id}: {e}")
                    
                    # Wait for internet connection to be restored
                    if not wait_for_internet():
                        logger.error("Internet connection not restored after multiple attempts")
                        return {"needs_reset": True}
                
                logger.error(f"WebDriver error processing fleet {fleet_id}: {e}")
                # For WebDriver errors, we need a browser reset
                return {"needs_reset": True}
                
            except Exception as e:
                logger.error(f"Error processing fleet {fleet_id} (attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    continue
                else:
                    return None
                
        except WebDriverException as e:
            error_msg = str(e).lower()
            if any(err in error_msg for err in [
                "net::err_internet_disconnected", 
                "net::err_proxy_connection_failed",
                "net::err_connection_reset",
                "net::err_connection_refused",
                "net::err_name_not_resolved",
                "net::err_connection_timed_out"
            ]):
                logger.warning(f"Connection error for fleet {fleet_id}: {e}")
                
                # Wait for internet connection to be restored
                if not wait_for_internet():
                    logger.error("Internet connection not restored after multiple attempts")
                    return {"needs_reset": True}
                    
                # Signal that we need a browser reset
                return {"needs_reset": True}
            
            logger.error(f"WebDriver error for fleet {fleet_id}: {e}")
            # For WebDriver errors, we need a new browser instance
            return {"needs_reset": True}
                
        except Exception as e:
            logger.error(f"Unexpected error for fleet {fleet_id}: {e}")
            if attempt < max_retries - 1:
                continue
            else:
                return None
    
    return None  # Return None if all retries failed

# Process range of fleet IDs with internet outage resilience
def process_range(start_id, end_id, db_file, worker_id, browser_reset_count=30):
    """Process a range of fleet IDs with periodic browser recycling and internet outage handling"""
    logger.info(f"Worker {worker_id} starting to process range from {start_id} to {end_id}")
    
    conn = None
    cursor = None
    driver = None
    
    try:
        # Set up database connection
        try:
            conn, cursor = setup_database(db_file)
        except Exception as e:
            logger.error(f"[Worker {worker_id}] Failed to set up database: {e}")
            return
        
        # Initialize the WebDriver
        try:
            driver = setup_driver()
        except Exception as e:
            logger.error(f"[Worker {worker_id}] Failed to set up WebDriver: {e}")
            if conn:
                conn.close()
            return
            
        processed_count = 0
        successful_count = 0
        consecutive_errors = 0
        fleet_id = start_id
        
        # Process fleet IDs until we reach the end
        while fleet_id > end_id:
            logger.info(f"[Worker {worker_id}] Processing fleet ID: {fleet_id}")
            
            # Check if we need a periodic browser reset
            if processed_count >= browser_reset_count:
                logger.info(f"[Worker {worker_id}] Scheduled browser recycle after {browser_reset_count} operations")
                try:
                    driver.quit()
                except Exception as e:
                    logger.warning(f"[Worker {worker_id}] Error during scheduled browser shutdown: {e}")
                
                # Allow some time for resources to be released
                time.sleep(2)
                
                # Check internet before reinitializing
                if not check_internet_connection():
                    logger.warning(f"[Worker {worker_id}] No internet connection during scheduled reset. Waiting...")
                    wait_for_internet()
                
                # Reinitialize the driver
                try:
                    driver = setup_driver()
                    processed_count = 0
                    consecutive_errors = 0
                except Exception as e:
                    logger.error(f"[Worker {worker_id}] Failed to reinitialize WebDriver: {e}")
                    # Sleep and retry driver initialization
                    attempt = 0
                    while attempt < 3:
                        time.sleep(30)  # Wait longer between attempts
                        logger.info(f"[Worker {worker_id}] Retrying driver initialization...")
                        try:
                            driver = setup_driver()
                            processed_count = 0
                            consecutive_errors = 0
                            break
                        except Exception as e:
                            logger.error(f"[Worker {worker_id}] Retry {attempt+1} failed: {e}")
                            attempt += 1
                    
                    if attempt == 3:
                        logger.error(f"[Worker {worker_id}] Failed to reinitialize driver after multiple attempts. Exiting.")
                        break
            
            # Check for too many consecutive errors - might indicate a persistent issue
            if consecutive_errors >= 5:
                logger.warning(f"[Worker {worker_id}] Too many consecutive errors ({consecutive_errors}). Resetting browser...")
                try:
                    driver.quit()
                except:
                    pass
                
                # Check internet before reinitializing
                if not check_internet_connection():
                    logger.warning(f"[Worker {worker_id}] No internet during error recovery. Waiting...")
                    wait_for_internet()
                
                try:
                    driver = setup_driver()
                    consecutive_errors = 0
                except Exception as e:
                    logger.error(f"[Worker {worker_id}] Failed to reinitialize driver after errors: {e}")
                    time.sleep(60)  # Wait longer for system to stabilize
                    try:
                        driver = setup_driver()
                        consecutive_errors = 0
                    except Exception as e:
                        logger.error(f"[Worker {worker_id}] Second attempt to reinitialize failed: {e}")
                        break
            
            # Check if internet is available before processing
            if not check_internet_connection():
                logger.warning(f"[Worker {worker_id}] No internet connection. Waiting for restoration...")
                if wait_for_internet():
                    logger.info(f"[Worker {worker_id}] Internet connection restored.")
                    # Reset the browser after a connection outage
                    try:
                        driver.quit()
                    except:
                        pass
                    driver = setup_driver()
                else:
                    logger.error(f"[Worker {worker_id}] Internet connection not restored after waiting. Exiting.")
                    break
            
            # Check if already in database (with retry for database locks)
            already_in_db = False
            for db_attempt in range(3):
                try:
                    cursor.execute("SELECT numerical_id FROM fleets WHERE numerical_id = ?", (fleet_id,))
                    if cursor.fetchone():
                        logger.info(f"[Worker {worker_id}] Fleet {fleet_id} already in database. Skipping...")
                        already_in_db = True
                        consecutive_errors = 0  # Reset consecutive errors on success
                        break
                    break  # Successfully checked database
                except sqlite3.OperationalError as e:
                    if "database is locked" in str(e) and db_attempt < 2:
                        logger.warning(f"[Worker {worker_id}] Database locked, retrying in 2s...")
                        time.sleep(2)
                    else:
                        logger.error(f"[Worker {worker_id}] Database error checking fleet {fleet_id}: {e}")
                        consecutive_errors += 1
                        break
            
            if already_in_db:
                fleet_id -= 1
                processed_count += 1
                continue
            
            # Extract fleet data with improved extraction function
            fleet_data = None
            try:
                fleet_data = extract_fleet_data(fleet_id, driver)
            except Exception as e:
                logger.error(f"[Worker {worker_id}] Unhandled exception extracting fleet {fleet_id}: {e}")
                consecutive_errors += 1
                
                # Check if we need to reset the browser after an exception
                try:
                    driver.quit()
                except:
                    pass
                
                # Check internet before reinitializing
                if not check_internet_connection():
                    logger.warning(f"[Worker {worker_id}] No internet after extraction error. Waiting...")
                    wait_for_internet()
                
                try:
                    driver = setup_driver()
                except Exception as e:
                    logger.error(f"[Worker {worker_id}] Failed to reinitialize driver after exception: {e}")
                    time.sleep(30)
                    try:
                        driver = setup_driver()
                    except:
                        logger.error(f"[Worker {worker_id}] Second attempt to initialize driver failed. Will retry next fleet.")
            
            # Handle special case where we need to reset the browser
            if isinstance(fleet_data, dict) and fleet_data.get("needs_reset", False):
                logger.info(f"[Worker {worker_id}] Browser reset requested for fleet {fleet_id}")
                try:
                    driver.quit()
                except:
                    pass
                
                # Check internet before reinitializing
                if not check_internet_connection():
                    logger.warning(f"[Worker {worker_id}] No internet during browser reset. Waiting...")
                    wait_for_internet()
                
                try:
                    driver = setup_driver()
                    # Retry the same fleet ID (don't decrement)
                    continue
                except Exception as e:
                    logger.error(f"[Worker {worker_id}] Failed to reinitialize driver: {e}")
                    time.sleep(30)
                    try:
                        driver = setup_driver()
                        continue
                    except:
                        logger.error(f"[Worker {worker_id}] Second browser init attempt failed. Trying next fleet.")
                        fleet_id -= 1
                        consecutive_errors += 1
                        processed_count += 1
                        continue
            
            if fleet_data:
                # Insert into database with retry for locked database
                inserted = False
                for db_attempt in range(3):
                    try:
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
                        logger.info(f"[Worker {worker_id}] Added fleet {fleet_id} to database")
                        successful_count += 1
                        consecutive_errors = 0  # Reset consecutive errors on success
                        inserted = True
                        break
                    except sqlite3.IntegrityError:
                        logger.info(f"[Worker {worker_id}] Fleet {fleet_id} already exists (integrity error). Skipping...")
                        consecutive_errors = 0  # Reset consecutive errors - this is a normal condition
                        inserted = True
                        break
                    except sqlite3.OperationalError as e:
                        if "database is locked" in str(e) and db_attempt < 2:
                            logger.warning(f"[Worker {worker_id}] Database locked during insert, retrying in 2s...")
                            time.sleep(2)
                        else:
                            logger.error(f"[Worker {worker_id}] Database error inserting fleet {fleet_id}: {e}")
                            consecutive_errors += 1
                            break
                    except Exception as db_e:
                        logger.error(f"[Worker {worker_id}] Unexpected database error: {db_e}")
                        consecutive_errors += 1
                        break
                
                if not inserted:
                    # If we couldn't insert due to database errors, save to a backup file
                    try:
                        backup_dir = os.path.join(os.path.dirname(db_file), "backup_data")
                        os.makedirs(backup_dir, exist_ok=True)
                        backup_file = os.path.join(backup_dir, f"fleet_{fleet_id}.txt")
                        with open(backup_file, 'w', encoding='utf-8') as f:
                            f.write(str(fleet_data))
                        logger.info(f"[Worker {worker_id}] Saved fleet {fleet_id} to backup file due to database error")
                    except Exception as backup_e:
                        logger.error(f"[Worker {worker_id}] Failed to save backup: {backup_e}")
            else:
                # If fleet_data is None, we couldn't extract data but there was no connection error
                logger.info(f"[Worker {worker_id}] No data extracted for fleet {fleet_id}")
            
            # Increment our processed count and move to next fleet ID
            processed_count += 1
            fleet_id -= 1
            
            # Add a randomized delay to be respectful to the server and reduce blocking
            sleep_time = 1.0 + (0.5 * (worker_id % 3))  # Stagger workers to reduce server load
            time.sleep(sleep_time)
            
            # Periodically report progress
            if processed_count % 10 == 0:
                completion_pct = ((start_id - fleet_id) / (start_id - end_id)) * 100 if start_id != end_id else 100
                logger.info(f"[Worker {worker_id}] Progress: {completion_pct:.1f}% complete. " 
                           f"Successful: {successful_count}/{processed_count}")
                
                # Save progress checkpoint to file
                try:
                    checkpoint_dir = os.path.join(os.path.dirname(db_file), "checkpoints")
                    os.makedirs(checkpoint_dir, exist_ok=True)
                    checkpoint_file = os.path.join(checkpoint_dir, f"worker_{worker_id}_checkpoint.txt")
                    with open(checkpoint_file, 'w') as f:
                        f.write(f"{fleet_id}")
                    logger.info(f"[Worker {worker_id}] Saved checkpoint at fleet ID {fleet_id}")
                except Exception as e:
                    logger.warning(f"[Worker {worker_id}] Failed to save checkpoint: {e}")
            
    except KeyboardInterrupt:
        logger.info(f"[Worker {worker_id}] Script interrupted by user")
    except Exception as e:
        logger.error(f"[Worker {worker_id}] Error in processing range: {e}")
        # Write error details to file for debugging
        try:
            error_dir = os.path.join(os.path.dirname(db_file), "errors")
            os.makedirs(error_dir, exist_ok=True)
            error_file = os.path.join(error_dir, f"worker_{worker_id}_error.txt")
            with open(error_file, 'w') as f:
                f.write(f"Error at fleet ID {fleet_id}: {str(e)}")
            logger.info(f"[Worker {worker_id}] Saved error details to {error_file}")
        except:
            pass
            
        # Save last processed ID to checkpoint for recovery
        try:
            checkpoint_dir = os.path.join(os.path.dirname(db_file), "checkpoints")
            os.makedirs(checkpoint_dir, exist_ok=True)
            checkpoint_file = os.path.join(checkpoint_dir, f"worker_{worker_id}_checkpoint.txt")
            with open(checkpoint_file, 'w') as f:
                f.write(f"{fleet_id}")
            logger.info(f"[Worker {worker_id}] Saved emergency checkpoint at fleet ID {fleet_id}")
        except:
            pass
    finally:
        # Ensure WebDriver is properly closed
        if driver:
            try:
                driver.quit()
            except:
                pass
        
        # Close database connection
        if conn:
            try:
                conn.close()
            except:
                pass
            
        logger.info(f"[Worker {worker_id}] Processing completed for range {start_id} to {end_id}")

# Merge multiple database files
def merge_databases(source_files, destination_file, chunk_size=1000):
    """Merge multiple database files into one with chunk processing for memory efficiency"""
    # Create destination database
    dest_conn, dest_cursor = setup_database(destination_file)
    
    try:
        # Get total number of records for progress reporting
        total_records = 0
        for source_file in source_files:
            if not os.path.exists(source_file):
                logger.warning(f"Source file {source_file} doesn't exist. Skipping...")
                continue
                
            try:
                source_conn = sqlite3.connect(source_file)
                source_cursor = source_conn.cursor()
                source_cursor.execute("SELECT COUNT(*) FROM fleets")
                count = source_cursor.fetchone()[0]
                total_records += count
                source_conn.close()
            except Exception as e:
                logger.error(f"Error counting records in {source_file}: {e}")
        
        logger.info(f"Merging {total_records} records from {len(source_files)} databases...")
        
        # Process each source database
        processed_records = 0
        for idx, source_file in enumerate(source_files, 1):
            if not os.path.exists(source_file):
                continue
                
            logger.info(f"Merging data from {source_file} ({idx}/{len(source_files)})...")
            
            try:
                source_conn = sqlite3.connect(source_file)
                source_cursor = source_conn.cursor()
                
                # Get column names
                source_cursor.execute("PRAGMA table_info(fleets)")
                columns = [column[1] for column in source_cursor.fetchall()]
                columns_str = ", ".join(columns)
                
                # Process in chunks to avoid memory issues
                source_cursor.execute("SELECT COUNT(*) FROM fleets")
                total_in_file = source_cursor.fetchone()[0]
                
                for offset in range(0, total_in_file, chunk_size):
                    source_cursor.execute(f"SELECT {columns_str} FROM fleets LIMIT {chunk_size} OFFSET {offset}")
                    fleets_chunk = source_cursor.fetchall()
                    
                    if fleets_chunk:
                        # Insert into destination
                        placeholders = ", ".join(["?" for _ in range(len(columns))])
                        
                        for fleet in fleets_chunk:
                            try:
                                dest_cursor.execute(f"INSERT OR IGNORE INTO fleets ({columns_str}) VALUES ({placeholders})", fleet)
                            except sqlite3.IntegrityError:
                                # Skip duplicates
                                pass
                            
                            processed_records += 1
                            
                        dest_conn.commit()
                        
                        # Report progress
                        if offset % (chunk_size * 10) == 0:
                            logger.info(f"Merged {processed_records}/{total_records} records ({processed_records/total_records*100:.1f}%)")
                
                source_conn.close()
                
            except Exception as e:
                logger.error(f"Error processing {source_file}: {e}")
                
        logger.info(f"Merged all databases into {destination_file}. Total records processed: {processed_records}")
        
    except Exception as e:
        logger.error(f"Error merging databases: {e}")
    finally:
        dest_conn.close()

# Check for and load saved checkpoint
def load_checkpoint(db_file, worker_id, original_start):
    """Load checkpoint for a worker to resume from previous run"""
    checkpoint_dir = os.path.join(os.path.dirname(db_file), "checkpoints")
    checkpoint_file = os.path.join(checkpoint_dir, f"worker_{worker_id}_checkpoint.txt")
    
    if os.path.exists(checkpoint_file):
        try:
            with open(checkpoint_file, 'r') as f:
                fleet_id = int(f.read().strip())
                logger.info(f"[Worker {worker_id}] Loaded checkpoint at fleet ID {fleet_id}")
                return fleet_id
        except Exception as e:
            logger.warning(f"[Worker {worker_id}] Error loading checkpoint: {e}")
    
    # If no checkpoint or error, check database for highest processed ID
    highest_id = get_highest_processed_id(db_file)
    if highest_id:
        return highest_id
    
    # Fall back to original start ID
    return original_start

# Monitor process
def monitor_worker_processes(processes, ranges, max_restart_attempts=3):
    """Monitor worker processes and restart them if they die"""
    restart_counts = {i+1: 0 for i in range(len(processes))}
    
    while any(p.is_alive() for p in processes):
        for i, p in enumerate(processes):
            worker_id = i + 1
            
            if not p.is_alive() and restart_counts[worker_id] < max_restart_attempts:
                logger.warning(f"Worker {worker_id} is not running. Attempting restart ({restart_counts[worker_id]+1}/{max_restart_attempts})...")
                
                # Get the original range for this worker
                start_id, end_id, db_file, _ = ranges[i]
                
                # Try to load checkpoint
                start_id = load_checkpoint(db_file, worker_id, start_id)
                
                # Create a new process
                new_process = Process(target=process_range, args=(start_id, end_id, db_file, worker_id))
                new_process.start()
                
                # Replace the old process in our list
                processes[i] = new_process
                
                # Increment restart count
                restart_counts[worker_id] += 1
                
                # Log restart
                logger.info(f"Worker {worker_id} restarted from fleet ID {start_id}")
                
                # Wait a moment between restarts
                time.sleep(5)
        
        # Check every 30 seconds
        time.sleep(30)

# Main function
def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description='Scrape Armada fleet data with improved stability and internet outage resilience')
    parser.add_argument('--workers', type=int, default=16, help='Number of parallel workers')
    parser.add_argument('--start', type=int, default=357110, help='Starting fleet ID')
    parser.add_argument('--end', type=int, default=200000, help='Ending fleet ID')
    parser.add_argument('--reset-count', type=int, default=30, help='Number of operations before browser reset')
    parser.add_argument('--merge', action='store_true', help='Merge databases after completion')
    parser.add_argument('--monitor', action='store_true', help='Enable worker monitoring and automatic restart')
    args = parser.parse_args()
    
    max_workers = args.workers
    original_start_id = args.start
    end_id = args.end
    browser_reset_count = args.reset_count
    
    logger.info(f"Starting Armada fleet scraper with {max_workers} workers")
    logger.info(f"Fleet range: {original_start_id} to {end_id}")
    
    # Create directories for organization
    for directory in ['databases', 'databases/checkpoints', 'databases/errors', 'databases/backup_data']:
        os.makedirs(directory, exist_ok=True)
    
    # Calculate chunk size based on total range and number of workers
    total_ids = original_start_id - end_id
    chunk_size = total_ids // max_workers
    
    # Create ranges for each worker
    ranges = []
    for i in range(max_workers):
        db_file = f"databases/armada_fleets_{i+1}.db"
        
        # Try to load checkpoint first
        checkpoint_start = load_checkpoint(db_file, i+1, None)
        
        # If no checkpoint, then check database or calculate start point
        if checkpoint_start is None:
            # Get the highest processed ID if the database exists
            highest_id = get_highest_processed_id(db_file)
            
            if highest_id is not None:
                start_id = highest_id
                logger.info(f"Resuming worker {i+1} from database ID {start_id}")
            else:
                start_id = original_start_id - (i * chunk_size)
                logger.info(f"Starting worker {i+1} with calculated ID {start_id}")
        else:
            start_id = checkpoint_start
            logger.info(f"Resuming worker {i+1} from checkpoint ID {start_id}")
        
        end_id_for_worker = max(original_start_id - ((i + 1) * chunk_size), end_id)
        ranges.append((start_id, end_id_for_worker, db_file, i+1))
    
    # Process ranges in parallel using separate processes for isolation
    processes = []
    for start, end, db, worker_id in ranges:
        p = Process(target=process_range, args=(start, end, db, worker_id, browser_reset_count))
        processes.append(p)
        p.start()
        # Stagger process starts to avoid overwhelming system resources
        time.sleep(2)
    
    # Monitor processes and restart them if they die
    if args.monitor:
        logger.info("Starting worker process monitor...")
        monitor_process = Process(target=monitor_worker_processes, args=(processes, ranges))
        monitor_process.start()
    
    try:
        # Wait for all processes to complete
        for p in processes:
            p.join()
            
        # If monitoring is enabled, terminate the monitor process
        if args.monitor and monitor_process.is_alive():
            monitor_process.terminate()
            monitor_process.join(timeout=5)
            
    except KeyboardInterrupt:
        logger.info("Main process interrupted. Waiting for workers to terminate...")
        # Let processes terminate gracefully
        for p in processes:
            p.join(timeout=10)
            
        # If monitoring is enabled, terminate the monitor process
        if args.monitor and monitor_process.is_alive():
            monitor_process.terminate()
            monitor_process.join(timeout=5)
    
    logger.info("All workers have completed their tasks")
    
    # Merge databases if requested
    if args.merge:
        logger.info("Merging databases as requested...")
        source_files = [r[2] for r in ranges]
        merge_databases(source_files, "armada_fleets_merged.db")
    else:
        logger.info("To merge all databases later, run: python script_name.py --merge")

if __name__ == "__main__":
    main()