import requests
import json
import os

# API base URL
API_BASE_URL = 'http://localhost:4000/api'

def delete_all_items(item_type):
    """Delete all existing items of a specific type using the API."""
    try:
        # Get all items
        response = requests.get(f"{API_BASE_URL}/{item_type}")
        if response.status_code == 200:
            items = response.json()
            print(f"Found {len(items)} {item_type}.")
            
            # Delete each item
            for item in items:
                item_id = item['_id']
                delete_response = requests.delete(f"{API_BASE_URL}/{item_type}/{item_id}")
                if delete_response.status_code == 200:
                    print(f"Deleted {item_type} with ID: {item_id}")
                else:
                    print(f"Failed to delete {item_type} with ID: {item_id}. Status code: {delete_response.status_code}")
        else:
            print(f"Failed to get {item_type}. Status code: {response.status_code}")
    except Exception as e:
        print(f"An error occurred while deleting {item_type}: {str(e)}")

def upload_json_files(root_dir):
    """Crawl through directories and upload JSON files."""
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.json') and filename not in ['ship.json', 'squadron.json', 'upgrade.json']:
                file_path = os.path.join(dirpath, filename)
                
                if 'ships' in dirpath:
                    upload_item(file_path, 'ships')
                elif 'squadrons' in dirpath:
                    upload_item(file_path, 'squadrons')
                elif 'upgrades' in dirpath:
                    upload_item(file_path, 'upgrades')

def upload_item(file_path, item_type):
    """Upload a single JSON file using the API."""
    with open(file_path, 'r') as file:
        item_data = json.load(file)
    
    response = requests.post(f"{API_BASE_URL}/{item_type}", json=item_data)
    if response.status_code == 201:
        print(f"Uploaded {item_type} from {file_path}")
    else:
        print(f"Failed to upload {item_type} from {file_path}. Status code: {response.status_code}")
        print(f"Response content: {response.text}")

if __name__ == "__main__":
    # Delete all existing items
    for item_type in ['ships', 'squadrons', 'upgrades']:
        delete_all_items(item_type)
    
    # Upload new data
    root_directory = "converted-json"  # Replace with the actual path to your converted-json folder
    upload_json_files(root_directory)
    
    print("Database update completed.")