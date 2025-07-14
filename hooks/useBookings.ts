import { useState, useEffect, useCallback } from 'react';
import { apiService, Booking, Task } from '../services/apiService';

interface BookingsState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

interface BookingsActions {
  fetchBookings: (filters?: {
    status?: string;
    date?: string;
    propertyId?: string;
  }) => Promise<void>;
  fetchBooking: (id: string) => Promise<void>;
  updateBookingStatus: (
    id: string,
    status: Booking['status'],
    notes?: string
  ) => Promise<boolean>;
  updateTaskStatus: (
    taskId: string,
    status: Task['status'],
    notes?: string
  ) => Promise<boolean>;
  refreshBookings: () => Promise<void>;
  clearError: () => void;
}

export function useBookings(): BookingsState & BookingsActions {
  const [state, setState] = useState<BookingsState>({
    bookings: [],
    currentBooking: null,
    isLoading: false,
    error: null,
  });

  const fetchBookings = useCallback(async (filters?: {
    status?: string;
    date?: string;
    propertyId?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.getBookings(filters);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          bookings: response.data!,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch bookings',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings',
        isLoading: false,
      }));
    }
  }, []);

  const fetchBooking = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.getBooking(id);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          currentBooking: response.data!,
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to fetch booking',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch booking',
        isLoading: false,
      }));
    }
  }, []);

  const updateBookingStatus = useCallback(async (
    id: string,
    status: Booking['status'],
    notes?: string
  ): Promise<boolean> => {
    try {
      const response = await apiService.updateBookingStatus(id, status, notes);
      
      if (response.success && response.data) {
        // Update the booking in the local state
        setState(prev => ({
          ...prev,
          bookings: prev.bookings.map(booking =>
            booking.id === id ? response.data! : booking
          ),
          currentBooking: prev.currentBooking?.id === id ? response.data! : prev.currentBooking,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to update booking status',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update booking status',
      }));
      return false;
    }
  }, []);

  const updateTaskStatus = useCallback(async (
    taskId: string,
    status: Task['status'],
    notes?: string
  ): Promise<boolean> => {
    try {
      const response = await apiService.updateTaskStatus(taskId, status, notes);
      
      if (response.success && response.data) {
        // Update the task in the local state
        setState(prev => ({
          ...prev,
          bookings: prev.bookings.map(booking => ({
            ...booking,
            tasks: booking.tasks.map(task =>
              task.id === taskId ? response.data! : task
            ),
          })),
          currentBooking: prev.currentBooking ? {
            ...prev.currentBooking,
            tasks: prev.currentBooking.tasks.map(task =>
              task.id === taskId ? response.data! : task
            ),
          } : null,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to update task status',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update task status',
      }));
      return false;
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-fetch bookings on mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    ...state,
    fetchBookings,
    fetchBooking,
    updateBookingStatus,
    updateTaskStatus,
    refreshBookings,
    clearError,
  };
}

export default useBookings;
