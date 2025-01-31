module.exports = {
  apps: [
    {
      name: 'sfmc-frontend',
      cwd: '/home/ubuntu/Frontend/sfmc-studio-frontend',
      script: 'npm',
      args: 'run export',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
