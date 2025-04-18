import sqlite3
import os
import logging
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("database_cleanup.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DatabaseCleanup")

def cleanup_database(db_file, max_points=425, backup=True):
    """Remove all fleets with points over the specified maximum"""
    
    # Check if database exists
    if not os.path.exists(db_file):
        logger.error(f"Database file {db_file} not found!")
        return False
    
    # Create backup if requested
    if backup:
        backup_file = f"{db_file}.backup"
        logger.info(f"Creating backup of database at {backup_file}")
        try:
            # Use binary copy for backup
            with open(db_file, 'rb') as src_file:
                with open(backup_file, 'wb') as dst_file:
                    dst_file.write(src_file.read())
            logger.info("Backup created successfully")
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return False
    
    # Connect to database
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Count total records
        cursor.execute("SELECT COUNT(*) FROM fleets")
        total_records = cursor.fetchone()[0]
        logger.info(f"Total records in database: {total_records}")
        
        # Count records to be deleted
        cursor.execute(f"SELECT COUNT(*) FROM fleets WHERE points > {max_points}")
        records_to_delete = cursor.fetchone()[0]
        logger.info(f"Records to be deleted (points > {max_points}): {records_to_delete}")
        
        if records_to_delete == 0:
            logger.info("No records to delete. Database is already clean.")
            conn.close()
            return True
        
        # Get statistics before deletion
        cursor.execute("SELECT MIN(points), MAX(points), AVG(points) FROM fleets")
        min_pts, max_pts, avg_pts = cursor.fetchone()
        logger.info(f"Before cleanup - Min points: {min_pts}, Max points: {max_pts}, Avg points: {avg_pts:.2f}")
        
        # Count by faction before deletion
        cursor.execute("SELECT faction, COUNT(*) FROM fleets GROUP BY faction")
        faction_counts = cursor.fetchall()
        logger.info("Faction distribution before cleanup:")
        for faction, count in faction_counts:
            logger.info(f"  {faction}: {count}")
        
        # Perform the deletion
        logger.info(f"Deleting fleets with points > {max_points}...")
        cursor.execute(f"DELETE FROM fleets WHERE points > {max_points}")
        conn.commit()
        
        # Count remaining records
        cursor.execute("SELECT COUNT(*) FROM fleets")
        remaining_records = cursor.fetchone()[0]
        logger.info(f"Deletion complete. Records remaining: {remaining_records}")
        
        # Get statistics after deletion
        cursor.execute("SELECT MIN(points), MAX(points), AVG(points) FROM fleets")
        min_pts, max_pts, avg_pts = cursor.fetchone()
        logger.info(f"After cleanup - Min points: {min_pts}, Max points: {max_pts}, Avg points: {avg_pts:.2f}")
        
        # Count by faction after deletion
        cursor.execute("SELECT faction, COUNT(*) FROM fleets GROUP BY faction")
        faction_counts = cursor.fetchall()
        logger.info("Faction distribution after cleanup:")
        for faction, count in faction_counts:
            logger.info(f"  {faction}: {count}")
        
        # Run VACUUM to reclaim space
        logger.info("Running VACUUM to optimize database size...")
        cursor.execute("VACUUM")
        conn.commit()
        
        # Close connection
        conn.close()
        logger.info("Database cleanup completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during database cleanup: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Remove fleets with points over a maximum value')
    parser.add_argument('--database', '-d', default='armada_fleets_merged.db', help='Database file path')
    parser.add_argument('--max-points', '-m', type=int, default=425, help='Maximum points threshold')
    parser.add_argument('--no-backup', action='store_true', help='Skip creating a backup')
    args = parser.parse_args()
    
    logger.info(f"Starting cleanup of {args.database} with max points {args.max_points}")
    
    success = cleanup_database(
        db_file=args.database,
        max_points=args.max_points,
        backup=not args.no_backup
    )
    
    if success:
        logger.info("Cleanup completed successfully")
    else:
        logger.error("Cleanup failed")

if __name__ == "__main__":
    main()