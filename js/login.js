import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAkg7ZFnBfbU0LVxfiraknwpzVgAAOu-Lc",
    authDomain: "cciarco-portal.firebaseapp.com",
    projectId: "cciarco-portal",
    storageBucket: "cciarco-portal.firebasestorage.app",
    messagingSenderId: "513140257536",
    appId: "1:513140257536:web:e8b7a6cdd57284054ff9e5",
    measurementId: "G-0J0T2WDJJQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistent login
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Persistence set to local storage.");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

// Login form submission
document.getElementById("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login successful!");
            window.location.href = "html/home.html"; // Redirect to home page
        })
        .catch((error) => {
            alert("Login failed: " + error.message);
        });
});
