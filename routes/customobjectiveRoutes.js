const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const customObjectiveController = require('../controllers/customobjectiveController');

router.get('/', customObjectiveController.getAllCustomObjectives);
router.get('/:objectiveName', customObjectiveController.getCustomObjectiveByName);
router.post('/', auth, customObjectiveController.createCustomObjective);
router.put('/:objectiveName', auth, customObjectiveController.updateCustomObjective);
router.delete('/:objectiveName', auth, customObjectiveController.deleteCustomObjective);

module.exports = router;