I am converting squadron cards from the game Star Wars Armada into json format so I can use a script to reconstruct the cards based on JSON. The goal is to eventually create a custom card maker that will define all of the changes as changes to a JSON file, then render the card based on the JSON.

Here is the schema for the squadron JSON. I will add comments below.

{
    "author": "UID",
    "alias": "string",
    "team": "string",
    "release": "string",
    "squadrons": {
        "squadron_name": {
            "UID": "[generate]",
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
                "anti-squadron": [number, number, number],
                "anti-ship": [number, number, number],
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
            "silhouette": "[link to image]",
            "artwork": "[link to image]",
            "cardimage": "[link to card image]"
        }
    }
}

The UIDs will be generated for each individual user in the future. For the moment, for official release cards (which all of these are), use the following format for the beginning of the json. 
Change the release based on the actual wave the cards were released in where possible.

Next, the armament is an array like this: [red, blue, black]. Put the number of dice in each pool inside each array. For example, for howlrunner, her full json looks like this.

{
    "author": "Fantasy Flight Games",
    "alias": "FFG",
    "team": "FFG",
    "release": "Wave 0 Armada",
    "squadrons": {
        "howlrunner": {
            "UID": "[generate]",
            "type": "squadron",
            "faction": "Empire",
            "squadron_type": "tie_fighter",
            "name": "TIE Fighter Squadron",
            "ace-name": "Howlrunner",
            "unique-class": ["Howlrunner"],
            "irregular": false,
            "hull": 3,
            "speed": 4,
            "tokens": {
                "def_scatter": 1,
                "def_evade": 0,
                "def_brace": 1
            },
            "armament": {
                "anti-squadron": [0, 3, 0],
                "anti-ship": [0, 1, 0]
            },
            "abilities": {
                "adept": 0,
                "ai-battery": 0,
                "ai-antisquadron": 0,
                "assault": false,
                "bomber": false,
                "cloak": false,
                "counter": 0,
                "dodge": 0,
                "escort": false,
                "grit": false,
                "heavy": false,
                "intel": false,
                "relay": 0,
                "rogue": false,
                "scout": false,
                "screen": false,
                "snipe": 0,
                "strategic": false,
                "swarm": true
            },
            "ability": "While another friendly squadron with SWARM at distance 1 is attacking a squadron, it may add 1 blue die to its attack pool.",
            "unique": true,
            "points": 16,
            "silhouette": "[link to image]",
            "artwork": "/mnt/data/howlrunner.png",
            "cardimage": "/mnt/data/howlrunner.png"
        }
    }
}

Please convert all of the following cards to JSON format. You do not need to do Howlrunner again.
