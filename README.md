# Notey Backend

Base backend scaffold for the Notey application.

## Stack

- Node.js
- Express
- TypeScript
- MongoDB via Mongoose

## Scripts

- `npm run dev` starts the API in watch mode
- `npm run build` compiles the API to `dist`
- `npm run start` runs the compiled API
- `npm run typecheck` runs TypeScript without emitting files
- `npm run docker:up` starts the backend and MongoDB with Docker Compose
- `npm run docker:down` stops the Docker Compose stack and removes volumes

## Environment

Copy `.env.example` to `.env` and update the values before connecting MongoDB.

## Docker

Docker Compose starts:

- `api` for the Express backend
- `mongo` for MongoDB

Inside Docker, the backend connects to MongoDB using `mongodb://mongo:27017/notey`.
