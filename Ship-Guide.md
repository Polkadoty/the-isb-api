# Guide: Converting Ship Cards to JSON

This guide explains how to convert Star Wars Armada ship cards into JSON format for use in our API and card reconstruction system.

## 1. Basic Structure

Start with the basic structure of a ship JSON object:

```json
{
    "ships": {
        "ship-name-in-kebab-case": {
            // Ship details go here
        }
    }
}
```

## 2. Chassis Information

Fill in the chassis information:

```json
"_id": null,
"type": "chassis",
"chassis_name": "ship-name-in-kebab-case",
"size": "small|medium|large|huge",
"hull": number,
```

- `_id`: Leave as null, it will be generated later.
- `type`: Always "chassis" for ships.
- `chassis_name`: The ship's name in kebab-case (lowercase with hyphens).
- `size`: "small", "medium", or "large".
- `hull`: The hull value from the card.

## 3. Speed

Convert the speed chart to JSON:

```json
"speed": {
    "1": [number],
    "2": [number, number],
    "3": [number, number, number],
    "4": [number, number, number, number]
},
```

Fill in the numbers for each speed, using the values from the card's speed chart. Aka - is 0, I is 1, II is 2.

## 4. Shields

Add the shield values:

```json
"shields": {
    "front": number,
    "rear": number,
    "left": number,
    "right": number,
    "left_aux": number,
    "right_aux": number
},
```

Fill in the shield values for each section. Use 0 for sections that don't exist (like aux arcs on smaller ships).

## 5. Hull Zones

Add the hull zone information:

```json
"hull_zones": {
    "frontoffset": number,
    "centeroffset": number,
    "rearoffset": number,
    "frontangle": number,
    "centerangle": number,
    "rearangle": number
},
```

These are only for future reference. Do not worry about these for the moment.

## 6. Images

Add placeholders for silhouette and blueprint images:

```json
"silhouette": "[link to image]",
"blueprint": "[link to image]",
```

## 7. Ship Models

Create entries for each variant of the ship:

```json
"models": {
    "ship-variant-name": {
        // Ship variant details go here
    }
}
```

## 8. Ship Variant Details

For each ship variant, include the following information:

```json
    "author": "Publisher Name",
    "alias": "Publisher Abbreviation",
    "team": "Publisher Abbreviation",
    "release": "Release Wave",
    "expansion": "Expansion Name",
    "_id": null,
    "type": "ship",
    "chassis": "chassis-name",
    "name": "Full Ship Name",
    "faction": "faction-name",
    "unique": boolean,
    "traits": ["trait1", "trait2"],
    "points": number,
```

For example, for FFG I put:

```json
    "author": "Fantasy Flight Games",
    "alias": "FFG",
    "team": "FFG",
    "release": "Wave 0 Armada",
    "expansion": "Armada Core Set (SWM01)",
```

For AMG:

```json
    "author": "Atomic Mass Games",
    "alias": "AMG",
    "team": "AMG",
    "release": "Rapid Reinforcements I",
    "expansion": "Rapid Reinforcements I",
```

When putting the expansion name, use the release names mentioned in the Star Wars Armada wiki located here:
- https://starwars-armada.fandom.com/wiki/Star_Wars:_Armada_Wiki

I just removed the "Print-and-play" from the names of Rapid Reinforcements I and II.

For the rest, see the following example for a victory star destroyer 1, for the empire:

```json
"models": {
    "victory-i-class-star-destroyer": {
        "author": "Fantasy Flight Games",
        "alias": "FFG",
        "team": "FFG",
        "release": "Wave 0 Armada",
        "expansion": "Armada Core Set (SWM01)",
        "_id": null,
        "type": "ship",
        "chassis": "victory-star-destroyer",
        "name": "Victory I-Class Star Destroyer",
        "faction": "empire",
        "unique": false,
        "traits": ["star-destroyer"],
        "points": 73,
```

## 9. Defense Tokens

Add the defense token information:

```json
"tokens": {
    "def_scatter": number,
    "def_evade": number,
    "def_brace": number,
    "def_redirect": number,
    "def_contain": number,
    "def_salvo": number
},
```

Set the value to the number of each token type the ship has.

## 10. Command Values

Add the command values:

```json
"values": {
    "command": number,
    "squadron": number,
    "engineer": number
},
```

## 11. Upgrade Slots

List the upgrade slots:

```json
"upgrades": ["slot1", "slot2", "slot3", ...],
```

For this section, just copy the upgrades in the json template here and delete the ones the ship doesn't have. Make sure these are named exactly:

```json
    "upgrades": ["commander", "officer", "weapons-team", "support-team", "fleet-command", "fleet-support", "offensive-retro", "weapons-team-offensive-retro", "defensive-retro", "experimental-retro", "turbolaser", "ion-cannon", "ordnance", "super-weapon", "title"],
```

## 12. Armament

Add the armament information:

```json
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
```

Fill in the number of dice for each color (red, blue, black) in each firing arc. Use 0 for colors or arcs that don't apply.

## 13. Card Images

Add placeholders for artwork and card images:

```json
"artwork": "[link to image]",
"cardimage": "[link to card image]"
```

For the cardimages in particular, head to the following link: https://lensdump.com/a/e3fYm
- Search for the ship card you want, and left click on the open square in the top right of the card. The card should be selected. Then press K, this should open up an "embed codes" window. Click the drop down from viewer link, and change it to medium link. Then copy the code and paste it inside quotes like so:

```json
"cardimage": "https://c.l3n.co/i/zGn09i.md.png",
```


## Example

For reference, you can look at the Victory Star Destroyer JSON:

```typescript:public/converted-json/ships/victory-star-destroyer.json
startLine: 1
endLine: 160
```

This example shows how the Victory Star Destroyer card has been converted to JSON format following these guidelines.

