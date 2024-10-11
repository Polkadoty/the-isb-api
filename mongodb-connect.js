const fs = require('fs');
const path = require('path');

// Select the database to use.
use('ISB-API-database');

// Function to read and parse JSON files from a directory
function readJsonFilesFromDirectory(directory) {
    const files = fs.readdirSync(directory);
    return files.reduce((acc, file) => {
        if (path.extname(file) === '.json') {
            const filePath = path.join(directory, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);
            return { ...acc, ...jsonData };
        }
        return acc;
    }, {});
}

// Read data from each subdirectory
// const shipsData = readJsonFilesFromDirectory('./public/custom-json/ships');
const squadronsData = readJsonFilesFromDirectory('./public/custom-json/squadrons');
// const upgradesData = readJsonFilesFromDirectory('./public/custom-json/upgrades');
// const objectivesData = readJsonFilesFromDirectory('./public/custom-json/objectives');

// Function to insert data into a collection
function insertDataIntoCollection(collectionName, data) {
    const collection = db.getCollection(collectionName);
    collection.deleteMany({}); // Clear existing data
    const documents = Object.values(data);
    if (documents.length > 0) {
        collection.insertMany(documents);
        console.log(`Inserted ${documents.length} documents into ${collectionName}`);
    } else {
        console.log(`No documents to insert into ${collectionName}`);
    }
}

// Insert data into respective collections
// insertDataIntoCollection('ships', shipsData.ships);
insertDataIntoCollection('squadrons', squadronsData.squadrons);
// insertDataIntoCollection('upgrades', upgradesData.upgrades);
// insertDataIntoCollection('objectives', objectivesData.objectives);

// Print a message to the output window.
console.log('Data import completed.');

// // Example query to verify data insertion
// const shipCount = db.getCollection('squadrons').count();
// console.log(`Total number of squadrons: ${squadronCount}`);