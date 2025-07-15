import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, Staff, Task, TaskAssignment, COLLECTIONS } from '@/types/admin';

export class AdminService {
  // Booking Management
  static async getBookings(): Promise<Booking[]> {
    try {
      const bookingsQuery = query(
        collection(db, COLLECTIONS.BOOKINGS),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(bookingsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: doc.data().checkIn?.toDate() || new Date(),
        checkOut: doc.data().checkOut?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate(),
      })) as Booking[];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  static async approveBooking(bookingId: string, adminId: string): Promise<void> {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(bookingRef, {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error approving booking:', error);
      throw error;
    }
  }

  static async rejectBooking(bookingId: string, adminId: string, reason?: string): Promise<void> {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const updateData: any = {
        status: 'rejected',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (reason) {
        updateData.rejectionReason = reason;
      }
      
      await updateDoc(bookingRef, updateData);
    } catch (error) {
      console.error('Error rejecting booking:', error);
      throw error;
    }
  }

  // Staff Management
  static async getStaff(): Promise<Staff[]> {
    try {
      const staffQuery = query(
        collection(db, COLLECTIONS.STAFF),
        where('isActive', '==', true),
        orderBy('name')
      );
      const snapshot = await getDocs(staffQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Staff[];
    } catch (error) {
      console.error('Error fetching staff:', error);
      throw error;
    }
  }

  static async getStaffById(staffId: string): Promise<Staff | null> {
    try {
      const staffDoc = await getDoc(doc(db, COLLECTIONS.STAFF, staffId));
      if (staffDoc.exists()) {
        return {
          id: staffDoc.id,
          ...staffDoc.data(),
          createdAt: staffDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: staffDoc.data().updatedAt?.toDate() || new Date(),
        } as Staff;
      }
      return null;
    } catch (error) {
      console.error('Error fetching staff by ID:', error);
      throw error;
    }
  }

  // Task Management
  static async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async assignTaskToStaff(
    bookingId: string,
    staffIds: string[],
    assignedBy: string,
    taskData: {
      title: string;
      description: string;
      type: Task['type'];
      priority: Task['priority'];
      dueDate: Date;
      estimatedDuration: number;
      notes?: string;
    }
  ): Promise<string> {
    try {
      // Create the task
      const taskId = await this.createTask({
        bookingId,
        assignedTo: staffIds,
        assignedBy,
        status: 'assigned',
        ...taskData,
      });

      // Create task assignment record
      await addDoc(collection(db, COLLECTIONS.TASK_ASSIGNMENTS), {
        taskId,
        staffIds,
        assignedBy,
        assignedAt: new Date(),
        notes: taskData.notes,
      });

      return taskId;
    } catch (error) {
      console.error('Error assigning task to staff:', error);
      throw error;
    }
  }

  static async getTasksForBooking(bookingId: string): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, COLLECTIONS.TASKS),
        where('bookingId', '==', bookingId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tasksQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks for booking:', error);
      throw error;
    }
  }

  static async getTasksForStaff(staffId: string): Promise<Task[]> {
    try {
      const tasksQuery = query(
        collection(db, COLLECTIONS.TASKS),
        where('assignedTo', 'array-contains', staffId),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(tasksQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Task[];
    } catch (error) {
      console.error('Error fetching tasks for staff:', error);
      throw error;
    }
  }

  static async updateTaskStatus(taskId: string, status: Task['status'], completionNotes?: string): Promise<void> {
    try {
      const taskRef = doc(db, COLLECTIONS.TASKS, taskId);
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'completed') {
        updateData.completedAt = new Date();
        if (completionNotes) {
          updateData.completionNotes = completionNotes;
        }
      }

      await updateDoc(taskRef, updateData);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Real-time listeners
  static subscribeToBookings(callback: (bookings: Booking[]) => void): () => void {
    const bookingsQuery = query(
      collection(db, COLLECTIONS.BOOKINGS),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(bookingsQuery, (snapshot) => {
      const bookings: Booking[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: doc.data().checkIn?.toDate() || new Date(),
        checkOut: doc.data().checkOut?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate(),
      })) as Booking[];
      
      callback(bookings);
    });
  }

  static subscribeToStaffTasks(staffId: string, callback: (tasks: Task[]) => void): () => void {
    const tasksQuery = query(
      collection(db, COLLECTIONS.TASKS),
      where('assignedTo', 'array-contains', staffId),
      orderBy('dueDate', 'asc')
    );

    return onSnapshot(tasksQuery, (snapshot) => {
      const tasks: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Task[];
      
      callback(tasks);
    });
  }
}
