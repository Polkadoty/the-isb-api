const express = require('express');
const router = express.Router();
const squadronController = require('../controllers/squadronController');

router.get('/', squadronController.getAllSquadrons);
router.get('/:id', squadronController.getSquadronById);

module.exports = router;