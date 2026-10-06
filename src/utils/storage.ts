import { Platform } from "react-native";

// In-memory fallback map if native storage module is unavailable (e.g., during web rendering or before native module init)
const memoryStorage = new Map<string, string>();

let SecureStore: any = null;
try {
  SecureStore = require("expo-secure-store");
} catch {
  // SecureStore not available
}

let AsyncStorage: any = null;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage")?.default || require("@react-native-async-storage/async-storage");
} catch {
  // AsyncStorage not available
}

/**
 * Universal Storage Helper for Expo & React Native (iOS, Android, Web)
 * Prevents "Native module is null" errors by gracefully falling back.
 */
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // 1. Try Expo SecureStore on Native platforms
      if (Platform.OS !== "web" && SecureStore?.getItemAsync) {
        return await SecureStore.getItemAsync(key);
      }

      // 2. Try AsyncStorage
      if (AsyncStorage?.getItem) {
        return await AsyncStorage.getItem(key);
      }

      // 3. Web localStorage fallback
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }

      // 4. Memory fallback
      return memoryStorage.get(key) || null;
    } catch (error) {
      console.warn(`[Storage] Read fallback for key '${key}':`, error);
      return memoryStorage.get(key) || null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      memoryStorage.set(key, value);

      // 1. Try Expo SecureStore on Native platforms
      if (Platform.OS !== "web" && SecureStore?.setItemAsync) {
        await SecureStore.setItemAsync(key, value);
        return;
      }

      // 2. Try AsyncStorage
      if (AsyncStorage?.setItem) {
        await AsyncStorage.setItem(key, value);
        return;
      }

      // 3. Web localStorage fallback
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      console.warn(`[Storage] Write fallback for key '${key}':`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      memoryStorage.delete(key);

      if (Platform.OS !== "web" && SecureStore?.deleteItemAsync) {
        await SecureStore.deleteItemAsync(key);
        return;
      }

      if (AsyncStorage?.removeItem) {
        await AsyncStorage.removeItem(key);
        return;
      }

      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (error) {
      console.warn(`[Storage] Remove fallback for key '${key}':`, error);
    }
  },
};

export default storage;
