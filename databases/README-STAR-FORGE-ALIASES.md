# Star Forge Alias Updates

## Overview

The fleet processing scripts have been enhanced to use Star Forge aliases from `aliases.json`. This ensures that ship names, upgrades, and squadrons are displayed with their current point values and proper names.

## Key Features

### 1. Star Forge Alias Preference
- Prioritizes aliases with non-zero point values
- Sorts by points descending to prefer current/higher point values
- Falls back to original names if no alias is found

### 2. Exclamation Point Handling
Items with exclamation points (!) indicate updated point values. The scripts now:
- Remove the exclamation point for processing
- Use broader matching to find aliases when exact matches fail
- Try matching without point values to find the correct item

### 3. Context-Aware Alias Selection
- Ships, upgrades, commanders, and squadrons are matched with appropriate context
- Officer upgrades are preferred when available for upgrade contexts
- Squadron-specific aliases are used for squadron contexts

## Updated Scripts

### 1. fleetconverter.cjs
**Enhanced Functions:**
- `getDisplayNameFromNicknameAndAlias()` - Now uses Star Forge preference
- `findAliasWithPointsForCanonicalId()` - Improved to sort by point values
- `preferStarForgeAlias()` - New helper function

**Usage:** Same as before
```bash
node fleetconverter.cjs
```

### 2. process-ship-data.cjs
**Enhanced Functions:**
- `extractShipBuilds()` - Uses Star Forge aliases for ships and upgrades
- `extractSquadronsFromFleetData()` - Uses Star Forge aliases for squadrons
- `getStarForgeAlias()` - New alias lookup function

**Usage:** Same as before
```bash
node process-ship-data.cjs converted-fleets.csv
```

### 3. alias-updater.cjs (NEW)
A new script to update existing fleet CSV files with Star Forge aliases.

**Features:**
- Updates ship names, upgrades, and squadrons in fleet_data
- Preserves fleet structure and formatting
- Handles exclamation points and point value matching

**Usage:**
```bash
node alias-updater.cjs input-fleets.csv output-fleets.csv
```

**Example:**
```bash
node alias-updater.cjs converted-fleets.csv updated-fleets.csv
```

## How It Works

### Alias Matching Process
1. **Clean Input:** Remove (0) point costs and handle exclamation points
2. **Nickname Lookup:** Check nickname map for canonical IDs
3. **Direct Alias Search:** Search aliases by name inclusion
4. **Context Filter:** Apply context-specific filtering
5. **Star Forge Preference:** Prefer aliases with proper point values

### Exclamation Point Examples
- `"Intensify Firepower!"` → Matches `"Intensify Firepower! (6)"`
- `"Dual Turbolaser Turrets!"` → Broader search finds correct point value

### Point Value Preference
- Prefers `"Imperial II-class Star Destroyer (120)"` over `"Imperial II-class Star Destroyer"`
- Sorts by points descending to get current values
- Falls back gracefully if no pointed aliases exist

## Benefits

1. **Consistent Naming:** All items use official Star Forge names and points
2. **Updated Points:** Reflects current point values from game updates
3. **Better Matching:** Handles edge cases like exclamation points and zero-point items
4. **Backward Compatible:** Falls back to original names when no alias is found

## File Outputs

When processing fleets, you'll get files with Star Forge aliases:
- Ship builds use current ship names and upgrade names
- Squadron counts use proper squadron names
- Frequency analysis reflects standardized names

## Troubleshooting

### Common Issues
1. **"match not found"** - Item not in aliases.json or nickname map
2. **Inconsistent points** - Multiple aliases with different points (uses highest)
3. **Context mismatch** - Wrong context applied (rare, but logs will show this)

### Log Files
Check `fleetconverter.log` for detailed alias matching information including:
- Exclamation point handling
- Star Forge preference selection
- Context filtering results
- Fallback scenarios

## Examples

### Before (Tournament Data)
```
ISD 2
Expert Shield Tech
Boarding Troopers
```

### After (Star Forge Aliases)
```
Imperial II-class Star Destroyer (120)
Expert Shield Tech (5)
Boarding Troopers (3)
```

### Exclamation Point Handling
```
Input: "Intensify Firepower!"
Output: "Intensify Firepower! (6)"
``` 