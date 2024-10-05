const express = require('express');
const router = express.Router();
const upgradeController = require('../controllers/upgradeController');

router.get('/', upgradeController.getAllUpgrades);
router.get('/search', upgradeController.searchUpgrades);
router.get('/:id', upgradeController.getUpgradeById);
 // New endpoint for searching

module.exports = router;