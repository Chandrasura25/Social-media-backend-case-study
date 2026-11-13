# Social Media API

[![Tests](https://github.com/Chandrasura25/Social-media-backend-case-study/actions/workflows/tests.yml/badge.svg)](https://github.com/Chandrasura25/Social-media-backend-case-study/actions/workflows/tests.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)

A TypeScript / Express backend for a social network — accounts, posts with media, follows, a personalised feed, likes, comments, @mentions, and real-time notifications.

**📖 Interactive API docs → [chandrasura25.github.io/Social-media-backend-case-study](https://chandrasura25.github.io/Social-media-backend-case-study/)**

## Features

| | |
|---|---|
| **Auth** | JWT bearer tokens, bcrypt-hashed passwords, same error for unknown email and wrong password (no account enumeration) |
| **Posts** | Text and/or one image or MP4 (≤ 10 MB) via Multer → Cloudinary, or local disk when Cloudinary isn't configured |
| **Feed** | Posts from people you follow plus your own, newest first, paginated |
| **Follows** | Atomic `$addToSet` / `$pull` on both users; can't follow yourself or follow twice |
| **Likes & comments** | One like per user; counts and `likedByMe` on every post |
| **Notifications** | Likes, comments, mentions and follows are **saved** to MongoDB and **pushed live** over Socket.IO to the recipient's own room only |
| **Caching** | Optional Redis cache on `/posts` and `/feed`, keyed **per user** so nobody sees someone else's feed, and cleared on every write |
| **Errors** | Central error handler; bad ids → 400, missing → 404, conflicts → 409, validation → 422 |

## Architecture

```
index.ts               start-up: MongoDB → Redis (optional) → HTTP + Socket.IO
src/
  app.ts               Express app (no network side effects — imported directly by tests)
  routes.ts            all routes in one place
  realtime.ts          Socket.IO auth + per-user rooms, notify()
  config.ts            env vars, required ones fail fast
  controllers/         userController (auth, follows, notifications), postController
  models/              User, Post, Notification (Mongoose)
  utils/               auth middleware, Redis cache, uploads, pagination, errors
tests/                 integration tests against an in-memory MongoDB
docs/                  OpenAPI 3 spec + docs site (GitHub Pages)
```

## Endpoints

All routes are under `/api` and need `Authorization: Bearer <token>` except register and login.

| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Create account → `{ token, user }` |
| `POST` | `/login` | Log in → `{ token, user }` |
| `GET` | `/me` | My profile with follower counts |
| `GET` | `/users/:userId` | A user's profile |
| `POST` | `/follow/:userId` · `/unfollow/:userId` | Follow / unfollow |
| `GET` | `/posts` | All posts (paginated) |
| `POST` | `/posts` | Create a post (JSON, or multipart with `file`) |
| `GET` | `/posts/:userId` | A user's posts |
| `DELETE` | `/posts/:postId` | Delete my post |
| `POST` | `/posts/like/:postId` · `/posts/unlike/:postId` | Like / unlike |
| `POST` | `/posts/comment/:postId` | Comment (with optional mentions) |
| `GET` | `/feed` | My feed |
| `GET` | `/notifications?unread=true` | My notifications |
| `POST` | `/notifications/read` | Mark all read |

Paginated lists accept `?page=` and `?limit=` (max 50) and return `{ data, page, limit, total, totalPages }`.

### Real-time notifications

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', { auth: { token } });
socket.on('notifications', (unread) => console.log('unread on connect', unread));
socket.on('notification', (n) => console.log(`${n.type} from ${n.actor}`));
```

## Run it locally

Requires Node 18+ and MongoDB. Redis and Cloudinary are optional.

```bash
git clone https://github.com/Chandrasura25/Social-media-backend-case-study.git
cd Social-media-backend-case-study
npm install
cp .env.example .env     # set MONGODB_URI and JWT_SECRET
npm run dev              # http://localhost:3000/health
```

Production build: `npm run build && npm start`.

## Tests

```bash
npm test
```

16 integration tests run the real Express app against an in-memory MongoDB (`mongodb-memory-server`) — covering auth, follow/unfollow consistency, feed scoping and ordering, pagination, media uploads, ownership checks, duplicate likes, and who does (and doesn't) get notified. They run on every push via GitHub Actions.
