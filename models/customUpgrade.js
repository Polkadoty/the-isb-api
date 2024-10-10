const mongoose = require('mongoose');

const UpgradeSchema = new mongoose.Schema({
  author: String,
  alias: String,
  team: String,
  release: String,
  expansion: String,
  _id: String,
  type: String,
  faction: [String],
  name: String,
  "unique-class": [String],
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
    enable_upgrades: [String],
    flagship: Boolean
  },
  start_command: {
    type: String,
    start_icon: [String],
    start_amount: Number
  },
  exhaust: {
    type: String,
    ready_token: [String],
    ready_amount: Number
  },
  artwork: String,
  cardimage: String
}, { _id: false });

const CustomUpgradeSchema = new mongoose.Schema({
  upgrades: {
    type: Map,
    of: UpgradeSchema
  }
});

module.exports = mongoose.model('customUpgrade', CustomUpgradeSchema);