const express = require('express');
const router = express.Router();
const squadronController = require('../controllers/squadronController');

router.get('/', squadronController.getAllSquadrons);
router.get('/search', squadronController.searchSquadrons); // New endpoint for searching
router.get('/:id', squadronController.getSquadronById);


module.exports = router;