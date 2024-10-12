import fs from 'fs';
import path from 'path';

function updateJsonFiles(directory) {
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      updateJsonFiles(filePath);
    } else if (file.endsWith('.json')) {
      let data = fs.readFileSync(filePath, 'utf8');
      let json = JSON.parse(data);

      // Recursively update cardimage URLs
      function updateCardImages(obj) {
        for (let key in obj) {
          if (typeof obj[key] === 'object') {
            updateCardImages(obj[key]);
          } else if (key === 'cardimage' && obj[key].includes('lensdump')) {
            const imageName = obj[key].split('/').pop();
            obj[key] = `https://api.swarmada.wiki/images/${imageName}`;
          }
        }
      }

      updateCardImages(json);

      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    }
  });
}

updateJsonFiles('./public/converted-json');