const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const customUpgradeController = require('../controllers/customupgradeController');

router.get('/', customUpgradeController.getAllCustomUpgrades);
router.get('/:upgradeName', customUpgradeController.getCustomUpgradeByName);
router.post('/', auth, customUpgradeController.createCustomUpgrade);
router.put('/:upgradeName', auth, customUpgradeController.updateCustomUpgrade);
router.delete('/:upgradeName', auth, customUpgradeController.deleteCustomUpgrade);

module.exports = router;