const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const customSquadronController = require('../controllers/customsquadronController');

router.get('/', customSquadronController.getAllCustomSquadrons);
router.get('/:squadronName', customSquadronController.getCustomSquadronByName);
router.post('/', auth, customSquadronController.createCustomSquadron);
router.put('/:squadronName', auth, customSquadronController.updateCustomSquadron);
router.delete('/:squadronName', auth, customSquadronController.deleteCustomSquadron);

module.exports = router;