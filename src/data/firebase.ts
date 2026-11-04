import {getApps} from '@react-native-firebase/app';
import {getFirestore, collection, doc} from '@react-native-firebase/firestore';

export const firebaseConfigured = () => getApps().some(app => app.name === '[DEFAULT]');
export const database = () => getFirestore();
export const userCollection = (uid: string, name: string) => collection(database(), 'users', uid, name);
export const userDocument = (uid: string, name: string, id: string) => doc(userCollection(uid, name), id);
export const profileDocument = (uid: string) => doc(database(), 'users', uid);
export const newId = (uid: string) => doc(userCollection(uid, 'operations')).id;
