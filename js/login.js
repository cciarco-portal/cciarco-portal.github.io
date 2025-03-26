import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAkg7ZFnBfbU0LVxfiraknwpzVgAAOu-Lc",
    authDomain: "cciarco-portal.firebaseapp.com",
    projectId: "cciarco-portal",
    storageBucket: "cciarco-portal.firebasestorage.app",
    messagingSenderId: "513140257536",
    appId: "1:513140257536:web:e8b7a6cdd57284054ff9e5",
    measurementId: "G-0J0T2WDJJQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Function to check approval status
async function checkApproval(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: user.email,
            approved: false // Default is false, admin must approve
        });
        alert("Your account is pending admin approval.");
        await signOut(auth);
        return false;
    }

    if (!userSnap.data().approved) {
        alert("Your account is still pending approval.");
        await signOut(auth);
        return false;
    }

    return true;
}

// Email/Password Login
document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!email.endsWith("@tangentsolutions.com")) {
        alert("Only @tangentsolutions.com emails are allowed.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (await checkApproval(user)) {
            window.location.href = "html/home.html";
        }
    } catch (error) {
        alert("Login failed: " + error.message);
    }
});

// Google Login
document.getElementById("google-login").addEventListener("click", async function () {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        if (!user.email.endsWith("@tangentsolutions.com")) {
            alert("Only @tangentsolutions.com emails are allowed.");
            await signOut(auth);
            return;
        }

        if (await checkApproval(user)) {
            window.location.href = "html/home.html";
        }
    } catch (error) {
        alert("Google login failed: " + error.message);
    }
});
