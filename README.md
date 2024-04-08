# Social Media API

Welcome to the Social Media API! This API provides functionality for a basic social media platform, allowing users to register, create posts, follow other users, like and comment on posts, receive notifications, and more.

## Table of Contents

- [Introduction](#introduction)
- [Functionality](#functionality)
- [Technical Specifications](#technical-specifications)
- [Endpoints](#endpoints)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Introduction

This API serves as the backend for a social media platform, providing various features for user interaction and data management. It is built using Express.js and TypeScript, with MongoDB as the database solution. The API design emphasizes performance, scalability, and reliability.

## Functionality

- **User Management**:
  - Users can register and create accounts.
  - Users can log in and authenticate using JWT or session-based authentication.

- **Posts and Feed**:
  - Users can create posts with text and optional image/video attachments.
  - Users can follow other users.
  - Users can see posts from the people they follow in their personalized feed.
  - Pagination is implemented for retrieving large amounts of data efficiently.

- **Likes and Comments**:
  - Users can like and comment on posts created by others.
  - Users can see the number of likes and comments on a post.

- **Notifications**:
  - Users receive notifications for mentions, likes, and comments.
  - Real-time notifications are implemented using WebSockets.

## Technical Specifications

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT or session-based
- **Caching**: Implemented for improved response times
- **Testing**: Jest
- **Documentation**: Swagger or similar tool

## Endpoints

### User Management

- `POST /register`: Register a new user.
- `POST /login`: Log in and authenticate user.

### Posts

- `POST /posts`: Create a new post.
- `GET /posts`: Get all posts.
- `GET /posts/:userId`: Get posts by a specific user.
- `POST /posts/like/:postId`: Like a post.
- `POST /posts/unlike/:postId`: Unlike a post.
- `POST /posts/comment/:postId`: Comment on a post.

### Feed

- `GET /feed`: Get personalized feed for the authenticated user.

### Followers and Following

- `POST /follow/:userIdToFollow`: Follow a user.
- `POST /unfollow/:userIdToUnfollow`: Unfollow a user.

### Notifications

- Real-time notifications are sent via WebSockets.

## Getting Started

1. Clone the repository: `https://gitlab.com/Chandrasura25/Social-media-backend-case-study or https://github.com/Chandrasura25/Social-media-backend-case-study`
2. Install dependencies: `cd Social-media-backend-case-study and npm install`
3. Set up environment variables: Create a `.env` file based on `.env.example` and provide necessary values.
4. Start the server: `npm start`

## Testing

Testing is implemented using Jest. Run tests with the command:

```bash
npm test
```

## Contributing

Contributions are welcome! Please follow the [contribution guidelines](CONTRIBUTING.md) before making a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
