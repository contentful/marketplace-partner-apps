import express, { Request, Response } from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import type http from 'http';

const app = express();

app.use((req: Request, res: Response, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

app.use(
  '/',
  createProxyMiddleware({
    target: 'https://eppo.cloud',
    changeOrigin: true,
    secure: false,
    onProxyReq: (proxyReq, req: Request, res: Response) => {
      // Log request body if needed
      console.log('Proxying Request:', req.method, req.url);
    },
    selfHandleResponse: true, // Allows us to handle the response
    onProxyRes: responseInterceptor(
      async (
        buffer: Buffer,
        proxyRes: http.IncomingMessage,
        req: http.IncomingMessage,
        res: http.ServerResponse,
      ) => {
        // Log the outgoing response
        console.log(`Response from target: ${proxyRes.statusCode} ${req.url}`);
        console.log('Response Headers:', proxyRes.headers);
        console.log('Response Body:', buffer.toString('utf8'));
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Eppo-Token',
        );
        return buffer;
      },
    ),
  }),
);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
