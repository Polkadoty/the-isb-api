const mongoose = require('mongoose');

const ShipSchema = new mongoose.Schema({
  author: { type: String, required: true },
  alias: String,
  team: String,
  release: String,
  ships: {
    type: Map,
    of: new mongoose.Schema({
      UID: { type: String, default: () => mongoose.Types.ObjectId().toString() },
      type: { type: String, enum: ['chassis'], required: true },
      chassis_name: String,
      size: String,
      hull: Number,
      tokens: {
        def_scatter: Number,
        def_evade: Number,
        def_brace: Number,
        def_redirect: Number,
        def_contain: Number,
        def_salvo: Number
      },
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
        of: new mongoose.Schema({
          UID: { type: String, default: () => mongoose.Types.ObjectId().toString() },
          type: { type: String, enum: ['ship'], required: true },
          chassis: String,
          name: String,
          faction: String,
          unique: Boolean,
          traits: [String],
          points: Number,
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
        })
      }
    })
  }
});

module.exports = mongoose.model('Ship', ShipSchema);