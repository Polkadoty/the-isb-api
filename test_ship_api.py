import requests
import json

BASE_URL = 'http://localhost:4000/api/ships'

# Test data
isd_ii_data = {
    "author": "Fantasy Flight Games",
    "alias": "FFG",
    "team": "FFG",
    "release": "Wave 2 Armada",
    "ships": {
        "imperial-star-destroyer": {
            "UID": "[generate]",
            "type": "chassis",
            "chassis_name": "imperial-star-destroyer",
            "size": "large",
            "hull": 11,
            "tokens": {
                "def_scatter": 0,
                "def_evade": 0,
                "def_brace": 1,
                "def_redirect": 2,
                "def_contain": 1,
                "def_salvo": 0
            },
            "speed": {
                "1": [1],
                "2": [1,1],
                "3": [0,1,1],
                "4": []
            },
            "shields": {
                "front": 4,
                "rear": 2,
                "left": 3,
                "right": 3,
                "left_aux": 0,
                "right_aux": 0
            },
            "hull_zones": {
                "frontoffset": 0,
                "centeroffset": 0,
                "rearoffset": 0,
                "frontangle": 90,
                "centerangle": 0,
                "rearangle": 90
            },
            "silhouette": "[link to image]",
            "blueprint": "[link to image]",
            "models": {
                "imperial-ii-star-destroyer": {
                    "UID": "[generate]",
                    "type": "ship",
                    "chassis": "imperial-star-destroyer",
                    "name": "Imperial II-class Star Destroyer",
                    "faction": "empire",
                    "unique": False,
                    "traits": ["star-destroyer"],
                    "points": 120,
                    "values": {
                        "command": 3,
                        "squadron": 4,
                        "engineer": 4
                    },
                    "upgrades": ["commander", "officer", "weapons-team", "offensive-retro", "defensive-retro", "ion-cannon", "turbolaser", "title"],
                    "armament": {
                        "asa": [0, 0, 0],
                        "front": [4, 4, 0],
                        "rear": [1, 2, 0],
                        "left": [2, 2, 0],
                        "right": [2, 2, 0],
                        "left_aux": [0, 0, 0],
                        "right_aux": [0, 0, 0],
                        "special": [0, 0, 0]
                    },
                    "artwork": "[link to image]",
                    "cardimage": "[link to image]"
                }
            }
        }
    }
}

def test_create_ship():
    response = requests.post(BASE_URL, json=isd_ii_data)
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