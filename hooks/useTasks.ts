import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task } from '@/types';

// Mock data for demo purposes
const mockTasks: Task[] = [
  {
    id: '1',
    staffId: 'demo-user-123',
    propertyId: 'prop-1',
    propertyName: 'Sunset Apartments - Unit 204',
    propertyAddress: '123 Sunset Blvd, Los Angeles, CA 90028',
    clientName: 'Sarah Johnson',
    clientPhone: '+1 (555) 987-6543',
    taskType: 'cleaning',
    status: 'not_started',
    priority: 'medium',
    scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    estimatedDuration: 90,
    description: 'Deep cleaning after tenant move-out. Focus on kitchen and bathrooms.',
    coordinates: {
      latitude: 34.0928,
      longitude: -118.3287,
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    staffId: 'demo-user-123',
    propertyId: 'prop-2',
    propertyName: 'Downtown Loft - Unit 15B',
    propertyAddress: '456 Spring St, Los Angeles, CA 90013',
    clientName: 'Michael Chen',
    clientPhone: '+1 (555) 456-7890',
    taskType: 'inspection',
    status: 'in_progress',
    priority: 'high',
    scheduledDate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    estimatedDuration: 60,
    description: 'Pre-lease inspection for new tenant. Check all appliances and fixtures.',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437,
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    staffId: 'demo-user-123',
    propertyId: 'prop-3',
    propertyName: 'Beverly Hills Condo - Unit 8A',
    propertyAddress: '789 Rodeo Dr, Beverly Hills, CA 90210',
    taskType: 'maintenance',
    status: 'completed',
    priority: 'low',
    scheduledDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    estimatedDuration: 45,
    description: 'Fix leaky faucet in master bathroom.',
    coordinates: {
      latitude: 34.0736,
      longitude: -118.4004,
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '4',
    staffId: 'demo-user-123',
    propertyId: 'prop-4',
    propertyName: 'Hollywood Hills House',
    propertyAddress: '321 Mulholland Dr, Los Angeles, CA 90046',
    clientName: 'Emma Rodriguez',
    clientPhone: '+1 (555) 234-5678',
    taskType: 'showing',
    status: 'not_started',
    priority: 'medium',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    estimatedDuration: 30,
    description: 'Property showing for potential tenant. Highlight the view and updated kitchen.',
    coordinates: {
      latitude: 34.1184,
      longitude: -118.3570,
    },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: '5',
    staffId: 'demo-user-123',
    propertyId: 'prop-5',
    propertyName: 'Santa Monica Beach Apartment',
    propertyAddress: '555 Ocean Ave, Santa Monica, CA 90401',
    clientName: 'David Kim',
    clientPhone: '+1 (555) 345-6789',
    taskType: 'checkout',
    status: 'not_started',
    priority: 'high',
    scheduledDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    estimatedDuration: 120,
    description: 'Tenant checkout inspection. Document any damages and collect keys.',
    coordinates: {
      latitude: 34.0195,
      longitude: -118.4912,
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
];

export function useTasks(staffId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId) {
      setLoading(false);
      return;
    }

    // For demo purposes, use mock data
    const filteredMockTasks = mockTasks.filter(task => task.staffId === staffId);
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      setTasks(filteredMockTasks);
      setLoading(false);
      setError(null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [staffId]);

  return { tasks, loading, error };
}
