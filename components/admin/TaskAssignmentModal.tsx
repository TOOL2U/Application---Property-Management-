import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  X,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react-native';
import { useDesignTokens } from '@/constants/Design';
import { Booking, Staff, Task } from '@/types/admin';
import { AdminService } from '@/services/adminService';

interface TaskAssignmentModalProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onAssign: (taskData: any) => Promise<void>;
}

export default function TaskAssignmentModal({
  visible,
  booking,
  onClose,
  onAssign,
}: TaskAssignmentModalProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState<Task['type']>('cleaning');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState(new Date());
  const [estimatedDuration, setEstimatedDuration] = useState('120');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { Colors, Typography, Spacing, BorderRadius, Shadows, colors } = useDesignTokens();

  useEffect(() => {
    if (visible) {
      loadStaff();
      resetForm();
    }
  }, [visible]);

  const loadStaff = async () => {
    try {
      const staffData = await AdminService.getStaff();
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
      Alert.alert('Error', 'Failed to load staff members');
    }
  };

  const resetForm = () => {
    setSelectedStaff([]);
    setTaskTitle(booking ? `Prepare ${booking.propertyName} for ${booking.guestName}` : '');
    setTaskDescription(booking ? `Prepare property for check-in on ${booking.checkIn.toLocaleDateString()}` : '');
    setTaskType('cleaning');
    setPriority('medium');
    setDueDate(booking ? new Date(booking.checkIn.getTime() - 24 * 60 * 60 * 1000) : new Date());
    setEstimatedDuration('120');
    setNotes('');
  };

  const handleAssign = async () => {
    if (!booking) return;

    if (selectedStaff.length === 0) {
      Alert.alert('Error', 'Please select at least one staff member');
      return;
    }

    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      await onAssign({
        bookingId: booking.id,
        staffIds: selectedStaff,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        type: taskType,
        priority,
        dueDate,
        estimatedDuration: parseInt(estimatedDuration) || 120,
        notes: notes.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Error assigning task:', error);
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
    },
    modalContent: {
      padding: Spacing[6],
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing[6],
    },
    title: {
      ...Typography.sizes['2xl'],
      ...Typography.styles.heading,
      color: colors.text.primary,
      flex: 1,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollView: {
      maxHeight: 400,
    },
    section: {
      marginBottom: Spacing[5],
    },
    sectionTitle: {
      ...Typography.sizes.lg,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: Spacing[3],
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: BorderRadius.md,
      padding: Spacing[4],
      ...Typography.sizes.base,
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    staffList: {
      gap: Spacing[2],
    },
    staffItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing[3],
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    staffItemSelected: {
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      borderColor: colors.primary,
    },
    staffInfo: {
      flex: 1,
      marginLeft: Spacing[3],
    },
    staffName: {
      ...Typography.sizes.base,
      fontWeight: '600',
      color: colors.text.primary,
    },
    staffRole: {
      ...Typography.sizes.sm,
      color: colors.text.secondary,
      marginTop: Spacing[1],
    },
    checkIcon: {
      marginLeft: Spacing[2],
    },
    typeSelector: {
      flexDirection: 'row',
      gap: Spacing[2],
      flexWrap: 'wrap',
    },
    typeButton: {
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[2],
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    typeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      ...Typography.sizes.base,
      color: colors.text.secondary,
    },
    typeButtonTextSelected: {
      color: colors.text.inverse,
      fontWeight: '600',
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing[3],
      marginTop: Spacing[6],
    },
    button: {
      flex: 1,
      height: 48,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    assignButton: {
      overflow: 'hidden',
    },
    buttonText: {
      ...Typography.sizes.base,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text.secondary,
    },
    assignButtonText: {
      color: colors.text.inverse,
    },
  });

  if (!booking) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <BlurView intensity={24} style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Assign Task</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Task Details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Task title"
                  placeholderTextColor={colors.text.secondary}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />
                <View style={{ height: Spacing[3] }} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Task description"
                  placeholderTextColor={colors.text.secondary}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Task Type</Text>
                <View style={styles.typeSelector}>
                  {(['cleaning', 'maintenance', 'concierge', 'inspection'] as Task['type'][]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeButton, taskType === type && styles.typeButtonSelected]}
                      onPress={() => setTaskType(type)}
                    >
                      <Text style={[styles.typeButtonText, taskType === type && styles.typeButtonTextSelected]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Priority</Text>
                <View style={styles.typeSelector}>
                  {(['low', 'medium', 'high', 'urgent'] as Task['priority'][]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.typeButton, priority === p && styles.typeButtonSelected]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.typeButtonText, priority === p && styles.typeButtonTextSelected]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assign to Staff</Text>
                <View style={styles.staffList}>
                  {staff.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.staffItem,
                        selectedStaff.includes(member.id) && styles.staffItemSelected,
                      ]}
                      onPress={() => toggleStaffSelection(member.id)}
                    >
                      <User size={20} color={colors.text.secondary} />
                      <View style={styles.staffInfo}>
                        <Text style={styles.staffName}>{member.name}</Text>
                        <Text style={styles.staffRole}>{member.role}</Text>
                      </View>
                      {selectedStaff.includes(member.id) && (
                        <CheckCircle2 size={20} color={colors.primary} style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Any additional notes or instructions..."
                  placeholderTextColor={colors.text.secondary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.assignButton]}
                onPress={handleAssign}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark || colors.primary]}
                  style={styles.button}
                >
                  <Text style={[styles.buttonText, styles.assignButtonText]}>
                    {loading ? 'Assigning...' : 'Assign Task'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Modal>
  );
}
