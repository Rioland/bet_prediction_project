/**
 * Firebase, for Google Analytics only.
 *
 * These values identify the project, they do not authorise anything: Firebase
 * web config is public by design and ships in every client bundle. Access is
 * controlled by the project's security rules, not by hiding this.
 *
 * Analytics is loaded lazily and only where it can work: it needs a browser
 * with cookies and IndexedDB, so it stays out of the initial bundle and is
 * skipped in development, where the events would only pollute the reports.
 */
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyAtI0xMyNWm8InN2XqWxTFnTaWXka4OdYY',
  authDomain: 'betting-7bed4.firebaseapp.com',
  projectId: 'betting-7bed4',
  storageBucket: 'betting-7bed4.firebasestorage.app',
  messagingSenderId: '438078233710',
  appId: '1:438078233710:web:3caaba9e394f485be5da7f',
  measurementId: 'G-199CWSH62V',
};

export const firebaseApp = initializeApp(firebaseConfig);

/**
 * Start Analytics if this browser supports it. Never throws: a blocked or
 * unsupported environment must not take the page down with it.
 */
export async function initAnalytics(): Promise<void> {
  if (!import.meta.env.PROD) return;

  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (await isSupported()) getAnalytics(firebaseApp);
  } catch {
    // An ad blocker or a privacy setting refused it; the site works regardless.
  }
}
