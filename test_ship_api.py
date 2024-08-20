import requests
import json

BASE_URL = 'http://localhost:4000/api/ships'

json_file = json.dump('converted-json\ships\empire\isd-ii.json')

def test_create_ship():
    response = requests.post(BASE_URL, json=json_file)
    assert response.status_code == 201, f"Failed to create ship: {response.text}"
    print("Create ship test passed")
    return response.json()['_id']

def test_get_all_ships():
    response = requests.get(BASE_URL)
    assert response.status_code == 200, f"Failed to get all ships: {response.text}"
    assert len(response.json()) > 0, "No ships returned"
    print("Get all ships test passed")

def test_get_ship_by_id(ship_id):
    response = requests.get(f"{BASE_URL}/{ship_id}")
    assert response.status_code == 200, f"Failed to get ship by ID: {response.text}"
    assert response.json()['_id'] == ship_id, "Returned ship ID doesn't match"
    print("Get ship by ID test passed")

def test_update_ship(ship_id):
    update_data = {"alias": "FFG Updated"}
    response = requests.put(f"{BASE_URL}/{ship_id}", json=update_data)
    assert response.status_code == 200, f"Failed to update ship: {response.text}"
    assert response.json()['alias'] == "FFG Updated", "Ship was not updated correctly"
    print("Update ship test passed")

def test_delete_ship(ship_id):
    response = requests.delete(f"{BASE_URL}/{ship_id}")
    assert response.status_code == 200, f"Failed to delete ship: {response.text}"
    print("Delete ship test passed")

def run_tests():
    try:
        # Create a ship and get its ID
        ship_id = test_create_ship()

        # Test other operations
        test_get_all_ships()
        test_get_ship_by_id(ship_id)
        test_update_ship(ship_id)

        # Clean up by deleting the ship
        test_delete_ship(ship_id)

        print("All tests passed successfully!")
    except AssertionError as e:
        print(f"Test failed: {str(e)}")
    except requests.exceptions.RequestException as e:
        print(f"HTTP Request failed: {str(e)}")

if __name__ == "__main__":
    run_tests()