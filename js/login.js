import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Firebase Config
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
const googleProvider = new GoogleAuthProvider();

// 🔑 Email/Password Login (Only @tangentsolutions.com)
document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Check if email is from @tangentsolutions.com
    if (!email.endsWith("@tangentsolutionsinc.com")) {
        alert("Only @tangentsolutionsinc.com emails are allowed.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login successful!", userCredential.user);
            window.location.href = "html/home.html"; // Redirect after login
        })
        .catch((error) => {
            console.error(error);
            alert("Login failed: " + error.message);
        });
});

// 🔥 Google Login (Only @tangentsolutionsinc.com)
document.getElementById("google-login").addEventListener("click", function () {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            const user = result.user;
            if (!user.email.endsWith("@tangentsolutionsinc.com")) {
                alert("Only @tangentsolutionsinc.com emails are allowed.");
                auth.signOut(); // Logout unauthorized users
                return;
            }
            console.log("Google login successful!", user);
            window.location.href = "html/home.html"; // Redirect
        })
        .catch((error) => {
            console.error(error);
            alert("Google login failed: " + error.message);
        });
});
