const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure react-native-svg resolves to precompiled commonjs/module rather than TypeScript sources
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// On Web/SSR, alias native-only react-native-maps to a web-safe stub component to prevent codegenNativeComponent crash
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return {
      filePath: path.resolve(__dirname, "src/components/MapMock.web.tsx"),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
