/**
 * Job Assignment Validation and Safety Checks
 * Comprehensive validation system to prevent duplicate jobs and ensure data integrity
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  JobAssignmentRequest, 
  JobAssignmentValidation, 
  JobAssignment,
  StaffAvailability 
} from '@/types/jobAssignment';

export class JobAssignmentValidator {
  
  /**
   * Comprehensive validation of job assignment request
   */
  static async validateJobAssignment(request: JobAssignmentRequest): Promise<JobAssignmentValidation> {
    const validation: JobAssignmentValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      staffExists: false,
      propertyExists: false,
      bookingExists: false,
      staffAvailable: false,
      conflictingJobs: []
    };

    try {
      // Validate required fields
      await this.validateRequiredFields(request, validation);
      
      // Validate staff existence and status
      await this.validateStaffMember(request.staffId, validation);
      
      // Validate property existence (if applicable)
      await this.validateProperty(request.propertyId, validation);
      
      // Validate booking existence (if provided)
      if (request.bookingId) {
        await this.validateBooking(request.bookingId, validation);
      }
      
      // Check for scheduling conflicts
      await this.checkSchedulingConflicts(request, validation);
      
      // Validate staff availability and workload
      await this.validateStaffAvailability(request, validation);
      
      // Check for duplicate assignments
      await this.checkDuplicateAssignments(request, validation);
      
      // Validate business rules
      await this.validateBusinessRules(request, validation);
      
      // Set overall validity
      validation.isValid = validation.errors.length === 0;
      
    } catch (error) {
      console.error('❌ Error during job assignment validation:', error);
      validation.errors.push('Validation failed due to system error');
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Validate required fields
   */
  private static async validateRequiredFields(
    request: JobAssignmentRequest, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    const requiredFields = [
      'staffId',
      'title',
      'type',
      'scheduledFor',
      'assignedBy'
    ];

    for (const field of requiredFields) {
      if (!request[field as keyof JobAssignmentRequest]) {
        validation.errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field formats
    if (request.staffId && typeof request.staffId !== 'string') {
      validation.errors.push('staffId must be a string');
    }

    if (request.estimatedDuration && (request.estimatedDuration < 5 || request.estimatedDuration > 480)) {
      validation.warnings.push('Estimated duration should be between 5 minutes and 8 hours');
    }

    if (request.scheduledFor) {
      const scheduledDate = new Date(request.scheduledFor);
      const now = new Date();
      
      if (isNaN(scheduledDate.getTime())) {
        validation.errors.push('Invalid scheduledFor date format');
      } else if (scheduledDate < now) {
        validation.errors.push('Cannot schedule jobs in the past');
      } else if (scheduledDate > new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)) {
        validation.warnings.push('Job scheduled more than 90 days in advance');
      }
    }

    if (request.dueDate && request.scheduledFor) {
      const dueDate = new Date(request.dueDate);
      const scheduledDate = new Date(request.scheduledFor);
      
      if (dueDate < scheduledDate) {
        validation.errors.push('Due date cannot be before scheduled date');
      }
    }
  }

  /**
   * Validate staff member existence and status
   */
  private static async validateStaffMember(
    staffId: string, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    try {
      const staffDoc = await getDoc(doc(db, 'staff_accounts', staffId));
      validation.staffExists = staffDoc.exists();
      
      if (!validation.staffExists) {
        validation.errors.push(`Staff member not found: ${staffId}`);
        return;
      }

      const staffData = staffDoc.data();
      
      // Check if staff is active
      if (!staffData?.isActive) {
        validation.errors.push('Staff member is not active');
      }

      // Check if staff has required role
      const allowedRoles = ['staff', 'cleaner', 'maintenance', 'manager', 'admin'];
      if (!allowedRoles.includes(staffData?.role)) {
        validation.errors.push(`Staff member role '${staffData?.role}' is not allowed for job assignments`);
      }

      // Check if staff account is locked
      if (staffData?.lockedUntil && new Date(staffData.lockedUntil) > new Date()) {
        validation.errors.push('Staff account is temporarily locked');
      }

    } catch (error) {
      console.error('❌ Error validating staff member:', error);
      validation.errors.push('Failed to validate staff member');
    }
  }

  /**
   * Validate property existence
   */
  private static async validateProperty(
    propertyId: string, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    try {
      // For now, assume property exists
      // In a real implementation, you would check your properties collection
      validation.propertyExists = true;
      
      // Example validation:
      // const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      // validation.propertyExists = propertyDoc.exists();
      
      if (!validation.propertyExists) {
        validation.errors.push(`Property not found: ${propertyId}`);
      }
    } catch (error) {
      console.error('❌ Error validating property:', error);
      validation.warnings.push('Could not validate property existence');
    }
  }

  /**
   * Validate booking existence
   */
  private static async validateBooking(
    bookingId: string, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    try {
      // For now, assume booking exists if provided
      // In a real implementation, you would check your bookings collection
      validation.bookingExists = true;
      
      // Example validation:
      // const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      // validation.bookingExists = bookingDoc.exists();
      
      if (!validation.bookingExists) {
        validation.warnings.push(`Booking not found: ${bookingId}`);
      }
    } catch (error) {
      console.error('❌ Error validating booking:', error);
      validation.warnings.push('Could not validate booking existence');
    }
  }

  /**
   * Check for scheduling conflicts
   */
  private static async checkSchedulingConflicts(
    request: JobAssignmentRequest, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    try {
      const scheduledDate = new Date(request.scheduledFor);
      const estimatedDuration = request.estimatedDuration || 60;
      
      // Calculate job time window
      const jobStart = scheduledDate;
      const jobEnd = new Date(scheduledDate.getTime() + estimatedDuration * 60 * 1000);
      
      // Query for existing jobs for this staff member
      const conflictQuery = query(
        collection(db, 'job_assignments'),
        where('staffId', '==', request.staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      );
      
      const conflictSnapshot = await getDocs(conflictQuery);
      
      conflictSnapshot.forEach((doc) => {
        const job = doc.data() as JobAssignment;
        const existingStart = job.scheduledFor.toDate();
        const existingDuration = job.estimatedDuration || 60;
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60 * 1000);
        
        // Check for time overlap
        if (
          (jobStart >= existingStart && jobStart < existingEnd) ||
          (jobEnd > existingStart && jobEnd <= existingEnd) ||
          (jobStart <= existingStart && jobEnd >= existingEnd)
        ) {
          validation.conflictingJobs.push(doc.id);
          validation.warnings.push(
            `Time conflict with existing job: ${job.title} (${existingStart.toLocaleString()})`
          );
        }
      });
      
      // Staff is available if no critical conflicts
      validation.staffAvailable = validation.conflictingJobs.length === 0;
      
    } catch (error) {
      console.error('❌ Error checking scheduling conflicts:', error);
      validation.warnings.push('Could not check for scheduling conflicts');
    }
  }

  /**
   * Validate staff availability and workload
   */
  private static async validateStaffAvailability(
    request: JobAssignmentRequest, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    try {
      const scheduledDate = new Date(request.scheduledFor);
      const dayStart = new Date(scheduledDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(scheduledDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Count jobs for the same day
      const dayJobsQuery = query(
        collection(db, 'job_assignments'),
        where('staffId', '==', request.staffId),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      );
      
      const dayJobsSnapshot = await getDocs(dayJobsQuery);
      let jobsOnSameDay = 0;
      let totalDurationOnDay = 0;
      
      dayJobsSnapshot.forEach((doc) => {
        const job = doc.data() as JobAssignment;
        const jobDate = job.scheduledFor.toDate();
        
        if (jobDate >= dayStart && jobDate <= dayEnd) {
          jobsOnSameDay++;
          totalDurationOnDay += job.estimatedDuration || 60;
        }
      });
      
      // Add current job to totals
      totalDurationOnDay += request.estimatedDuration || 60;
      
      // Check workload limits
      const maxJobsPerDay = 8; // Configurable limit
      const maxHoursPerDay = 10 * 60; // 10 hours in minutes
      
      if (jobsOnSameDay >= maxJobsPerDay) {
        validation.warnings.push(`Staff already has ${jobsOnSameDay} jobs on this day (max: ${maxJobsPerDay})`);
      }
      
      if (totalDurationOnDay > maxHoursPerDay) {
        validation.warnings.push(
          `Total work time would exceed ${maxHoursPerDay / 60} hours (${totalDurationOnDay / 60} hours)`
        );
      }
      
    } catch (error) {
      console.error('❌ Error validating staff availability:', error);
      validation.warnings.push('Could not validate staff availability');
    }
  }

  /**
   * Check for duplicate assignments
   */
  private static async checkDuplicateAssignments(
    request: JobAssignmentRequest, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    try {
      // Check for exact duplicates (same staff, property, type, and day)
      const scheduledDate = new Date(request.scheduledFor);
      const dayStart = new Date(scheduledDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(scheduledDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const duplicateQuery = query(
        collection(db, 'job_assignments'),
        where('staffId', '==', request.staffId),
        where('propertyId', '==', request.propertyId),
        where('type', '==', request.type),
        where('status', 'in', ['assigned', 'accepted', 'in_progress'])
      );
      
      const duplicateSnapshot = await getDocs(duplicateQuery);
      
      duplicateSnapshot.forEach((doc) => {
        const job = doc.data() as JobAssignment;
        const jobDate = job.scheduledFor.toDate();
        
        if (jobDate >= dayStart && jobDate <= dayEnd) {
          validation.warnings.push(
            `Similar job already exists: ${job.title} (${job.type}) on the same day`
          );
        }
      });
      
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      validation.warnings.push('Could not check for duplicate assignments');
    }
  }

  /**
   * Validate business rules
   */
  private static async validateBusinessRules(
    request: JobAssignmentRequest, 
    validation: JobAssignmentValidation
  ): Promise<void> {
    // Check if job is scheduled during business hours
    const scheduledDate = new Date(request.scheduledFor);
    const hour = scheduledDate.getHours();
    const dayOfWeek = scheduledDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Business hours: 6 AM to 10 PM, Monday to Sunday
    if (hour < 6 || hour > 22) {
      validation.warnings.push('Job scheduled outside normal business hours (6 AM - 10 PM)');
    }
    
    // Check for holidays or special dates (you would implement this based on your business needs)
    // Example: Check if it's a major holiday
    const holidays = ['2024-12-25', '2024-01-01']; // Christmas, New Year
    const dateString = scheduledDate.toISOString().split('T')[0];
    
    if (holidays.includes(dateString)) {
      validation.warnings.push('Job scheduled on a holiday');
    }
    
    // Validate job type and priority combination
    if (request.type === 'emergency' && request.priority !== 'urgent') {
      validation.warnings.push('Emergency jobs should typically have urgent priority');
    }
    
    // Validate estimated duration for job type
    const typeDurationLimits = {
      cleaning: { min: 30, max: 240 },
      maintenance: { min: 15, max: 480 },
      inspection: { min: 15, max: 120 },
      setup: { min: 30, max: 180 },
      checkout: { min: 15, max: 60 },
      emergency: { min: 15, max: 480 },
      delivery: { min: 10, max: 60 },
      other: { min: 15, max: 480 }
    };
    
    const limits = typeDurationLimits[request.type];
    if (limits && request.estimatedDuration) {
      if (request.estimatedDuration < limits.min) {
        validation.warnings.push(
          `Estimated duration (${request.estimatedDuration} min) is unusually short for ${request.type} jobs`
        );
      }
      if (request.estimatedDuration > limits.max) {
        validation.warnings.push(
          `Estimated duration (${request.estimatedDuration} min) is unusually long for ${request.type} jobs`
        );
      }
    }
  }

  /**
   * Quick validation for critical fields only
   */
  static async quickValidate(request: JobAssignmentRequest): Promise<boolean> {
    try {
      // Check required fields
      if (!request.staffId || !request.title || !request.type || !request.scheduledFor) {
        return false;
      }
      
      // Check if staff exists
      const staffDoc = await getDoc(doc(db, 'staff_accounts', request.staffId));
      if (!staffDoc.exists()) {
        return false;
      }
      
      // Check if staff is active
      const staffData = staffDoc.data();
      if (!staffData?.isActive) {
        return false;
      }
      
      // Check if scheduled date is valid
      const scheduledDate = new Date(request.scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error in quick validation:', error);
      return false;
    }
  }

  /**
   * Sanitize job assignment request
   */
  static sanitizeRequest(request: JobAssignmentRequest): JobAssignmentRequest {
    return {
      ...request,
      title: request.title?.trim(),
      description: request.description?.trim(),
      staffId: request.staffId?.trim(),
      propertyId: request.propertyId?.trim(),
      bookingId: request.bookingId?.trim(),
      assignedBy: request.assignedBy?.trim(),
      estimatedDuration: Math.max(5, Math.min(480, request.estimatedDuration || 60)),
      priority: request.priority || 'medium',
      requirements: request.requirements?.map(req => ({
        ...req,
        description: req.description?.trim()
      })) || []
    };
  }
}

export default JobAssignmentValidator;
