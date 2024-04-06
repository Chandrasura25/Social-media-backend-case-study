# Expatswap User Management Backend

This repository contains the backend implementation for the Expatswap User Management Module. It provides RESTful APIs for user creation, fetching, and pagination, with data persistence in a MongoDB database.

## Technologies Used

- Node.js: JavaScript runtime environment
- Express.js: Web application framework for Node.js
- MongoDB: NoSQL database for storing user data
- Mongoose: MongoDB object modeling for Node.js
- bcrypt.js: Library for hashing passwords

## Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/Chandrasura25/Expatswap-Backend
    ```

2. Install dependencies:

    ```bash
    cd expatswap-backend
    npm install
    ```

3. Set up environment variables:

    Create a `.env` file in the root directory and define the following variables:

    ```plaintext
    PORT=
    MONGODB_URI=<mongodb-connection-string>
    ```

4. Start the server:

    ```bash
    npm start
    ```

The server should now be running on the specified port.

## API Endpoints

### User Creation

- **URL:** `/api/users`
- **Method:** POST
- **Request Body:**

    ```json
    {
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "1234567890",
        "email": "john.doe@example.com",
        "password": "password123",
        "dateOfBirth": "1990-01-01"
    }
    ```

- **Response:**

    - 201 Created: User created successfully
    - 400 Bad Request: Invalid request body or validation errors

### Fetch Users

- **URL:** `/api/users`
- **Method:** GET
- **Query Parameters:**
    - `page`: Page number (default: 1)
    - `limit`: Number of users per page (default: 10)
    - `from`: Start date of birth range (optional)
    - `to`: End date of birth range (optional)

- **Response:**

    ```json
    {
        "users": [
            {
                "_id": "12345",
                "firstName": "John",
                "lastName": "Doe",
                "phoneNumber": "1234567890",
                "email": "john.doe@example.com",
                "dateOfBirth": "1990-01-01"
            },
            ...
        ],
        "totalUsers": 25,
        "currentPage": 1,
        "totalPages": 3
    }
    ```

## Security Considerations

- Ensured to sanitize and validate user inputs to prevent injection attacks.
- Hash passwords using bcrypt.js before storing them in the database.
- Implemented rate limiting and authentication mechanisms for secure access to APIs.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.