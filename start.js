import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// List of commands to run in sequence
const commands = [
  { cmd: 'node', args: ['unitTester.js', '-all'] },
  { cmd: 'node', args: ['jsoncombiner.js', '-all'] },
  { cmd: 'node', args: ['generateAliases.js'] },
  { cmd: 'node', args: ['generateThumbnails.js'] },
  { cmd: 'node', args: ['find-errata.js'] },
  { cmd: 'node', args: ['find-nicknames.js'] },
  { cmd: 'node', args: ['webpToJpegConverter.js', path.resolve('C:/GitHub/the-isb-api/images')] }
];

// Run commands in sequence
async function runSequentially() {
  for (const [index, command] of commands.entries()) {
    console.log(`\n[${index + 1}/${commands.length}] Running: ${command.cmd} ${command.args.join(' ')}`);
    
    try {
      await new Promise((resolve, reject) => {
        const process = spawn(command.cmd, command.args, { stdio: 'inherit' });
        
        process.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ Command completed successfully!`);
            resolve();
          } else {
            reject(new Error(`Command failed with exit code ${code}`));
          }
        });
        
        process.on('error', (err) => {
          reject(new Error(`Failed to start command: ${err.message}`));
        });
      });
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }
  
  console.log('\n✨ All commands completed successfully! ✨');
}

// Start execution
runSequentially(); 