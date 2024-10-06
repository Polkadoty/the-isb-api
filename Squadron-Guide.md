# Guide: Converting Squadron Cards to JSON

This guide explains how to convert Star Wars Armada squadron cards into JSON format for use in our API and card reconstruction system.

## 1. Basic Structure

Start with the basic structure of a squadron JSON object:

```json
{
    "squadrons": {
        "squadron-name-in-kebab-case": {
            // Squadron details go here
        }
    }
}
```

For example, I have `x-wing-squadron` and `tie-fighter` listed as the kebab case for other squadrons.

## 2. Squadron Information

Fill in the squadron information:

```json
    "author": "Publisher Name",
    "alias": "Publisher Abbreviation",
    "team": "Publisher Abbreviation",
    "release": "Release Wave",
    "expansion": "Expansion Name",
    "_id": null,
    "type": "squadron",
    "faction": "faction_name",
    "squadron_type": "squadron_uid",
    "name": "Squadron Name",
    "ace-name": "Ace Name (if applicable)",
    "unique-class": ["string"],
    "irregular": boolean,
    "hull": number,
    "speed": number,
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
- `type`: Always "squadron" for squadrons.
- `faction`: The squadron's faction (e.g., "rebel", "empire", "republic", "separatist").
- `squadron_type`: The base squadron type (e.g., "x-wing", "tie-fighter").
- `name`: The full name of the squadron.
- `ace-name`: The name of the ace pilot, if applicable. Leave as an empty string if not.
- `unique-class`: An array of unique classes, if any. Leave as an empty array if not applicable. This would be like "Han Solo", "Millennium Falcon". If the ship name is the same as the default version of a ship, do not put the ship name in here. An exception would be like "Havoc", "Sato's Hammer", etc.
- `irregular`: Set to true if the squadron is irregular, false otherwise.
- `hull`: The hull value from the card.
- `speed`: The speed value from the card.

## 3. Defense Tokens

Add the defense token information:

```json
"tokens": {
    "def_scatter": number,
    "def_evade": number,
    "def_brace": number
},
```

Set the value to the number of each token type the squadron has. Use 0 for tokens it doesn't have.

## 4. Armament

Add the armament information:

```json
"armament": {
    "anti-squadron": [red, blue, black],
    "anti-ship": [red, blue, black]
},
```

Fill in the number of dice for each color (blue, black, red) for both anti-squadron and anti-ship attacks. Use 0 for colors that don't apply.

## 5. Abilities

Add the squadron's abilities:

```json
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
```

Set the value to the appropriate number or boolean for each ability the squadron has. Use 0 or false for abilities it doesn't have.

## 6. Special Ability

If the squadron has a special ability text, add it:

```json
"ability": "Special ability text goes here",
```

If there's no special ability, use an empty string.

## 7. Unique and Points

Add whether the squadron is unique (little circle next to the name) and its point cost:

```json
"unique": boolean,
"points": number,
```

## 8. Images

Add placeholders for silhouette and artwork:

```json
"silhouette": "",
"artwork": "",
```

For the cardimages, follow the same process as described in the Ship Guide, using the link: https://lensdump.com/a/ezudC.

- Search for the squadron card you want, and left click on the open square in the top right of the card. This square is highlighted in the image below:

![Select upper right](templates\select_upper_right.png)

- The card should be selected. Then press K, this should open up an "embed codes" window. Click the drop down from viewer link, and change it to medium link.

![Select medium link](templates\select_medium_link.png)

- Then copy the code and paste it inside quotes like so:

```json
"cardimage": "https://c.l3n.co/i/zGn09i.md.png",
```

If the embed code window is not popping up, just use the image links in lensdump by left clicking the image, then right clicking copy and placing that into the list. A moderator will adjust it later.


## Example

For reference, you can look at the x-wing-squadron json:

```typescript:public\converted-json\squadrons\x-wing-squadron.json
startLine: 1
endLine: 57
```

This template shows the structure that should be followed when converting squadron cards to JSON format.
