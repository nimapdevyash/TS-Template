module.exports = {
  apps: [
    {
      name: "websocket-app",
      script: "./dist/index.js", // Points to the compiled JS
      instances: "max",          // Scale to all CPU cores (Cluster Mode)
      exec_mode: "cluster",
      watch: false,              // Don't watch files in production
      max_memory_restart: "1G",  // Restart if it leaks memory
      env_production: {
        NODE_ENV: "production",
        PORT: 8080
      }
    }
  ]
};