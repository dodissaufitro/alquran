const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const resDir = path.join(__dirname, '../android/app/src/main/res');

async function processIcons() {
  const dirs = fs.readdirSync(resDir).filter(d => d.startsWith('mipmap-'));

  for (const dir of dirs) {
    const dirPath = path.join(resDir, dir);
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const tempPath = filePath + '.tmp';
      
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      const newWidth = Math.round(metadata.width * 0.65);
      const newHeight = Math.round(metadata.height * 0.65);
      
      const top = Math.floor((metadata.height - newHeight) / 2);
      const bottom = metadata.height - newHeight - top;
      const left = Math.floor((metadata.width - newWidth) / 2);
      const right = metadata.width - newWidth - left;

      await image
        .resize(newWidth, newHeight)
        .extend({
          top,
          bottom,
          left,
          right,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(tempPath);
        
      fs.renameSync(tempPath, filePath);
      console.log(`Padded ${dir}/${file}`);
    }
  }
}

processIcons().catch(console.error);
