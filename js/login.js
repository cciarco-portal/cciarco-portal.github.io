import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "cciarco-portal.firebaseapp.com",
    projectId: "cciarco-portal",
    storageBucket: "cciarco-portal.firebasestorage.app",
    messagingSenderId: "513140257536",
    appId: "1:513140257536:web:e8b7a6cdd57284054ff9e5",
    measurementId: "G-0J0T2WDJJQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Email Login
document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!email.endsWith("@tangentsolutions.com")) {
        alert("Only @tangentsolutions.com emails are allowed.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login successful!", userCredential.user);
            window.location.href = "html/home.html";
        })
        .catch((error) => {
            alert("Login failed: " + error.message);
        });
});

// Google Login
document.getElementById("google-login").addEventListener("click", function () {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            const user = result.user;
            if (!user.email.endsWith("@tangentsolutionsin.com")) {
                alert("Only @tangentsolutionsin.com emails are allowed.");
                auth.signOut();
                return;
            }
            console.log("Google login successful!", user);
            window.location.href = "html/home.html";
        })
        .catch((error) => {
            alert("Google login failed: " + error.message);
        });
});
