import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export const getFirebaseAdminAuth = (projectId) => {
  const resolvedProjectId =
    projectId || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (!resolvedProjectId) {
    throw new Error("Firebase project ID is required for Google authentication");
  }

  const appName = `firebase-admin-${resolvedProjectId}`;
  const firebaseAdminApp =
    getApps().find((app) => app.name === appName) ||
    initializeApp({ projectId: resolvedProjectId }, appName);

  return getAuth(firebaseAdminApp);
};