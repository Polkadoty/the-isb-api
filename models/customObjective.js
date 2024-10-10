const mongoose = require('mongoose');

const ObjectiveSchema = new mongoose.Schema({
  author: String,
  alias: String,
  team: String,
  release: String,
  expansion: String,
  _id: String,
  type: String,
  name: String,
  obstacles: [String],
  setup: String,
  special_rule: String,
  end_of_round: String,
  end_of_game: String,
  victory_tokens: Boolean,
  victory_tokens_points: Number,
  objective_tokens: Boolean,
  objective_tokens_type: String,
  objective_tokens_count: [Number],
  command_tokens: Boolean,
  command_tokens_type: String,
  command_tokens_value: String,
  command_tokens_count: Number,
  errata: String,
  artwork: String,
  cardimage: String
}, { _id: false });

const CustomObjectiveSchema = new mongoose.Schema({
  objectives: {
    type: Map,
    of: ObjectiveSchema
  }
});

module.exports = mongoose.model('customObjective', CustomObjectiveSchema);