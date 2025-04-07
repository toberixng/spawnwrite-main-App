// next.config.js
module.exports = {
    webpack(config) {
      config.cache = {
        type: 'filesystem',
        store: 'pack',
        maxMemoryGenerations: 1, // Reduce cached items
      };
      return config;
    },
  };