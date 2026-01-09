import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DebugTouch() {
  const [tapCount, setTapCount] = useState(0);

  const handleTap = () => {
    setTapCount(prev => prev + 1);
    Alert.alert('Touch Works!', `Tap count: ${tapCount + 1}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>
          Touch Debug Screen
        </Text>
        
        <TouchableOpacity
          onPress={handleTap}
          style={{
            backgroundColor: '#00ff00',
            padding: 20,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: 'black', fontSize: 18, textAlign: 'center' }}>
            TAP ME - Count: {tapCount}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 1000, backgroundColor: '#333', marginTop: 20 }}>
          <Text style={{ color: 'white', padding: 20 }}>
            Scroll test area - this should be scrollable if touch is working
          </Text>
          {Array.from({ length: 50 }, (_, i) => (
            <Text key={i} style={{ color: 'white', padding: 10 }}>
              Scroll item {i + 1}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
