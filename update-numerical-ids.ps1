# PowerShell script to update renamed-fleets.csv to match the fleets table schema
# Starting numerical_id from 7137 and ensuring proper column structure

Write-Host "Starting to update renamed-fleets.csv to match fleets table schema..."
Write-Host "Starting ID: 7137"

$csvFile = "databases/renamed-fleets.csv"
$outputFile = "databases/renamed-fleets-updated.csv"

# Read the CSV file
Write-Host "Reading CSV file..."
$csv = Import-Csv $csvFile

# Get total count
$totalRows = $csv.Count
Write-Host "Total data rows to process: $totalRows"

# Calculate the last numerical_id
$startingId = 7137
$lastId = $startingId + $totalRows - 1
Write-Host "Last numerical_id will be: $lastId"

# Update and restructure data to match fleets table schema
Write-Host "Updating data structure and numerical_id values..."
$updatedData = @()
$currentId = $startingId

for ($i = 0; $i -lt $csv.Count; $i++) {
    $row = $csv[$i]
    
    # Create new object with exact schema match
    $newRow = [PSCustomObject]@{
        id = [System.Guid]::NewGuid().ToString()
        user_id = $row.user_id
        fleet_name = $row.fleet_name
        fleet_data = $row.fleet_data
        faction = $row.faction
        commander = $row.commander
        points = $row.points
        legends = "false"
        legacy = "false"
        legacy_beta = "false"
        old_legacy = $row.old_legacy
        arc = "false"
        nexus = "false"
        shared = "false"
        created_at = $row.created_at
        updated_at = $row.updated_at
        date_added = $row.date_added
        numerical_id = $currentId
    }
    
    $updatedData += $newRow
    $currentId++
    
    # Progress indicator for every 100,000 rows
    if (($i + 1) % 1000 -eq 0) {
        Write-Host "Processed $($i + 1) rows..."
    }
}

# Export the updated CSV with proper schema
Write-Host "Writing updated CSV to $outputFile..."
$updatedData | Export-Csv -Path $outputFile -NoTypeInformation

Write-Host "Update completed!"
Write-Host "Schema matched to fleets table structure"
Write-Host "Starting numerical_id: 7137"
Write-Host "Ending numerical_id: $lastId"
Write-Host "Total rows processed: $totalRows"
Write-Host "Output file: $outputFile"
Write-Host ""
Write-Host "Schema structure:"
Write-Host "- id (random UUID generated for each row)"
Write-Host "- user_id (text, nullable)"
Write-Host "- fleet_name (text)"
Write-Host "- fleet_data (text)"
Write-Host "- faction (text)"
Write-Host "- commander (text)"
Write-Host "- points (integer)"
Write-Host "- legends (boolean, set to false)"
Write-Host "- legacy (boolean, set to false)"
Write-Host "- legacy_beta (boolean, set to false)"
Write-Host "- old_legacy (preserved from original)"
Write-Host "- arc (boolean, set to false)"
Write-Host "- nexus (boolean, set to false)"
Write-Host "- shared (boolean, set to false)"
Write-Host "- created_at (timestamp)"
Write-Host "- updated_at (timestamp)"
Write-Host "- date_added (preserved from original)"
Write-Host "- numerical_id (incremented from 7137)" 