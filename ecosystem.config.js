module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'image-server',
      script: 'imageServer.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'discord-bot',
      script: 'src/discord/bot.js',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
