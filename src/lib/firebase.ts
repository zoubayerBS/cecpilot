
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOgtAfsruZ2ONFuDAPqPbj7NNEG8UVbjc",
  authDomain: "cec-assistant.firebaseapp.com",
  projectId: "cec-assistant",
  storageBucket: "cec-assistant.appspot.com",
  messagingSenderId: "183953989195",
  appId: "1:183953989195:web:c34a43c7e7dfd76aae77ce"
};

// Initialize Firebase
function initializeClientApp(): FirebaseApp {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

const app = initializeClientApp();
const db = getFirestore(app);

export { app, db };
