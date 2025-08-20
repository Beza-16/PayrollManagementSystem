const { override, overrideDevServer } = require('customize-cra');

const devServerConfig = () => (config) => {
  // Replace deprecated onBeforeSetupMiddleware and onAfterSetupMiddleware with setupMiddlewares
  config.setupMiddlewares = (middlewares, devServer) => {
    // No custom middleware needed for now; return default middlewares
    return middlewares;
  };
  return config;
};

module.exports = {
  webpack: override(
    (config) => {
      // Modify the source-map-loader rule to ignore react-datepicker
      const sourceMapLoader = config.module.rules.find(rule =>
        rule.loader && rule.loader.includes('source-map-loader')
      );
      if (sourceMapLoader) {
        // Ensure exclude is an array before spreading
        sourceMapLoader.exclude = [
          /node_modules\/react-datepicker/,
          ...(Array.isArray(sourceMapLoader.exclude) ? sourceMapLoader.exclude : [])
        ];
      }
      return config;
    }
  ),
  devServer: overrideDevServer(devServerConfig())
};