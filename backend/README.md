# Notey Backend

Base backend scaffold for the Notey application.

## Stack

- Node.js
- Express
- TypeScript
- MongoDB via Mongoose
- MinIO for object storage

## Scripts

- `npm run dev` starts the API in watch mode
- `npm run build` compiles the API to `dist`
- `npm run start` runs the compiled API
- `npm run typecheck` runs TypeScript without emitting files
- `npm run docker:up` starts the backend, MongoDB, and MinIO with Docker Compose
- `npm run docker:down` stops the Docker Compose stack and removes volumes

## Environment

Copy `.env.example` to `.env` and update the values before connecting MongoDB and MinIO.

For AI-powered note analysis, also set:

- `OPENAI_API_KEY` with your OpenAI API key
- `OPENAI_MODEL` if you want to override the default analysis model
- `OPENAI_BASE_URL` only if you need a non-default API base URL

## Docker

Docker Compose starts:

- `api` for the Express backend
- `mongo` for MongoDB
- `minio` for S3-compatible file storage

Inside Docker, the backend connects to:

- MongoDB using `mongodb://mongo:27017/notey`
- MinIO using `http://minio:9000`

Uploaded note attachments are stored in MinIO rather than on the API filesystem.
