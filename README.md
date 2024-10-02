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

### Using Docker

If you prefer using Docker:

1. Make sure you have Docker and Docker Compose installed.

2. Build and run the containers:
   ```sh
   docker-compose up --build
   ```

The API will be available at `http://localhost:4000`.

## Usage

The API provides endpoints for managing ships, squadrons, and upgrades. Here are some example requests using `curl`:

### Ships

1. Get all ships:
   ```sh
   curl http://localhost:4000/api/ships
   ```

2. Get all squadrons:
   ```sh
   curl http://localhost:4000/api/squadrons
   ```

3. Get all upgrades:
   ```sh
   curl http://localhost:4000/api/upgrades
   ```

## API Endpoints

- `/api/ships`
  - GET: Retrieve all ships
- `/api/squadrons`
  - GET: Retrieve all squadrons
- `/api/upgrades`
  - GET: Retrieve all upgrades

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request