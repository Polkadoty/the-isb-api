const mongoose = require('mongoose');

const SquadronSchema = new mongoose.Schema({
  squadrons: {
    type: Map,
    of: new mongoose.Schema({
      author: String,
      alias: String,
      team: String,
      release: String,
      expansion: String,
      _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
      type: { type: String, enum: ['squadron'], required: true },
      faction: String,
      squadron_type: String,
      name: String,
      'ace-name': String,
      'unique-class': [String],
      irregular: Boolean,
      hull: Number,
      speed: Number,
      tokens: {
        def_scatter: Number,
        def_evade: Number,
        def_brace: Number
      },
      armament: {
        'anti-squadron': [Number],
        'anti-ship': [Number]
      },
      abilities: {
        adept: Number,
        'ai-battery': Number,
        'ai-antisquadron': Number,
        assault: Boolean,
        bomber: Boolean,
        cloak: Boolean,
        counter: Number,
        dodge: Number,
        escort: Boolean,
        grit: Boolean,
        heavy: Boolean,
        intel: Boolean,
        relay: Number,
        rogue: Boolean,
        scout: Boolean,
        screen: Boolean,
        snipe: Number,
        strategic: Boolean,
        swarm: Boolean
      },
      ability: String,
      unique: Boolean,
      points: Number,
      silhouette: String,
      artwork: String,
      cardimage: String
    })
  }
});

module.exports = mongoose.model('Squadron', SquadronSchema);