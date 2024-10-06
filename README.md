# The ISB API

The ISB API is a RESTful API for managing ship, squadron, upgrade card, and objective data for Star Wars Armada. Built with Node.js and Express, this API serves static JSON files.

## Guides

- [Ship Guide](Ship-Guide.md)
- [Squadron Guide](Squadron-Guide.md)
- [Upgrade Guide](Upgrade-Guide.md)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Data Structure](#data-structure)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Contributing](#contributing)

...

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/the-isb-api.git
   cd the-isb-api
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the server:
   ```sh
   npm start
   ```

For development, you can use:
```sh
npm run dev
```

## Usage

The API is designed to be used as a backend service for Star Wars Armada applications. It provides data for ships, squadrons, upgrades, and objectives.

## API Endpoints

### Base URL
- Production: `https://api.swarmada.wiki`

### Status
- **GET /**: Check the status of the API.

### Ships
- **GET /api/ships**: Retrieve all ships.
- **GET /api/ships/{shipId}**: Retrieve a specific ship by ID.
- **GET /api/ships/search**: Search ships with various filters.

### Squadrons
- **GET /api/squadrons**: Retrieve all squadrons.
- **GET /api/squadrons/{squadronId}**: Retrieve a specific squadron by ID.
- **GET /api/squadrons/search**: Search squadrons with various filters.

### Upgrades
- **GET /api/upgrades**: Retrieve all upgrades.
- **GET /api/upgrades/{upgradeId}**: Retrieve a specific upgrade by ID.
- **GET /api/upgrades/search**: Search upgrades with various filters.

### Objectives
- **GET /api/objectives**: Retrieve all objectives.
- **GET /api/objectives/{objectiveId}**: Retrieve a specific objective by ID.
- **GET /api/objectives/search**: Search objectives with various filters.

For detailed information on search parameters and response formats, please refer to the API documentation.

## Data Structure

The API uses JSON files to store and serve data. The main data structures are:

- Ships
- Squadrons
- Upgrades
- Objectives

Each entity has its own JSON schema. For detailed schema information, refer to the following files:


```1:78:templates/ship.json
{
    "ships": {
        "ship_name": {
            "UID": "[generate]",
            "type": "chassis",
            "chassis_name": "string",
            "size": "string",
            "hull": number,
            "speed": {
                "1": [number],
                "2": [number, number],
                "3": [number, number, number],
                "4": [number, number, number, number]
            },
            "shields": {
                "front": number,
                "rear": number,
                "left": number,
                "right": number,
                "left_aux": number,
                "right_aux": number
            },
            "hull_zones": {
                "frontoffset": number,
                "centeroffset": number,
                "rearoffset": number,
                "frontangle": number,
                "centerangle": number,
                "rearangle": number
            },
            "silhouette": "[link to image]",
            "blueprint": "[link to image]",
            "models": {
                "model_name": {
                    "author": "UID",
                    "alias": "string",
                    "team": "string",
                    "release": "string",
                    "expansion": "string",
                    "UID": "[generate]",
                    "type": "ship",
                    "chassis": "string",
                    "name": "string",
                    "faction": "string",
                    "unique": boolean,
                    "traits": ["string"],
                    "points": number,
                    "tokens": {
                        "def_scatter": number,
                        "def_evade": number,
                        "def_brace": number,
                        "def_redirect": number,
                        "def_contain": number,
                        "def_salvo": number
                    },
                    "values": {
                        "command": number,
                        "squadron": number,
                        "engineer": number
                    },
                    "upgrades": ["commander", "officer", "weapons-team", "support-team", "fleet-command", "fleet-support", "offensive-retro", "weapons-team-offensive-retro", "defensive-retro", "experimental-retro", "turbolaser", "ion-cannon", "ordnance", "super-weapon", "title"],
                    "armament": {
                        "asa": [red, blue, black],
                        "front": [red, blue, black],
                        "rear": [red, blue, black],
                        "left": [red, blue, black],
                        "right": [red, blue, black],
                        "left_aux": [red, blue, black],
                        "right_aux": [red, blue, black],
                        "special": [red, blue, black]
                    },
                    "artwork": "",
                    "cardimage": ""
                }
            }
        }
    }
}
```



```1:57:templates/squadron.json
{
    "squadrons": {
        "squadron_name": {
            "author": "string",
            "alias": "string",
            "team": "string",
            "release": "string",
            "expansion": "string",
            "_id": null,
            "type": "squadron",
            "faction": "faction_name",
            "squadron_type": "squadron_uid",
            "name": "squadron_name",
            "ace-name": "string",
            "unique-class": ["string"],
            "irregular": boolean,
            "hull": number,
            "speed": number,
            "tokens": {
                "def_scatter": number,
                "def_evade": number,
                "def_brace": number
            },
            "armament": {
                "anti-squadron": [red, blue, black],
                "anti-ship": [red, blue, black]
            },
            "abilities": {
                "adept": number,
                "ai-battery": number,
                "ai-antisquadron": number,
                "assault": boolean,
                "bomber": boolean,
                "cloak": boolean,
                "counter": number,
                "dodge": number,
                "escort": boolean,
                "grit": boolean,
                "heavy": boolean,
                "intel": boolean,
                "relay": number,
                "rogue": boolean,
                "scout": boolean,
                "screen": boolean,
                "snipe": number,
                "strategic": boolean,
                "swarm": boolean
            },
            "ability": "string",
            "unique": boolean,
            "points": number,
            "silhouette": "",
            "artwork": "",
            "cardimage": ""
        }
    }
}
```



```1:40:templates/upgrade.json
{
    "upgrades": {
        "upgrade_name": {
            "author": "UID",
            "alias": "string",
            "team": "string",
            "release": "string",
            "expansion": "string",
            "UID": "[generate]",
            "type": "upgrade_category/commander/title/etc",
            "faction": ["rebel","empire","republic","separatist"],
            "name": "upgrade_name",
            "unique-class": ["string"],
            "ability": "string",
            "unique": boolean,
            "points": number,
            "modification": boolean,
            "bound_shiptype": "ship_type or blank",
            "restrictions": {
                "traits": ["trait"],
                "size": ["small","medium", "large"],
                "disqual_upgrades": ["","upgrade_type"],
                "disable_upgrades": ["","upgrade_type"],
                "flagship": boolean
            },
            "start_command": {
                "type": "blank, token, or dial",
                "start_icon": ["any", "squadron", "repair", "navigate", "confire"],
                "start_amount": number
            },
            "exhaust": {
                "type": "blank, recur, nonrecur",
                "ready_token": ["any", "squadron", "repair", "navigate", "confire"],
                "ready_amount": number
            },
            "artwork": "",
            "cardimage": ""
        }
    }
}
```



```1:31:templates/objective.json
{
    "objectives": {
        "objective_name": {
            "author": "UID",
            "alias": "string",
            "team": "string",
            "release": "string",
            "expansion": "string",
            "_id": "[generate]",
            "type": "assault/defense/navigation/special",
            "name": "objective_name",
            "obstacles": ["string", "string", "etc."],
            "setup": "string",
            "special_rule": "string",
            "end_of_round": "string",
            "end_of_game": "string",
            "victory_tokens": boolean,
            "victory_tokens_points": number,
            "objective_tokens": boolean,
            "objective_tokens_type": "string",
            "objective_tokens_count": [number],
            "command_tokens": boolean,
            "command_tokens_type": "string",
            "command_tokens_value": "per ship, per player, per command, etc.",
            "command_tokens_count": number,
            "errata": "string",
            "artwork": "[link to image]",
            "cardimage": "[link to card image]"
        }
    }
}
```


## Error Handling

The API uses standard HTTP status codes. In case of an error, the response will include an error message in the following format:

```json
{
  "error": {
    "code": 404,
    "message": "Resource not found",
    "path": "/api/ships/nonexistent",
    "method": "GET",
    "timestamp": "2023-06-01T12:34:56.789Z",
    "requestId": "unique-request-id"
  }
}
```

## Rate Limiting

The API has a rate limit of 100 requests per minute per IP address.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Detailed Steps for Adding New Content (With VSCode Example Commands)

1. **Fork the repository** to your GitHub account:
   - On GitHub, click the `Fork` button in the top-right corner of the repository page.

2. **Clone your forked repository** to your local machine using the following command in your terminal:
   ```bash
   git clone https://github.com/your-username/repository-name.git
   ```
   - In VSCode, you can open the terminal with ``Ctrl+` `` or by navigating to `Terminal > New Terminal` from the menu.

3. **Create a new branch** with a descriptive name, e.g., `your-name-base-wavenumber`, by using the following command:
   ```bash
   git checkout -b your-name-base-wavenumber
   ```
   - In VSCode, use the `Source Control` tab (icon on the left panel) to view and manage branches.
   - Alternatively, use the command palette (`Ctrl+Shift+P`) and type "Git: Create Branch" to initiate this process from the UI.

4. **Navigate to the appropriate folder** for your changes:
   - In the VSCode file explorer, click on the directory structure to navigate to the relevant path:
     - For squadrons: `public/converted-json/squadrons/`
     - For ships: `public/converted-json/ships/`
     - For upgrades: `public/converted-json/upgrades/`

5. **Create a new JSON file** for the item you're adding:
   - Right-click the folder in VSCode and select `New File`, name it (e.g., `gauntlet.json` for a Gauntlet fighter).

6. **Copy the appropriate template** from the `templates` folder:
   - Open the `templates` folder, locate the correct template (e.g., `squadron-template.json`), right-click, and select `Copy`.
   - Paste it into your newly created JSON file.

7. **Fill in the details** according to the relevant guide:
   - Follow the [Ship Guide](Ship-Guide.md), [Squadron Guide](Squadron-Guide.md), or [Upgrade Guide](Upgrade-Guide.md) to enter the correct values.
   - You can use VSCode's built-in JSON formatting (`Alt+Shift+F`) to ensure proper structure and readability.

8. **Commit your changes** with a descriptive commit message:
   - In the terminal, use the following commands:
     ```bash
     git add .
     git commit -m "Added Gauntlet fighter JSON file"
     ```
   - Alternatively, in the `Source Control` tab, stage changes with the `+` button next to the files and commit directly from the UI by typing a message and pressing `Ctrl+Enter`.

9. **Push your changes** to your forked repository:
   - In the terminal, run:
     ```bash
     git push origin your-name-base-wavenumber
     ```
   - Or use the `Source Control` tab, where VSCode will prompt you to push the branch after committing changes.

10. **Create a pull request** to merge your changes:
    - Go to your GitHub forked repository, and GitHub will display an option to create a `New Pull Request`. Follow the prompts to select the branch and target repository.

### VSCode Command Palette Shortcuts

- **Git Checkout Branch**: `Ctrl+Shift+P` → "Git: Checkout to..."
- **Create a New File**: Right-click folder → "New File"
- **Format JSON**: Select file → `Alt+Shift+F`
- **View Git Changes**: `Ctrl+Shift+G` (Opens Source Control tab)

### Additional Note

You don't need to manually combine the new JSON file with the main `squadrons.json`, `ships.json`, or `upgrades.json` files. The repository uses a script, `jsoncombiner.js`, to automatically combine individual files after review and merging.