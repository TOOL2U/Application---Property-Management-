/**
 * Start Job Button Component
 * Simple button that triggers the comprehensive job start workflow
 */

import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { Play, Loader2 } from 'lucide-react-native';
import { JobData } from '@/types/jobData';
import JobStartWorkflow from './JobStartWorkflow';
import { useStaffJobWorkflow } from '@/hooks/useStaffJobWorkflow';

interface StartJobButtonProps {
  job: JobData;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onJobStarted?: () => void;
}

export default function StartJobButton({
  job,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onJobStarted,
}: StartJobButtonProps) {
  const {
    isStartingJob,
    isWorkflowVisible,
    selectedJob,
    error,
    showStartWorkflow,
    hideStartWorkflow,
    handleJobStarted,
    clearError,
  } = useStaffJobWorkflow();

  const handlePress = () => {
    if (disabled || isStartingJob) return;
    showStartWorkflow(job);
  };

  const handleWorkflowComplete = async (jobSession: any) => {
    await handleJobStarted(jobSession);
    if (onJobStarted) {
      onJobStarted();
    }
  };

  const getButtonStyle = (): ViewStyle[] => {
    const styles_to_apply: ViewStyle[] = [styles.button];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        styles_to_apply.push(styles.primaryButton);
        break;
      case 'secondary':
        styles_to_apply.push(styles.secondaryButton);
        break;
      case 'minimal':
        styles_to_apply.push(styles.minimalButton);
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        styles_to_apply.push(styles.smallButton);
        break;
      case 'medium':
        styles_to_apply.push(styles.mediumButton);
        break;
      case 'large':
        styles_to_apply.push(styles.largeButton);
        break;
    }
    
    // Disabled state
    if (disabled || isStartingJob) {
      styles_to_apply.push(styles.disabledButton);
    }
    
    return styles_to_apply;
  };

  const getTextStyle = (): TextStyle[] => {
    const styles_to_apply: TextStyle[] = [styles.buttonText];
    
    switch (variant) {
      case 'primary':
        styles_to_apply.push(styles.primaryButtonText);
        break;
      case 'secondary':
        styles_to_apply.push(styles.secondaryButtonText);
        break;
      case 'minimal':
        styles_to_apply.push(styles.minimalButtonText);
        break;
    }
    
    switch (size) {
      case 'small':
        styles_to_apply.push(styles.smallButtonText);
        break;
      case 'medium':
        styles_to_apply.push(styles.mediumButtonText);
        break;
      case 'large':
        styles_to_apply.push(styles.largeButtonText);
        break;
    }
    
    if (disabled || isStartingJob) {
      styles_to_apply.push(styles.disabledButtonText);
    }
    
    return styles_to_apply;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getIconColor = () => {
    if (disabled || isStartingJob) {
      return '#9ca3af';
    }
    
    switch (variant) {
      case 'primary':
        return '#ffffff';
      case 'secondary':
        return '#3b82f6';
      case 'minimal':
        return '#3b82f6';
      default:
        return '#ffffff';
    }
  };

  return (
    <>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        disabled={disabled || isStartingJob}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          {isStartingJob ? (
            <Loader2 
              size={getIconSize()} 
              color={getIconColor()} 
              style={styles.spinningIcon} 
            />
          ) : (
            <Play size={getIconSize()} color={getIconColor()} />
          )}
          <Text style={getTextStyle()}>
            {isStartingJob ? 'Starting...' : 'Start Job'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Job Start Workflow Modal */}
      {selectedJob && (
        <JobStartWorkflow
          job={selectedJob}
          visible={isWorkflowVisible}
          onClose={hideStartWorkflow}
          onJobStarted={handleWorkflowComplete}
          enableGPSTracking={true}
          enableChecklist={true}
          enablePhotoUpload={true}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Variant styles
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  minimalButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  // Size styles
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  
  // Disabled state
  disabledButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Button content
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Text styles
  buttonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Variant text styles
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
  minimalButtonText: {
    color: '#3b82f6',
  },
  
  // Size text styles
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
  
  // Disabled text
  disabledButtonText: {
    color: '#9ca3af',
  },
  
  // Icon styles
  spinningIcon: {
    // You could add rotation animation here if needed
  },
});
