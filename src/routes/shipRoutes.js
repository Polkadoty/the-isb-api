const express = require('express');
const router = express.Router();
const shipController = require('../controllers/shipController');

router.get('/', shipController.getAllShips);
router.get('/:id', shipController.getShipById);
router.post('/', shipController.createShip);
router.put('/:id', shipController.updateShip);
router.delete('/:id', shipController.deleteShip);

module.exports = router;