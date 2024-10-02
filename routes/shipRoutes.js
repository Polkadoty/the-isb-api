const express = require('express');
const router = express.Router();
const shipController = require('../controllers/shipController');

router.get('/', shipController.getAllShips);
router.get('/:id', shipController.getShipById);
router.get('/search', shipController.searchShips); // New endpoint for searching

module.exports = router;