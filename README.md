# LabsFlowWebCMS

## Local HTTPS setup

This project now starts with HTTPS by default using `server.js`.

1. Create local SSL files:

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -nodes -keyout certs/server.key -out certs/server.crt -days 365 -subj '/CN=localhost'
```

2. Run the server:

```bash
npm run start:https
```

3. Open in browser:

```text
https://localhost:4020
```

If you need custom paths, set environment variables in `.env`:

```env
WEB_PORT=4020
HTTP_PORT=4021
SSL_KEY_PATH=certs/server.key
SSL_CERT_PATH=certs/server.crt
```
