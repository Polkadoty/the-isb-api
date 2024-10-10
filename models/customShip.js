const mongoose = require('mongoose');

const ModelSchema = new mongoose.Schema({
  author: String,
  alias: String,
  team: String,
  release: String,
  expansion: String,
  _id: String,
  type: String,
  chassis: String,
  name: String,
  faction: String,
  unique: Boolean,
  traits: [String],
  points: Number,
  tokens: {
    def_scatter: Number,
    def_evade: Number,
    def_brace: Number,
    def_redirect: Number,
    def_contain: Number,
    def_salvo: Number
  },
  values: {
    command: Number,
    squadron: Number,
    engineer: Number
  },
  upgrades: [String],
  armament: {
    asa: [Number],
    front: [Number],
    rear: [Number],
    left: [Number],
    right: [Number],
    left_aux: [Number],
    right_aux: [Number],
    special: [Number]
  },
  artwork: String,
  cardimage: String
}, { _id: false });

const ShipSchema = new mongoose.Schema({
  _id: String,
  type: String,
  chassis_name: String,
  size: String,
  hull: Number,
  speed: {
    1: [Number],
    2: [Number],
    3: [Number],
    4: [Number]
  },
  shields: {
    front: Number,
    rear: Number,
    left: Number,
    right: Number,
    left_aux: Number,
    right_aux: Number
  },
  hull_zones: {
    frontoffset: Number,
    centeroffset: Number,
    rearoffset: Number,
    frontangle: Number,
    centerangle: Number,
    rearangle: Number
  },
  silhouette: String,
  blueprint: String,
  models: {
    type: Map,
    of: ModelSchema
  }
}, { _id: false });

const CustomShipSchema = new mongoose.Schema({
  ships: {
    type: Map,
    of: ShipSchema
  }
});

module.exports = mongoose.model('customShip', CustomShipSchema);