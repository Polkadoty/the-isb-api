const fs = require('fs');
const path = require('path');

// Select the database to use.
use('ISB-API-database');

// Function to read and parse the customsquadrons.json file
function readCustomSquadronsFile() {
    const filePath = path.join('public/custom-json/squadrons/customsquadrons.json');
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading customsquadrons.json:', error);
        return null;
    }
}

// Read custom squadron data
const customSquadronsData = readCustomSquadronsFile();

// Function to insert data into a collection
function insertCustomSquadrons(data) {
    if (!data) {
        console.log('No custom squadrons data to insert');
        return;
    }
    // Delete existing custom squadrons
    const collection = db.getCollection('squadrons');
    
    // Delete existing custom squadrons
    collection.deleteMany({});
    
    // Insert the new document
    collection.insertOne(data);
    console.log(`Inserted custom squadrons into squadrons collection`);
}

// Insert custom squadron data
insertCustomSquadrons(customSquadronsData);

// Print a message to the output window.
console.log('Custom squadrons import completed.');

// Example query to verify data insertion
const customSquadronCount = db.getCollection('squadrons').count();
console.log(`Total number of documents in squadrons collection: ${customSquadronCount}`);

// Optional: Print the inserted data for verification
const insertedData = db.getCollection('squadrons').findOne();
console.log('Inserted squadrons data:', JSON.stringify(insertedData, null, 2));