import os
import sqlite3
import logging
import argparse
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("database_analysis.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DatabaseAnalysis")

def get_db_size(file_path):
    """Get the size of a database file in MB"""
    try:
        size_bytes = os.path.getsize(file_path)
        size_mb = size_bytes / (1024 * 1024)
        return size_mb
    except Exception as e:
        logger.error(f"Error getting size of {file_path}: {e}")
        return 0

def analyze_database(db_file):
    """Analyze a database file and return statistics"""
    if not os.path.exists(db_file):
        logger.warning(f"Database file {db_file} does not exist")
        return None
    
    try:
        size_mb = get_db_size(db_file)
        
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Check if the fleets table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='fleets'")
        if not cursor.fetchone():
            logger.warning(f"Database {db_file} does not contain a fleets table")
            conn.close()
            return {
                'file': db_file,
                'size_mb': size_mb,
                'record_count': 0,
                'valid': False,
                'error': 'No fleets table'
            }
        
        # Count records
        cursor.execute("SELECT COUNT(*) FROM fleets")
        record_count = cursor.fetchone()[0]
        
        # Get min/max fleet IDs if there are records
        min_id = max_id = None
        if record_count > 0:
            cursor.execute("SELECT MIN(numerical_id), MAX(numerical_id) FROM fleets")
            min_id, max_id = cursor.fetchone()
        
        # Get faction distribution
        factions = {}
        cursor.execute("SELECT faction, COUNT(*) FROM fleets GROUP BY faction")
        for faction, count in cursor.fetchall():
            faction_name = faction if faction else "Unknown"
            factions[faction_name] = count
        
        conn.close()
        
        return {
            'file': db_file,
            'size_mb': size_mb,
            'record_count': record_count,
            'min_id': min_id,
            'max_id': max_id,
            'factions': factions,
            'valid': True,
            'error': None
        }
        
    except Exception as e:
        logger.error(f"Error analyzing {db_file}: {e}")
        return {
            'file': db_file,
            'size_mb': size_mb,
            'record_count': 0,
            'valid': False,
            'error': str(e)
        }

def simple_merge_databases(source_files, destination_file, chunk_size=500):
    """Merge multiple database files assuming all rows are unique"""
    
    # Analyze source files first
    valid_sources = []
    total_records = 0
    
    for source_file in source_files:
        stats = analyze_database(source_file)
        if stats and stats['valid'] and stats['record_count'] > 0:
            valid_sources.append(source_file)
            total_records += stats['record_count']
            logger.info(f"Adding {source_file} with {stats['record_count']} records to merge list")
        else:
            logger.warning(f"Skipping {source_file} - invalid or empty database")
    
    if not valid_sources:
        logger.error("No valid source databases found for merging")
        return False
    
    logger.info(f"Merging {len(valid_sources)} valid databases with approximately {total_records} total records")
    
    # Create destination database
    try:
        # Check if destination exists and backup if it does
        if os.path.exists(destination_file):
            backup_file = f"{destination_file}.bak"
            logger.info(f"Backing up existing destination file to {backup_file}")
            os.rename(destination_file, backup_file)
        
        # Create new destination database
        dest_conn = sqlite3.connect(destination_file)
        dest_cursor = dest_conn.cursor()
        
        # Create table structure (using first valid source as template)
        source_conn = sqlite3.connect(valid_sources[0])
        source_cursor = source_conn.cursor()
        
        # Get table creation SQL
        source_cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='fleets'")
        create_table_sql = source_cursor.fetchone()[0]
        
        # Create table in destination
        dest_cursor.execute(create_table_sql)
        
        # Get column names
        source_cursor.execute("PRAGMA table_info(fleets)")
        columns_info = source_cursor.fetchall()
        columns = [column[1] for column in columns_info]
        
        # Identify columns we should exclude from the INSERT (id and possibly user_id)
        exclude_columns = []
        for i, column_info in enumerate(columns_info):
            column_name = column_info[1]
            if column_name == 'id' or column_name == 'user_id':
                exclude_columns.append(i)
        
        # Create filtered column lists without id fields
        filtered_columns = [col for i, col in enumerate(columns) if i not in exclude_columns]
        filtered_columns_str = ", ".join(filtered_columns)
        
        # Close the source connection we used as template
        source_conn.close()
        
        # Now process each source database
        records_merged = 0
        start_time = time.time()
        
        for source_idx, source_file in enumerate(valid_sources, 1):
            try:
                logger.info(f"Processing source {source_idx}/{len(valid_sources)}: {source_file}")
                source_conn = sqlite3.connect(source_file)
                source_cursor = source_conn.cursor()
                
                # Get record count for progress tracking
                source_cursor.execute("SELECT COUNT(*) FROM fleets")
                source_count = source_cursor.fetchone()[0]
                
                if source_count == 0:
                    logger.warning(f"Source {source_file} contains 0 records, skipping")
                    source_conn.close()
                    continue
                
                # Process in chunks
                for offset in range(0, source_count, chunk_size):
                    # Fetch a chunk of records
                    source_cursor.execute(f"SELECT {filtered_columns_str} FROM fleets LIMIT {chunk_size} OFFSET {offset}")
                    records = source_cursor.fetchall()
                    
                    if not records:
                        break
                    
                    # Prepare for bulk insert
                    placeholders = ", ".join(["?" for _ in filtered_columns])
                    
                    # Insert into destination, assuming all records are unique
                    for record in records:
                        try:
                            dest_cursor.execute(f"INSERT INTO fleets ({filtered_columns_str}) VALUES ({placeholders})", record)
                            records_merged += 1
                        except sqlite3.Error as e:
                            logger.warning(f"Error inserting record: {e}")
                    
                    # Commit each chunk
                    dest_conn.commit()
                    
                    # Progress update
                    elapsed = time.time() - start_time
                    rate = records_merged / elapsed if elapsed > 0 else 0
                    logger.info(f"Merged {records_merged}/{total_records} records ({records_merged/total_records*100:.1f}%) - Rate: {rate:.1f} records/sec")
                
                # Close source connection
                source_conn.close()
                
            except Exception as e:
                logger.error(f"Error processing source {source_file}: {e}")
                # Continue with next source
        
        # Create indices for better performance
        logger.info("Creating indices on merged database...")
        dest_cursor.execute("CREATE INDEX IF NOT EXISTS idx_numerical_id ON fleets(numerical_id)")
        dest_cursor.execute("CREATE INDEX IF NOT EXISTS idx_faction ON fleets(faction)")
        dest_cursor.execute("CREATE INDEX IF NOT EXISTS idx_points ON fleets(points)")
        
        # Optimize database
        logger.info("Running VACUUM to optimize database size...")
        dest_cursor.execute("VACUUM")
        
        # Close destination connection
        dest_conn.commit()
        dest_conn.close()
        
        # Final stats
        merged_db_stats = analyze_database(destination_file)
        logger.info(f"Merge complete: {destination_file} now contains {merged_db_stats['record_count']} records")
        logger.info(f"Final database size: {merged_db_stats['size_mb']:.2f} MB")
        
        return True
        
    except Exception as e:
        logger.error(f"Error during merge: {e}")
        return False

