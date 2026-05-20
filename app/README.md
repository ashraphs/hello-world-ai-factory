# Hello World AI Factory App

Simple Express.js application deployed through the AI software factory pipeline.

## Endpoints

- `GET /` - Returns Hello World message
- `GET /health` - Health check endpoint

## Running Locally

```bash
npm install
npm start
```

Visit http://localhost:3000

## Testing

```bash
npm test
```

## Docker Build

```bash
docker build -t hello-world-app .
docker run -p 3000:3000 hello-world-app
```

## Environment Variables

- `PORT` - Port to listen on (default: 3000)
