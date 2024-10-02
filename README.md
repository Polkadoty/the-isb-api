# The ISB API

The ISB API is a RESTful API for managing ship, squadron, and upgrade card data for Star Wars Armada. Built with Node.js and Express, this API serves static JSON files.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/the-isb-api.git
   cd the-isb-api
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the server:
   ```sh
   npm start
   ```




## Base URL
- Production: `https://api.swarmada.wiki`

## Endpoints

### Ships
- **GET /ships**: Retrieve all ships.
- **GET /ships?faction={factionName}**: Retrieve ships by faction.
- **GET /ships/{shipId}**: Retrieve a specific ship by ID.
- **GET /ships/search?{filters}**: Search ships with various filters (e.g., points, hull, chassis_name).

### Squadrons
- **GET /squadrons**: Retrieve all squadrons.
- **GET /squadrons?faction={factionName}**: Retrieve squadrons by faction.
- **GET /squadrons/{squadronId}**: Retrieve a specific squadron by ID.
- **GET /squadrons/search?{filters}**: Search squadrons with various filters (e.g., points, hull, squadron_type).

### Upgrades
- **GET /upgrades**: Retrieve all upgrades.
- **GET /upgrades?type={upgradeType}**: Retrieve upgrades by type.
- **GET /upgrades?faction={factionName}**: Retrieve upgrades by faction.
- **GET /upgrades/{upgradeId}**: Retrieve a specific upgrade by ID.
- **GET /upgrades/search?{filters}**: Search upgrades with various filters (e.g., points, type).

## Response Format
All endpoints return JSON data structured according to the Mongoose schemas.

## Error Handling
The API uses standard HTTP status codes. In case of an error, the response will include an error message in the following format:
```json
{
   "error": {
      "code": 404,
      "message": "Resource not found"
   }
}
```


## Rate Limiting
The API has a rate limit of 100 requests per minute per IP address.

## Authentication
The API currently does not require authentication for read operations.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request