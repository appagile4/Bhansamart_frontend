/**
 * Safe Polyfills for Native Modules in Development & Expo Go environments.
 * Prevents "Cannot find native module 'ExpoTopicSubscriptionModule'" crashes
 * when running under Expo Go or runtimes lacking recently added native modules.
 */
if (typeof globalThis !== "undefined") {
  const g = globalThis as any;
  if (!g.expo) {
    g.expo = { modules: {} };
  } else if (!g.expo.modules) {
    g.expo.modules = {};
  }

  const missingModules: Record<string, Record<string, any>> = {
    ExpoTopicSubscriptionModule: {
      subscribeToTopicAsync: async () => null,
      unsubscribeFromTopicAsync: async () => null,
      addListener: () => {},
      removeListeners: () => {},
    },
    ExpoBackgroundNotificationTasksModule: {
      registerTaskAsync: async () => null,
      unregisterTaskAsync: async () => null,
      addListener: () => {},
      removeListeners: () => {},
    },
  };

  for (const [modName, modStub] of Object.entries(missingModules)) {
    if (!g.expo.modules[modName]) {
      g.expo.modules[modName] = modStub;
    }
  }
}

export {};
