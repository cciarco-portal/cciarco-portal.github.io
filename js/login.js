import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Firebase Config (Replace with your actual config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
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

document.getElementById("loginBtn").addEventListener("click", function () {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("User logged in:", userCredential.user); // Debugging
            sessionStorage.setItem("userLoggedIn", "true");
            window.location.href = "html/home.html"; // Redirect to home
        })
        .catch(error => {
            console.error("Login failed:", error);
            alert("Login failed: " + error.message);
        });
});

// Debugging: Check if user is detected on load
onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user);
});
