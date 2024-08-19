const express = require('express');
const router = express.Router();
const upgradeController = require('../controllers/upgradeController');

router.get('/', upgradeController.getAllUpgrades);
router.get('/:id', upgradeController.getUpgradeById);
router.post('/', upgradeController.createUpgrade);
router.put('/:id', upgradeController.updateUpgrade);
router.delete('/:id', upgradeController.deleteUpgrade);

module.exports = router;