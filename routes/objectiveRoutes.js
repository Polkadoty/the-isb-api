const express = require('express');
const router = express.Router();
const objectiveController = require('../controllers/objectiveController');

router.get('/', objectiveController.getAllObjectives);
router.get('/search', objectiveController.searchObjectives);
router.get('/:id', objectiveController.getObjectiveById);

module.exports = router;