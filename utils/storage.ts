import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export class Storage {
  /**
   * Store a string value
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`✅ Storage: Stored item with key: ${key}`);
    } catch (error) {
      console.error(`❌ Storage: Failed to store item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieve a string value
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`🔍 Storage: Retrieved item with key: ${key}, exists: ${!!value}`);
      return value;
    } catch (error) {
      console.error(`❌ Storage: Failed to retrieve item with key: ${key}`, error);
      return null;
    }
  }

  /**
   * Store an object (automatically serialized to JSON)
   */
  static async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
      console.log(`✅ Storage: Stored object with key: ${key}`);
    } catch (error) {
      console.error(`❌ Storage: Failed to store object with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Retrieve an object (automatically deserialized from JSON)
   */
  static async getObject<T>(key: string): Promise<T | null> {
    try {
      const serializedValue = await AsyncStorage.getItem(key);
      if (serializedValue === null) {
        console.log(`🔍 Storage: No object found with key: ${key}`);
        return null;
      }
      
      const value = JSON.parse(serializedValue) as T;
      console.log(`✅ Storage: Retrieved object with key: ${key}`);
      return value;
    } catch (error) {
      console.error(`❌ Storage: Failed to retrieve object with key: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove an item
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Storage: Removed item with key: ${key}`);
    } catch (error) {
      console.error(`❌ Storage: Failed to remove item with key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Clear all stored data
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('🧹 Storage: Cleared all stored data');
    } catch (error) {
      console.error('❌ Storage: Failed to clear all data', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log(`🔑 Storage: Retrieved ${keys.length} keys`);
      return keys;
    } catch (error) {
      console.error('❌ Storage: Failed to get all keys', error);
      return [];
    }
  }

  /**
   * Get multiple items
   */
  static async getMultiple(keys: string[]): Promise<[string, string | null][]> {
    try {
      const items = await AsyncStorage.multiGet(keys);
      console.log(`📦 Storage: Retrieved ${items.length} items`);
      return items;
    } catch (error) {
      console.error('❌ Storage: Failed to get multiple items', error);
      return [];
    }
  }

  /**
   * Set multiple items
   */
  static async setMultiple(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
      console.log(`📦 Storage: Stored ${keyValuePairs.length} items`);
    } catch (error) {
      console.error('❌ Storage: Failed to set multiple items', error);
      throw error;
    }
  }

  /**
   * Remove multiple items
   */
  static async removeMultiple(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      console.log(`🗑️ Storage: Removed ${keys.length} items`);
    } catch (error) {
      console.error('❌ Storage: Failed to remove multiple items', error);
      throw error;
    }
  }

  /**
   * Get storage type information
   */
  static getStorageType(): string {
    return Platform.OS === 'web' ? 'localStorage' : 'AsyncStorage';
  }

  /**
   * Check if a key exists
   */
  static async hasKey(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`❌ Storage: Failed to check key existence: ${key}`, error);
      return false;
    }
  }

  /**
   * Get storage size information (approximate)
   */
  static async getStorageSize(): Promise<{ keys: number; estimatedSize: string }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      
      let totalSize = 0;
      items.forEach(([key, value]) => {
        totalSize += key.length + (value?.length || 0);
      });

      return {
        keys: keys.length,
        estimatedSize: `${(totalSize / 1024).toFixed(2)} KB`
      };
    } catch (error) {
      console.error('❌ Storage: Failed to get storage size', error);
      return { keys: 0, estimatedSize: '0 KB' };
    }
  }
}

export default Storage;
