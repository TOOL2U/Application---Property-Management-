/**
 * Firebase Debug Screen Component
 * Add this to your app for easy Firebase debugging
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Share
} from 'react-native';
import FirebaseJobDebugger from '../firebase-job-debugger';

export const FirebaseDebugScreen: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string>('');

  // Capture console.log output
  const originalConsoleLog = console.log;
  
  const captureConsoleOutput = () => {
    let output = '';
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      output += message + '\n';
      originalConsoleLog(...args);
    };
    return () => {
      console.log = originalConsoleLog;
      return output;
    };
  };

  const runDebugSuite = async () => {
    setIsRunning(true);
    setDebugOutput('');
    
    try {
      // Start capturing console output
      const stopCapture = captureConsoleOutput();
      
      // Run the debug suite
      await FirebaseJobDebugger.runCompleteDebug();
      
      // Get the captured output
      const output = stopCapture();
      setDebugOutput(output);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugOutput(`Debug suite failed: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getQuickSummary = async () => {
    try {
      const summary = await FirebaseJobDebugger.getDebugSummary();
      const summaryText = JSON.stringify(summary, null, 2);
      
      Alert.alert(
        'Debug Summary',
        summaryText,
        [
          { text: 'Copy', onPress: () => Share.share({ message: summaryText }) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to get summary: ${errorMessage}`);
    }
  };

  const shareDebugOutput = () => {
    if (debugOutput) {
      Share.share({
        message: debugOutput,
        title: 'Firebase Debug Output'
      });
    } else {
      Alert.alert('No Output', 'Run the debug suite first to generate output.');
    }
  };

  const clearOutput = () => {
    setDebugOutput('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Debug Tools</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runDebugSuite}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Debug...' : 'Run Full Debug Suite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={getQuickSummary}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>Get Quick Summary</Text>
        </TouchableOpacity>
      </View>

      {debugOutput ? (
        <View style={styles.outputContainer}>
          <View style={styles.outputHeader}>
            <Text style={styles.outputTitle}>Debug Output</Text>
            <View style={styles.outputActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={shareDebugOutput}
              >
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={clearOutput}
              >
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            style={styles.outputScroll}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.outputText}>{debugOutput}</Text>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Run the debug suite to see Firebase connection and job query results.
          </Text>
          <Text style={styles.instructionText}>
            This will help identify issues with:
            {'\n'}• Firebase authentication
            {'\n'}• Job collection access
            {'\n'}• User-specific queries
            {'\n'}• Real-time listeners
            {'\n'}• Security rules
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  outputContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  outputTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  outputActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    marginLeft: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  outputScroll: {
    flex: 1,
    padding: 15,
  },
  outputText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#333',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'left',
    lineHeight: 20,
  },
});

export default FirebaseDebugScreen;
