import { initializeApp, ServiceAccount } from 'firebase-admin/app';
import firebaseConfig from './serviceAccountKey.json';
import { apps, credential } from 'firebase-admin';

export const initFirebaseApp = () => {
  if (!apps.length) {
    initializeApp({
      credential: credential.cert(firebaseConfig as ServiceAccount),
      databaseURL: 'https://ct553-7dfab.firebaseio.com',
    });
    console.log('Firebase App initialized successfully');
  } else {
    console.log('Firebase App already initialized');
  }
};
