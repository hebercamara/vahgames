import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
