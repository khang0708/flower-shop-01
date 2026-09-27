// PM2 process config — giữ Node server chạy dài hạn, tự restart khi crash/reboot VPS.
// Dùng: pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'flora-bloom-api',
      script: 'server/server.js',
      cwd: '/var/www/flora-bloom-shop',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
