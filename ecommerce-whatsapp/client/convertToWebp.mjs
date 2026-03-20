import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirsToProcess = [
  path.join(__dirname, 'public'),
  path.join(__dirname, 'src', 'assets')
];

async function processDirectory(dir) {
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
         await processDirectory(filePath);
      } else if (file.match(/\.(png|jpe?g)$/i)) {
         
         // No tocamos los logos estrictos que pesan poco
         if (file.toLowerCase() === 'logo.jpg') continue;

         const newPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp');
         console.log(`Converting ${filePath} -> ${newPath}`);
         try {
             await sharp(filePath)
                .webp({ quality: 80 })
                .toFile(newPath);
             await fs.unlink(filePath);
             console.log(`Deleted original: ${filePath}`);
         } catch(e) {
             console.error(`Failed to convert ${file}:`, e.message);
         }
      }
    }
  } catch(e) {
      // Ignorar si el directorio no existe
      if (e.code !== 'ENOENT') {
          console.error(`Error processing ${dir}:`, e.message);
      }
  }
}

async function run() {
  for (const dir of dirsToProcess) {
     await processDirectory(dir);
  }
  console.log("Done!");
}

run();
