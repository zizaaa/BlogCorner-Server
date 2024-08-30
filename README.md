# BlogCorner Server

## Overview

This project is a server application designed to [briefly describe the purpose of your server, e.g., manage blog posts, handle user authentication, etc.]. It uses PostgreSQL as the database for data storage and management.

## Prerequisites

Before running this server, ensure you have the following installed:

- **Node.js** v20.11.0.
- **PostgreSQL** v16.4

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```
   
2. **Install Dependencies**
   ```bash
     npm install
   ```
   or
    ```bash
     yarn install
   ```
    
3. **Configure PostgreSQL**
  - Create a PostgreSQL database.
  - Set up a .env file in the root directory of the project with the following variables:
    ```plaintext
    DATABASE_URL=postgres://username:password@localhost:5432/your-database
    JWT_SECRET=your-jwt-secret
    ```
  - DATABASE_URL: The connection string for PostgreSQL, replace username, password, localhost, 5432, and your-database with your actual database credentials and details.
  - JWT_SECRET: A secret key for JSON Web Tokens (JWT). 

4. **Start the Server**
   ```bash
     npm run dev
   ```

5. **License**
  - This project is licensed under the MIT License.
