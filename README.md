# SmartInventory

  ![Badge for GitHub repo top language](https://img.shields.io/github/languages/top/nursingappteam/SmartInventory-backend?style=flat&logo=appveyor) ![Badge for GitHub last commit](https://img.shields.io/github/last-commit/nursingappteam/SmartInventory-backend?style=flat&logo=appveyor)

  Check out the badges hosted by [shields.io](https://shields.io/).


  ## Description

  *The what, why, and how:*

  This repository contains the code for the SmartInventory database API server, which is a Node.js server that uses Express.js to create endpoints for the frontend of the SmartInventory app to access the database logic system. This server is part of the senior design project for the nursing department at UTA, and is designed to provide a comprehensive inventory solution for the department.

  ## Table of Contents
  * [Installation](#installation)
  * [Usage](#usage)
  * [Contributing](#contributing)
  * [Tests](#tests)
  * [License](#license)

  ## Installation

  *Steps required to install project and how to get the development environment running:*

1. Download the repo from the Github repository website or clone it to your local directory.
2. Run npm install to download the dependencies for the database server.
3. Create an .env file with the following sensitive data:
    - API_KEY
    - PORT
    - INVENTORY_ADMIN_USERNAME
    - INVENTORY_ADMIN_PASSWORD
    - INVENTORY_ADMIN_EMAIL
4. Start the project by running npm start, or npm run hot-dev for development work.


  ## Usage
  ### API KEY Verification Middleware

  This project uses API KEY verification to secure the endpoints in the API. The API KEY verification middleware is included in the code for reference:

  ### Endpoints

  The following endpoints are available in the SmartInventory API:

  - `GET /assets/display_assets`: Display a list of assets.
  - `GET /assets/get_assets`: Retrieve a list of assets.
  - `POST /assets/update`: Update an existing asset.
  - `POST /assets/add`: Add a new asset.
  - `GET /checkout/getCheckouts`: Retrieve a list of checkouts.
  - `POST /checkout/createCheckout`: Create a new checkout.
  - `POST /checkout/updateCheckout`: Update an existing checkout.
  - `POST /checkout/approveCheckout`: Approve a checkout.
  - `GET /checkout/getPendingCheckouts`: Retrieve a list of pending checkouts.
  - `POST /checkout/denyCheckouts`: Deny a checkout.
  - `GET /checkout/getCheckoutHistory`: Retrieve the checkout history.
  - `POST /checkout/returnCheckout`: Return a checkout.
  - `GET /checkout/getAllCheckouts`: Retrieve all checkouts.
  - `GET /users/getUsers`: Retrieve a list of users.
  - `POST /users/validateUser`: Validate a user.
  - `POST /users/session/validateSession`: Validate a session.
  - `GET /users/session/getSession`: Retrieve a session.
  - `POST /users/session/updateCart`: Update a cart.
  - `GET /users/session/getCart`: Retrieve a cart.
  - `POST /users/newUser`: Create a new user.
  - `POST /users/deleteUser`: Delete a user.
  - `POST /users/resetPassword`: Reset a user's password.
  - `POST /users/checkEmail`: Check if an email is available.


  Too Be Continued

  ## Contributing

  *If you would like to contribute it, you can follow these guidelines for how to do so.*

  The project is not entirely complete, is lacks a backup system. It also lacks a true proven session management system.

  ## Tests

  *Tests for application and how to run them:*

  No tests have been written.

  ## License

  MIT License

  ---

  ## Questions?

  <img src="https://avatars.githubusercontent.com/u/108439970?v=4" alt="nursingappteam" width="40%" />

  For any questions, please contact me with the information below:

  GitHub: [@nursingappteam](https://api.github.com/users/nursingappteam)
