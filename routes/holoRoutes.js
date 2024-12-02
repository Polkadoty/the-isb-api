import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load nickname mappings
const nicknameMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/nickname-map.json'), 'utf8')
);

// Load image mappings
const imageMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/images.json'), 'utf8')
);

router.get('/:nickname', (req, res) => {
  const nickname = req.params.nickname;
  const matches = nicknameMap[nickname];

  if (!matches) {
    return res.status(404).json({ 
      error: 'No cards found matching that nickname.',
      suggestions: Object.keys(nicknameMap)
        .filter(name => name.toLowerCase().includes(nickname.toLowerCase()))
        .slice(0, 5)
    });
  }

  const images = matches
    .filter(id => imageMap[id])
    .map(id => ({
      id,
      name: nickname,
      imageUrl: imageMap[id].fullsize,
      thumbnailUrl: imageMap[id].thumbnail
    }));

  res.json({ matches: images });
});

export default router; 