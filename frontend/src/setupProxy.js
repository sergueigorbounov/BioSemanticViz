const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Setting up proxy middleware - routing /api to backend server');
  
  // Try different target URLs in order of preference
  const targets = [
    'http://localhost:8002',
    'http://127.0.0.1:8002',
    'http://0.0.0.0:8002'
  ];
  
  // Use the first target by default
  const proxyTarget = targets[0];
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8003',
      changeOrigin: true,
      pathRewrite: { '^/api': '' }, // Remove /api prefix when forwarding to backend
      onProxyReq: (proxyReq, req, res) => {
        // Log request being proxied
        console.log(`Proxying ${req.method} request from ${req.headers.host} to: ${proxyTarget}${req.path.replace(/^\/api/, '')}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`Received ${proxyRes.statusCode} response for: ${req.path}`);
        
        // Add CORS headers to response
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        
        // Try next target on error
        for (let i = 1; i < targets.length; i++) {
          const fallbackTarget = targets[i];
          console.log(`Trying fallback target: ${fallbackTarget}`);
          
          // We can't change the proxy target dynamically, but we can show an error
          // with instructions for the next attempt
        }
        
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          message: 'Error connecting to API server. Please ensure the backend is running.',
          error: err.message
        }));
      }
    })
  );
}; 