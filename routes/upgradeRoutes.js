const express = require('express');
const router = express.Router();
const upgradeController = require('../controllers/upgradeController');

router.get('/', upgradeController.getAllUpgrades);
router.get('/:id', upgradeController.getUpgradeById);

module.exports = router;