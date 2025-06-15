// fleet-import/bulk_import_fleets.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function bulkImportFleets(csvFilePath) {
  const fleets = [];
  let totalProcessed = 0;
  let totalErrors = 0;
  
  console.log('Reading CSV file...');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Map your CSV columns to the fleets table structure
        fleets.push({
          user_id: row.user_id || null,
          fleet_name: row.fleet_name || row.name,
          fleet_data: row.fleet_data || row.data,
          faction: row.faction,
          commander: row.commander || '',
          points: parseInt(row.points) || 0,
          legends: row.legends === 'true' || false,
          legacy: row.legacy === 'true' || false,
          legacy_beta: row.legacy_beta === 'true' || false,
          arc: row.arc === 'true' || false,
          nexus: row.nexus === 'true' || false,
          shared: row.shared === 'true' || true,
          // numerical_id will auto-increment
        });
      })
      .on('end', async () => {
        console.log(`Found ${fleets.length} fleets to import.`);
        
        const batchSize = 1000;
        const totalBatches = Math.ceil(fleets.length / batchSize);
        
        for (let i = 0; i < fleets.length; i += batchSize) {
          const batch = fleets.slice(i, i + batchSize);
          const batchNumber = Math.floor(i / batchSize) + 1;
          
          try {
            console.log(`Processing batch ${batchNumber}/${totalBatches}...`);
            
            const { data, error } = await supabase
              .from('fleets')
              .insert(batch);
            
            if (error) {
              console.error(`Error in batch ${batchNumber}:`, error);
              totalErrors += batch.length;
            } else {
              totalProcessed += batch.length;
              console.log(`✅ Batch ${batchNumber} completed successfully.`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (batchError) {
            console.error(`Unexpected error in batch ${batchNumber}:`, batchError);
            totalErrors += batch.length;
          }
        }
        
        console.log('\n🎉 Import completed!');
        console.log(`Total processed: ${totalProcessed}`);
        console.log(`Total errors: ${totalErrors}`);
        
        resolve({ totalProcessed, totalErrors });
      })
      .on('error', reject);
  });
}

// Usage
const csvFilePath = './renamed-fleets-updated.csv';
bulkImportFleets(csvFilePath)
  .then(console.log)
  .catch(console.error);