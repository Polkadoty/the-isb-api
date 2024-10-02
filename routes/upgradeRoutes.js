const express = require('express');
const router = express.Router();
const upgradeController = require('../controllers/upgradeController');

router.get('/', upgradeController.getAllUpgrades);
router.get('/:id', upgradeController.getUpgradeById);
router.get('/search', upgradeController.searchUpgrades); // New endpoint for searching

module.exports = router;