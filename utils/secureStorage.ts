import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Secure Storage Utility
 * Provides secure storage for sensitive data using Keychain (iOS) / Keystore (Android)
 * and AsyncStorage for non-sensitive data
 */

export interface SecureStorageOptions {
  service?: string;
  accessGroup?: string;
}

class SecureStorage {
  private readonly defaultService = 'SiaMoonPropertyManagement';
  private readonly obfuscationKey = 'SiaMoonPropertyManagement2025SecureKey';

  /**
   * Store sensitive data securely (platform-aware)
   */
  async setSecure(
    key: string,
    value: string,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web, use obfuscated AsyncStorage
        const obfuscatedValue = this.obfuscateValue(value);
        await AsyncStorage.setItem(`@secure_${key}`, obfuscatedValue);
        console.log(`🔐 Secure data stored for key: ${key} (web)`);
      } else {
        // For mobile, use Keychain/Keystore
        const Keychain = require('react-native-keychain');
        const service = options.service || this.defaultService;

        await Keychain.setInternetCredentials(
          service + '_' + key,
          key,
          value,
          {
            accessGroup: options.accessGroup,
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
            authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
          }
        );
        console.log(`🔐 Secure data stored for key: ${key} (mobile)`);
      }
    } catch (error) {
      console.error(`❌ Failed to store secure data for key ${key}:`, error);
      throw new Error(`Failed to store secure data: ${error}`);
    }
  }

  /**
   * Retrieve sensitive data (platform-aware)
   */
  async getSecure(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // For web, retrieve from obfuscated AsyncStorage
        const obfuscatedValue = await AsyncStorage.getItem(`@secure_${key}`);
        if (obfuscatedValue) {
          const value = this.deobfuscateValue(obfuscatedValue);
          console.log(`🔓 Secure data retrieved for key: ${key} (web)`);
          return value;
        }
        return null;
      } else {
        // For mobile, retrieve from Keychain/Keystore
        const Keychain = require('react-native-keychain');
        const service = options.service || this.defaultService;

        const credentials = await Keychain.getInternetCredentials(service + '_' + key);

        if (credentials && credentials.password) {
          console.log(`🔓 Secure data retrieved for key: ${key} (mobile)`);
          return credentials.password;
        }

        return null;
      }
    } catch (error) {
      console.error(`❌ Failed to retrieve secure data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove sensitive data (platform-aware)
   */
  async removeSecure(
    key: string,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // For web, remove from AsyncStorage
        await AsyncStorage.removeItem(`@secure_${key}`);
        console.log(`🗑️ Secure data removed for key: ${key} (web)`);
      } else {
        // For mobile, remove from Keychain/Keystore
        const Keychain = require('react-native-keychain');
        const service = options.service || this.defaultService;

        await Keychain.resetInternetCredentials(service + '_' + key);
        console.log(`🗑️ Secure data removed for key: ${key} (mobile)`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove secure data for key ${key}:`, error);
    }
  }

  /**
   * Store non-sensitive data in AsyncStorage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`💾 Data stored for key: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to store data for key ${key}:`, error);
      throw new Error(`Failed to store data: ${error}`);
    }
  }

  /**
   * Store object in AsyncStorage
   */
  async setObject(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`❌ Failed to store object for key ${key}:`, error);
      throw new Error(`Failed to store object: ${error}`);
    }
  }

  /**
   * Retrieve data from AsyncStorage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log(`📖 Data retrieved for key: ${key}`);
      }
      return value;
    } catch (error) {
      console.error(`❌ Failed to retrieve data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Retrieve object from AsyncStorage
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`❌ Failed to retrieve object for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Data removed for key: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to remove data for key ${key}:`, error);
    }
  }

  /**
   * Clear all data from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('🧹 All AsyncStorage data cleared');
    } catch (error) {
      console.error('❌ Failed to clear AsyncStorage:', error);
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log(`🔑 Retrieved ${keys.length} keys from AsyncStorage`);
      return keys;
    } catch (error) {
      console.error('❌ Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * Check if secure storage is available (platform-aware)
   */
  async isSecureStorageAvailable(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, check if localStorage/AsyncStorage is available
        return typeof Storage !== 'undefined';
      } else {
        // For mobile, check Keychain/Keystore availability
        const Keychain = require('react-native-keychain');
        const result = await Keychain.getSupportedBiometryType();
        return result !== null;
      }
    } catch (error) {
      console.warn('⚠️ Secure storage not available:', error);
      return false;
    }
  }

  /**
   * Get supported biometry type (mobile only)
   */
  async getSupportedBiometryType(): Promise<any | null> {
    try {
      if (Platform.OS === 'web') {
        return null; // Biometry not available on web
      } else {
        const Keychain = require('react-native-keychain');
        return await Keychain.getSupportedBiometryType();
      }
    } catch (error) {
      console.warn('⚠️ Failed to get biometry type:', error);
      return null;
    }
  }

  /**
   * Check if device has biometric authentication (mobile only)
   */
  async hasBiometricAuthentication(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false; // Biometry not available on web
      } else {
        const Keychain = require('react-native-keychain');
        const biometryType = await this.getSupportedBiometryType();
        return biometryType !== null && biometryType !== Keychain.BIOMETRY_TYPE.NONE;
      }
    } catch (error) {
      console.warn('⚠️ Failed to check biometric authentication:', error);
      return false;
    }
  }

  /**
   * Store authentication token securely
   */
  async storeAuthToken(token: string, userId: string): Promise<void> {
    try {
      await this.setSecure('auth_token', token);
      await this.setItem('@auth_user_id', userId);
      console.log('🎫 Authentication token stored securely');
    } catch (error) {
      console.error('❌ Failed to store auth token:', error);
      throw error;
    }
  }

  /**
   * Retrieve authentication token
   */
  async getAuthToken(): Promise<{ token: string; userId: string } | null> {
    try {
      const [token, userId] = await Promise.all([
        this.getSecure('auth_token'),
        this.getItem('@auth_user_id')
      ]);

      if (token && userId) {
        return { token, userId };
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to retrieve auth token:', error);
      return null;
    }
  }

  /**
   * Clear authentication data
   */
  async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        this.removeSecure('auth_token'),
        this.removeItem('@auth_user_id'),
        this.removeItem('@auth_session'),
        this.removeItem('@staff_auth_session'),
        this.removeItem('@login_attempts')
      ]);
      console.log('🧹 Authentication data cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
    }
  }

  /**
   * Obfuscate value for web storage (simple XOR-based obfuscation)
   */
  private obfuscateValue(value: string): string {
    let result = '';
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i) ^ this.obfuscationKey.charCodeAt(i % this.obfuscationKey.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode the result
  }

  /**
   * Deobfuscate value from web storage
   */
  private deobfuscateValue(obfuscatedValue: string): string {
    try {
      const decoded = atob(obfuscatedValue); // Base64 decode
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ this.obfuscationKey.charCodeAt(i % this.obfuscationKey.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    } catch (error) {
      console.error('❌ Failed to deobfuscate value:', error);
      return '';
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
export default secureStorage;
