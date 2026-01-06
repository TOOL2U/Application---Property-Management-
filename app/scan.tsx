import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert(
      'QR Code Scanned',
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => setScanned(false),
        },
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  if (hasPermission === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{ alignItems: 'center' }}
            >
              <Ionicons name="camera-outline" size={64} color="#C6FF00" />
              <Text style={{ 
                color: '#F1F1F1', 
                fontSize: 18, 
                fontWeight: '600', 
                marginTop: 16,
                fontFamily: 'Inter_600SemiBold'
              }}>
                Requesting Camera Permission
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 32 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="camera-outline" size={64} color="#ef4444" />
            <Text style={{ 
              color: '#F1F1F1', 
              fontSize: 20, 
              fontWeight: 'bold', 
              marginTop: 16, 
              textAlign: 'center',
              fontFamily: 'Inter_700Bold'
            }}>
              Camera Access Denied
            </Text>
            <Text style={{ 
              color: '#9CA3AF', 
              fontSize: 16, 
              marginTop: 8, 
              textAlign: 'center',
              fontFamily: 'Inter_400Regular'
            }}>
              Please enable camera permissions in your device settings to use the QR scanner.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(198, 255, 0, 0.2)',
              }}
              onPress={() => Alert.alert('Settings', 'Please go to Settings > Privacy > Camera to enable permissions.')}
            >
              <Text style={{ 
                fontWeight: '600', 
                color: '#C6FF00',
                fontFamily: 'Inter_600SemiBold'
              }}>
                Open Settings
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F1A" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View 
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
        >
          <Text style={{ 
            color: '#F1F1F1', 
            fontSize: 24, 
            fontWeight: 'bold',
            fontFamily: 'Urbanist_700Bold'
          }}>
            QR Scanner
          </Text>
          <Text style={{ 
            color: '#9CA3AF', 
            fontSize: 16, 
            marginTop: 4,
            fontFamily: 'Inter_400Regular'
          }}>
            Point your camera at a QR code to scan
          </Text>
        </View>

        {/* Camera View */}
        <View 
          style={{ 
            flex: 1, 
            marginHorizontal: 16, 
            marginBottom: 16, 
            borderRadius: 16, 
            overflow: 'hidden',
            backgroundColor: '#1C1F2A',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            flash={flashOn ? 'on' : 'off'}
          >
            {/* Scanning Overlay */}
            <View style={styles.overlay}>
              {/* Scanning Frame */}
              <View style={styles.scanFrame}>
                <View
                  style={styles.scanLine}
                />
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  Align QR code within the frame
                </Text>
              </View>

              {/* Flash Toggle */}
              <TouchableOpacity
                style={styles.flashButton}
                onPress={toggleFlash}
              >
                <LinearGradient
                  colors={flashOn ? ['#C6FF00', '#A3E635'] : ['rgba(28, 31, 42, 0.8)', 'rgba(17, 24, 39, 0.6)']}
                  style={styles.flashButtonGradient}
                >
                  <Ionicons
                    name={flashOn ? 'flash' : 'flash-off'}
                    size={24}
                    color={flashOn ? '#0B0F1A' : '#C6FF00'}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>

        {/* Bottom Actions */}
        <View 
          style={{ paddingHorizontal: 16, paddingBottom: 16 }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#1C1F2A',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              opacity: scanned ? 1 : 0.5,
              borderWidth: 1,
              borderColor: '#374151',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
            onPress={() => setScanned(false)}
            disabled={!scanned}
          >
            <Text style={{ 
              color: '#F1F1F1', 
              fontWeight: '600',
              fontFamily: 'Inter_600SemiBold'
            }}>
              {scanned ? 'Tap to Scan Again' : 'Ready to Scan'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: '#C6FF00',
    borderRadius: 20,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#C6FF00',
    shadowColor: '#C6FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#F1F1F1',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(11, 15, 26, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    fontFamily: 'Inter_500Medium',
  },
  flashButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  flashButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
