import { Platform } from 'react-native';

// Mock Firebase services for development
const createMockAuth = () => ({
  currentUser: null,
  onAuthStateChanged: (callback: (user: any) => void) => {
    // Simulate no user logged in
    callback(null);
    return () => {}; // unsubscribe function
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    console.log('Mock sign in:', email);
    return { user: { uid: 'mock-user-id', email } };
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    console.log('Mock create user:', email);
    return { user: { uid: 'mock-user-id', email } };
  },
  signOut: async () => {
    console.log('Mock sign out');
  }
});

const createMockFirestore = () => ({
  collection: (path: string) => ({
    doc: (id?: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async (data: any) => console.log('Mock set:', path, id, data),
      update: async (data: any) => console.log('Mock update:', path, id, data),
      delete: async () => console.log('Mock delete:', path, id),
      onSnapshot: (callback: (doc: any) => void) => {
        callback({ exists: false, data: () => null });
        return () => {}; // unsubscribe
      }
    }),
    add: async (data: any) => {
      console.log('Mock add:', path, data);
      return { id: 'mock-doc-id' };
    },
    where: () => ({
      get: async () => ({ docs: [], forEach: () => {} }),
      onSnapshot: (callback: (snapshot: any) => void) => {
        callback({ docs: [], forEach: () => {} });
        return () => {}; // unsubscribe
      }
    }),
    orderBy: () => ({
      get: async () => ({ docs: [], forEach: () => {} }),
      onSnapshot: (callback: (snapshot: any) => void) => {
        callback({ docs: [], forEach: () => {} });
        return () => {}; // unsubscribe
      }
    })
  })
});

const createMockStorage = () => ({
  ref: (path: string) => ({
    put: async (file: any) => {
      console.log('Mock storage upload:', path);
      return { ref: { getDownloadURL: async () => 'mock-download-url' } };
    },
    getDownloadURL: async () => 'mock-download-url',
    delete: async () => console.log('Mock storage delete:', path)
  })
});

// Export mock services
export const auth = createMockAuth();
export const db = createMockFirestore();
export const storage = createMockStorage();

// Mock app object
const app = {
  name: 'mock-app',
  options: {}
};

export default app;
