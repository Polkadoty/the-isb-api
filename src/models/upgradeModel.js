const mongoose = require('mongoose');

const UpgradeSchema = new mongoose.Schema({
  upgrades: {
    type: Map,
    of: new mongoose.Schema({
      author: { type: String, default: null },
      alias: { type: String, default: null },
      team: { type: String, default: null },
      release: { type: String, default: null },
      expansion: { type: String, default: null },
      _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      type: { type: String, default: null },
      faction: [{ type: String, default: null }],
      name: { type: String, default: null },
      'unique-class': [{ type: String, default: null }],
      ability: { type: String, default: null },
      unique: Boolean,
      points: Number,
      modification: Boolean,
      bound_shiptype: { type: String, default: '' },
      restrictions: {
        traits: [{ type: String, default: '' }],
        size: [{ type: String, default: '' }],
        disqual_upgrades: [{ type: String, default: '' }],
        disable_upgrades: [{ type: String, default: '' }],
        flagship: Boolean
      },
      start_command: {
        type: { type: String, default: '' },
        start_icon: [{ type: String, default: '' }],
        start_amount: { type: Number, default: 0 }
      },
      exhaust: {
        type: { type: String, default: '' },
        ready_token: [{ type: String, default: '' }],
        ready_amount: { type: Number, default: 0 }
      },
      artwork: { type: String, default: null },
      cardimage: { type: String, default: null }
    })
  }
});

module.exports = mongoose.model('Upgrade', UpgradeSchema);