# The ISB API

The ISB API is a RESTful API for managing ship, squadron, and upgrade card data for an Armada-like game. Built with Node.js, Express, and MongoDB, this API provides a robust backend for game data management.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/the-isb-api.git
   cd the-isb-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/isb_db
   ```

4. Start the server:
   ```
   npm start
   ```

### Using Docker

If you prefer using Docker:

1. Make sure you have Docker and Docker Compose installed.

2. Build and run the containers:
   ```
   docker-compose up --build
   ```

The API will be available at `http://localhost:4000`.

## Deploying on Railway

You can easily deploy this API on Railway by clicking the button below:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Polkadoty/the-isb-api&envs=MONGODB_URI&MONGODB_URIDesc=Your MongoDB connection string)

### Steps after clicking the deploy button:

1. Click on "Deploy Now"
2. Connect your GitHub account if you haven't already
3. Configure your MongoDB URI in the environment variables
4. Click "Deploy"

Railway will automatically build and deploy your API using the Dockerfile in your repository.

### Connecting your domain

After deploying on Railway:

1. Go to your project settings in the Railway dashboard
2. Navigate to the "Domains" section
3. Add your custom domain: `api.swarmada.wiki`
4. Update your DNS settings to point to the Railway-provided value

Remember to update your client applications to use `https://api.swarmada.wiki` as the base URL for API requests.

## Usage

The API provides endpoints for managing ships, squadrons, and upgrades. Here are some example requests using `curl`:

### Ships

1. Get all ships:
   ```
   curl http://localhost:4000/api/ships
   ```

2. Get a specific ship:
   ```
   curl http://localhost:4000/api/ships/{shipId}
   ```

3. Create a new ship:
   ```
   curl -X POST -H "Content-Type: application/json" -d '{
     "author": "Imperial Shipyards",
     "alias": "ISD",
     "team": "Empire",
     "release": "Wave 1",
     "ships": {
       "isd": {
         "type": "chassis",
         "chassis_name": "Imperial-class Star Destroyer",
         "size": "large",
         "hull": 11,
         "tokens": {
           "def_scatter": 2,
           "def_evade": 2,
           "def_brace": 2,
           "def_redirect": 2,
           "def_contain": 2,
           "def_salvo": 2
         },
         "speed": {
           "1": [1, 0],
           "2": [1, 1],
           "3": [0, 1, 1]
         },
         "shields": {
           "front": 4,
           "rear": 2,
           "left": 3,
           "right": 3
         }
       }
     }
   }' http://localhost:4000/api/ships
   ```

4. Update a ship:
   ```
   curl -X PUT -H "Content-Type: application/json" -d '{
     "ships": {
       "isd": {
         "hull": 12
       }
     }
   }' http://localhost:4000/api/ships/{shipId}
   ```

5. Delete a ship:
   ```
   curl -X DELETE http://localhost:4000/api/ships/{shipId}
   ```

Similar endpoints exist for squadrons (`/api/squadrons`) and upgrades (`/api/upgrades`).

## API Endpoints

- `/api/ships`
  - GET: Retrieve all ships
  - POST: Create a new ship
- `/api/ships/{id}`
  - GET: Retrieve a specific ship
  - PUT: Update a specific ship
  - DELETE: Delete a specific ship

Similar endpoints exist for squadrons and upgrades.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.