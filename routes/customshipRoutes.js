const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const customShipController = require('../controllers/customshipController');

router.get('/', customShipController.getAllCustomShips);
router.get('/:chassisName', customShipController.getCustomShipByChassisName);
router.post('/', auth, customShipController.createCustomShip);
router.put('/:chassisName', auth, customShipController.updateCustomShip);
router.delete('/:chassisName', auth, customShipController.deleteCustomShip);

module.exports = router;