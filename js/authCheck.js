import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("You must log in first!");
        window.location.href = "../index.html"; // Redirect to login page
    }
});