def cleanup_database(db_file, max_points=425):
    """Remove all fleets with points over the specified maximum"""
    if not os.path.exists(db_file):
        logger.error(f"Database file {db_file} not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Count records to be deleted
        cursor.execute(f"SELECT COUNT(*) FROM fleets WHERE points > {max_points}")
        records_to_delete = cursor.fetchone()[0]
        logger.info(f"Records to be deleted (points > {max_points}): {records_to_delete}")
        
        if records_to_delete == 0:
            logger.info("No records to delete. Database is already clean.")
            conn.close()
            return True
        
        # Perform the deletion
        logger.info(f"Deleting fleets with points > {max_points}...")
        cursor.execute(f"DELETE FROM fleets WHERE points > {max_points}")
        conn.commit()
        
        # Count remaining records
        cursor.execute("SELECT COUNT(*) FROM fleets")
        remaining_records = cursor.fetchone()[0]
        logger.info(f"Deletion complete. Records remaining: {remaining_records}")
        
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
    parser = argparse.ArgumentParser(description='Analyze and fix Armada fleet databases')
    parser.add_argument('--analyze', action='store_true', help='Analyze database files only (no merge)')
    parser.add_argument('--merge', action='store_true', help='Perform simple merge of databases')
    parser.add_argument('--db-dir', default='databases', help='Directory containing database files')
    parser.add_argument('--output', default='armada_fleets_merged_new.db', help='Output merged database file')
    parser.add_argument('--cleanup', action='store_true', help='Clean up merged database (remove fleets with points > 425)')
    parser.add_argument('--max-points', type=int, default=425, help='Maximum points threshold for cleanup')
    args = parser.parse_args()
    
    # Find all database files
    db_dir = Path(args.db_dir)
    db_files = list(db_dir.glob("armada_fleets_*.db"))
    
    if not db_files:
        logger.error(f"No database files found in {db_dir}")
        return
    
    logger.info(f"Found {len(db_files)} database files")
    
    # Analyze databases
    analysis_results = []
    total_records = 0
    
    for db_file in sorted(db_files):
        logger.info(f"Analyzing {db_file}...")
        stats = analyze_database(str(db_file))
        if stats:
            analysis_results.append(stats)
            if stats['valid']:
                total_records += stats['record_count']
    
    # Report analysis results
    logger.info("\n--- Database Analysis Results ---")
    logger.info(f"Total databases: {len(analysis_results)}")
    logger.info(f"Total records across all databases: {total_records}")
    
    for result in sorted(analysis_results, key=lambda x: x['file']):
        if result['valid']:
            logger.info(f"- {result['file']}: {result['size_mb']:.2f} MB, {result['record_count']} records, ID range: {result['min_id']} to {result['max_id']}")
            if result['factions']:
                faction_str = ", ".join([f"{k}: {v}" for k, v in result['factions'].items()])
                logger.info(f"  Factions: {faction_str}")
        else:
            logger.info(f"- {result['file']}: {result['size_mb']:.2f} MB, INVALID - {result['error']}")
    
    # Perform merge if requested
    if args.merge:
        valid_dbs = [result['file'] for result in analysis_results if result['valid'] and result['record_count'] > 0]
        if valid_dbs:
            logger.info(f"Performing simple merge of {len(valid_dbs)} valid databases...")
            merge_success = simple_merge_databases(valid_dbs, args.output)
            if merge_success:
                logger.info(f"Merge completed successfully to {args.output}")
                
                # Clean up merged database if requested
                if args.cleanup:
                    logger.info("Cleaning up merged database...")
                    cleanup_database(args.output, args.max_points)
            else:
                logger.error("Merge operation failed")
        else:
            logger.error("No valid databases to merge")
    
if __name__ == "__main__":
    main()