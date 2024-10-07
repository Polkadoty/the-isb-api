# Guide: Converting Upgrade Cards to JSON

This guide explains how to convert Star Wars Armada upgrade cards into JSON format for use in our API and card reconstruction system.

## 1. Basic Structure

Start with the basic structure of an upgrade JSON object:

```json
{
    "upgrades": {
        "upgrade-name-in-kebab-case": {
            // Upgrade details go here
        }
    }
}
```

## 2. Upgrade Information

Fill in the upgrade information:

```json
    "author": "Publisher Name",
    "alias": "Publisher Abbreviation",
    "team": "Publisher Abbreviation",
    "release": "Release Wave",
    "expansion": "Expansion Name",
    "_id": null,
    "type": "upgrade_category",
    "faction": ["faction1", "faction2"],
    "name": "Upgrade Name",
    "unique-class": ["string"],
    "ability": "Upgrade ability text",
    "unique": boolean,
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

- `_id`: Leave as null, it will be generated later.
- `type`: The upgrade category (e.g., "commander", "officer", "turbolaser", etc.).
- `faction`: An array of factions that can use this upgrade. Use an empty array `[]` if it's neutral.
- `name`: The full name of the upgrade.
- `unique-class`: An array of unique classes, if any. Use an empty array `[]` if not applicable.
- `ability`: The full text of the upgrade's ability.
- `unique`: Set to true if the upgrade is unique (has a • before the name), false otherwise.
- `points`: The point cost of the upgrade.

The upgrade categories are:
```json
    "upgrades": ["commander", "officer", "weapons-team", "support-team", "fleet-command", "fleet-support", "offensive-retro", "weapons-team-offensive-retro", "defensive-retro", "experimental-retro", "turbolaser", "ion-cannon", "ordnance", "super-weapon", "title"],
```

## 3. Modification and Bound Ship Type

Add modification and bound ship type information:

```json
"modification": boolean,
"bound_shiptype": "ship_type or blank",
```

- `modification`: Set to true if the upgrade is a modification, false otherwise.
- `bound_shiptype`: If the upgrade is bound to a specific ship type (like a title for a ship), enter it here. Otherwise, leave it as an empty string.

## 4. Restrictions

Add any restrictions for the upgrade:

```json
"restrictions": {
    "traits": ["trait1", "trait2"],
    "size": ["small", "medium", "large"],
    "disqual_upgrades": ["upgrade_type1", "upgrade_type2"],
    "disable_upgrades": ["upgrade_type1", "upgrade_type2"],
    "flagship": boolean
},
```

Fill in the arrays with appropriate values, or leave them empty if there are no restrictions. Set `flagship` to true if the upgrade can only be used on a flagship. Commanders would set `flagship` to true.

## 5. Start Command

If the upgrade provides a starting command, add this information:

```json
"start_command": {
    "type": "blank, token, or dial",
    "start_icon": ["any", "squadron", "repair", "navigate", "confire"],
    "start_amount": number
},
```

If the upgrade doesn't provide a starting command, use empty strings for `type` and `start_icon`, and 0 for `start_amount`.

## 6. Exhaust

If the upgrade has an exhaust ability, add this information:

```json
"exhaust": {
    "type": "blank, recur, nonrecur",
    "ready_token": ["any", "squadron", "repair", "navigate", "confire"],
    "ready_amount": number
},
```

If the upgrade doesn't have an exhaust ability, use empty strings for `type` and `ready_token`, and 0 for `ready_amount`.

## 7. Images

Add placeholders for artwork and card images:

```json
"artwork": "",
"cardimage": ""
```

## Example

For reference, you can look at the upgrades JSON template:

```typescript:templates/upgrade.json
startLine: 1
endLine: 40
```

This template shows the structure that should be followed when converting upgrade cards to JSON format.

You can also refer to existing upgrade entries for examples:

```typescript:public/converted-json/upgrades/upgrades.json
startLine: 1
endLine: 84
```

