import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const nicknameMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../public/nickname-map.json'), 'utf8')
);

router.get('/:nickname', (req, res) => {
  const nickname = req.params.nickname;
  const matches = nicknameMap[nickname];
  
  if (!matches) {
    return res.status(404).json({ error: 'Nickname not found' });
  }

  const images = matches.map(id => ({
    id,
    fullsize: `https://api.swarmada.wiki/images/${id}.webp`,
    thumbnail: `https://api.swarmada.wiki/thumbnails/${id}.webp`
  }));

  res.json({ matches: images });
});

export default router; 