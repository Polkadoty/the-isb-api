const express = require('express');
const router = express.Router();
const upgradeCardController = require('../controllers/upgradeCardController');

router.get('/', upgradeCardController.getAllUpgradeCards);
router.get('/:id', upgradeCardController.getUpgradeCardById);
router.post('/', upgradeCardController.createUpgradeCard);
router.put('/:id', upgradeCardController.updateUpgradeCard);
router.delete('/:id', upgradeCardController.deleteUpgradeCard);

module.exports = router;