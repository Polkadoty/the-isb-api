const express = require('express');
const router = express.Router();
const shipController = require('../controllers/shipController');

router.get('/', shipController.getAllShips);
router.get('/:id', shipController.getShipById);

module.exports = router;