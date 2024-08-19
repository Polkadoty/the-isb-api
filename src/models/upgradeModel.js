const mongoose = require('mongoose');

const UpgradeSchema = new mongoose.Schema({
  author: { type: String, required: true },
  alias: String,
  team: String,
  release: String,
  upgrades: {
    type: Map,
    of: new mongoose.Schema({
      UID: { type: String, default: () => mongoose.Types.ObjectId().toString() },
      type: String,
      faction: String,
      name: String,
      'unique-class': [String],
      ability: String,
      unique: Boolean,
      points: Number,
      modification: Boolean,
      bound_shiptype: String,
      restrictions: {
        traits: [String],
        size: [String],
        disqual_upgrades: [String],
        disable_upgrades: [String],
        flagship: Boolean,
        unique_class: String
      },
      start_command: {
        type: String,
        start_icon: String,
        start_amount: Number
      },
      exhaust: {
        type: String,
        ready_token: String,
        ready_amount: Number
      },
      artwork: String,
      cardimage: String
    })
  }
});

module.exports = mongoose.model('Upgrade', UpgradeSchema);