API Definition for Armada List Builder

Base URL: https://api.swarmada.wiki/v1 or https://localhost:4000

1. Mongoose Schema Definitions:

a. Ship Schema:
```javascript
const ShipSchema = new mongoose.Schema({
  ships: {
    type: Map,
    of: new mongoose.Schema({
      UID: { type: String, default: () => mongoose.Types.ObjectId().toString() },
      type: { type: String, enum: ['chassis'], required: true },
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
        of: new mongoose.Schema({
          UID: { type: String, default: () => mongoose.Types.ObjectId().toString() },
          type: { type: String, enum: ['ship'], required: true },
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
        })
      }
    })
  }
});
```

b. Squadron Schema:
```javascript
const SquadronSchema = new mongoose.Schema({
  squadrons: {
    type: Map,
    of: new mongoose.Schema({
      UID: { type: String, default: () => mongoose.Types.ObjectId().toString() },
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
```

c. Upgrade Schema:
```javascript
const UpgradeSchema = new mongoose.Schema({
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
```

2. REST API Endpoints:

a. Ships:
- GET /ships - Get all ships
- GET /ships?faction={factionName} - Get ships by faction
- GET /ships/{shipId} - Get a specific ship by ID

b. Squadrons:
- GET /squadrons - Get all squadrons
- GET /squadrons?faction={factionName} - Get squadrons by faction
- GET /squadrons/{squadronId} - Get a specific squadron by ID

c. Upgrades:
- GET /upgrades - Get all upgrades
- GET /upgrades?type={upgradeType} - Get upgrades by type
- GET /upgrades?faction={factionName} - Get upgrades by faction
- GET /upgrades/{upgradeId} - Get a specific upgrade by ID

Response Format:
All endpoints return JSON data structured according to the Mongoose schemas defined above.

Authentication:
The API currently does not require authentication for read operations.

Rate Limiting:
The API has a rate limit of 100 requests per minute per IP address.

Error Handling:
The API uses standard HTTP status codes. In case of an error, the response will include an error message in the following format:

```json
{
  "error": {
    "code": 404,
    "message": "Resource not found"
  }
}
```

Additional Notes:
- The API uses Mongoose's Map type for nested objects, allowing for dynamic keys in the ships, squadrons, and upgrades collections.
- Each item (ship, squadron, upgrade) has a unique identifier (UID) generated using MongoDB's ObjectId.
- The schemas include detailed information about each item, including stats, abilities, and restrictions.
- When querying the API, you can filter results by faction, type, or get specific items by their ID.
- Consider implementing server-side caching to improve performance for frequently accessed data.

