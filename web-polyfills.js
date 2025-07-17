// Web polyfill for AsyncStorage
if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
  // We're in a web environment
  const AsyncStorage = {
    async setItem(key: string, value: string): Promise<void> {
      try {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async getItem(key: string): Promise<string | null> {
      try {
        const value = window.localStorage.getItem(key);
        return Promise.resolve(value);
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async removeItem(key: string): Promise<void> {
      try {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async clear(): Promise<void> {
      try {
        window.localStorage.clear();
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async getAllKeys(): Promise<string[]> {
      try {
        const keys = Object.keys(window.localStorage);
        return Promise.resolve(keys);
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async multiGet(keys: string[]): Promise<[string, string | null][]> {
      try {
        const pairs = keys.map(key => [key, window.localStorage.getItem(key)] as [string, string | null]);
        return Promise.resolve(pairs);
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async multiSet(keyValuePairs: [string, string][]): Promise<void> {
      try {
        keyValuePairs.forEach(([key, value]) => {
          window.localStorage.setItem(key, value);
        });
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    },

    async multiRemove(keys: string[]): Promise<void> {
      try {
        keys.forEach(key => {
          window.localStorage.removeItem(key);
        });
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    }
  };

  // Export for CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AsyncStorage;
  }

  // Export for ES6 modules
  if (typeof window !== 'undefined') {
    (window as any).AsyncStorage = AsyncStorage;
  }
}
