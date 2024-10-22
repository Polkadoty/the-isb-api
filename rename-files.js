import fs from 'fs';
import path from 'path';

const directoryPath = path.join(process.cwd(), 'images', 'old-legacy-upgrades'); // Use process.cwd() to get the current working directory

function renameFilesInDirectory(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            return console.error(`Unable to scan directory: ${err}`);
        }

        files.forEach(file => {
            const oldPath = path.join(directory, file);
            const ext = path.extname(file);
            const baseName = path.basename(file, ext);
            const newFileName = `${baseName}-old-legacy${ext}`; // Append '-old-legacy' before the extension
            const newPath = path.join(directory, newFileName);

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    console.error(`Error renaming file ${file}: ${err}`);
                } else {
                    console.log(`Renamed: ${file} to ${newFileName}`);
                }
            });
        });
    });
}

renameFilesInDirectory(directoryPath);
