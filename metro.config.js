const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure react-native-svg resolves to precompiled commonjs/module rather than TypeScript sources
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

module.exports = config;
