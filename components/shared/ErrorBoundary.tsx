/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { JOB_COLORS, COMMON_STYLES } from '@/utils/jobUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class JobErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Animatable.View animation="fadeIn" style={styles.container}>
          <View style={styles.errorContent}>
            <Ionicons 
              name="warning-outline" 
              size={64} 
              color={JOB_COLORS.danger}
              style={styles.errorIcon}
            />
            
            <Text style={styles.errorTitle}>
              Something went wrong
            </Text>
            
            <Text style={styles.errorMessage}>
              An unexpected error occurred. The app may not work correctly until you refresh.
            </Text>

            {/* Show error details in development */}
            {__DEV__ && this.props.showDetails && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details:</Text>
                <Text style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={styles.errorDetailsTitle}>Component Stack:</Text>
                    <Text style={styles.errorDetailsText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                accessibilityLabel="Try again"
                accessibilityRole="button"
              >
                <Ionicons 
                  name="refresh" 
                  size={16} 
                  color={JOB_COLORS.background}
                  style={styles.buttonIcon}
                />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animatable.View>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for easier use
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  showDetails?: boolean;
}

export default function ErrorBoundary(props: ErrorBoundaryProps) {
  return <JobErrorBoundary {...props} />;
}

// Specialized error boundaries for different contexts
export function JobListErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.container}>
          <View style={styles.errorContent}>
            <Ionicons 
              name="briefcase-outline" 
              size={48} 
              color={JOB_COLORS.textMuted}
              style={styles.errorIcon}
            />
            <Text style={styles.errorTitle}>Unable to load jobs</Text>
            <Text style={styles.errorMessage}>
              There was a problem loading the job list. Please check your connection and try again.
            </Text>
          </View>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function NotificationErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.notificationError}>
          <Text style={styles.notificationErrorText}>
            Unable to load notifications
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function JobCardErrorBoundary({ 
  children, 
  jobId 
}: { 
  children: ReactNode;
  jobId?: string;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.warn(`Error in job card ${jobId}:`, error);
      }}
      fallback={
        <View style={styles.cardError}>
          <Ionicons 
            name="alert-circle-outline" 
            size={24} 
            color={JOB_COLORS.danger}
          />
          <Text style={styles.cardErrorText}>
            Unable to display job
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: COMMON_STYLES.spacing.xl,
    backgroundColor: JOB_COLORS.background,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorIcon: {
    marginBottom: COMMON_STYLES.spacing.lg,
  },
  errorTitle: {
    color: JOB_COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: COMMON_STYLES.spacing.md,
  },
  errorMessage: {
    color: JOB_COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: COMMON_STYLES.spacing.xl,
  },
  errorDetails: {
    backgroundColor: JOB_COLORS.surface,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.spacing.md,
    marginVertical: COMMON_STYLES.spacing.lg,
    maxHeight: 200,
    width: '100%',
  },
  errorDetailsTitle: {
    color: JOB_COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: COMMON_STYLES.spacing.sm,
  },
  errorDetailsText: {
    color: JOB_COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'monospace',
    marginBottom: COMMON_STYLES.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: JOB_COLORS.primary,
    paddingHorizontal: COMMON_STYLES.spacing.xl,
    paddingVertical: COMMON_STYLES.spacing.md,
    borderRadius: 12,
    minHeight: COMMON_STYLES.buttonHeight,
  },
  buttonIcon: {
    marginRight: COMMON_STYLES.spacing.sm,
  },
  retryButtonText: {
    color: JOB_COLORS.background,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Specialized error styles
  notificationError: {
    backgroundColor: `${JOB_COLORS.danger}20`,
    padding: COMMON_STYLES.spacing.sm,
    borderRadius: COMMON_STYLES.borderRadius,
    borderWidth: 1,
    borderColor: `${JOB_COLORS.danger}30`,
  },
  notificationErrorText: {
    color: JOB_COLORS.danger,
    fontSize: 12,
    textAlign: 'center',
  },
  cardError: {
    backgroundColor: JOB_COLORS.surface,
    borderRadius: COMMON_STYLES.borderRadius,
    padding: COMMON_STYLES.spacing.lg,
    marginBottom: COMMON_STYLES.spacing.md,
    borderWidth: 1,
    borderColor: `${JOB_COLORS.danger}30`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: COMMON_STYLES.spacing.sm,
  },
  cardErrorText: {
    color: JOB_COLORS.danger,
    fontSize: 14,
  },
});

// Export the class component as well for cases where it's needed
export { JobErrorBoundary };
