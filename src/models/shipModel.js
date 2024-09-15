const mongoose = require('mongoose');

const ShipSchema = new mongoose.Schema({
  ships: {
    type: Map,
    of: new mongoose.Schema({
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
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
          author: String,
          alias: String,
          team: String,
          release: String,
          expansion: String,
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
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
        }, { _id: false })
      }
    }, { _id: false })
  }
});

ShipSchema.statics.processData = function(data) {
  if (!data.ships) {
    data = { ships: { [data.ships.chassis_name]: data.ships } };
  }
  
  for (let [shipKey, ship] of Object.entries(data.ships)) {
    if (!ship._id) {
      ship._id = new mongoose.Types.ObjectId();
    }
    if (ship.models) {
      for (let [modelKey, model] of Object.entries(ship.models)) {
        if (!model._id) {
          model._id = new mongoose.Types.ObjectId();
        }
      }
    }
  }
  return data;
};

module.exports = mongoose.model('Ship', ShipSchema);