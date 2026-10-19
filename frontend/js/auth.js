
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const messageElement = document.getElementById("loginMessage");
    const submitButton = document.getElementById("loginButton");
    const togglePasswordButton = document.getElementById("togglePassword");

    if (!form || !emailInput || !passwordInput || !messageElement || !submitButton) {
        console.error("Data Link AI: Login form elements are missing.");
        return;
    }

    function showMessage(message, type = "error") {
        messageElement.textContent = message;
        messageElement.style.display = "block";

        if (type === "success") {
            messageElement.style.color = "#75e6b0";
            messageElement.style.borderColor = "rgba(117, 230, 176, 0.25)";
            messageElement.style.background = "rgba(117, 230, 176, 0.06)";
        } else {
            messageElement.style.color = "#ff7f91";
            messageElement.style.borderColor = "rgba(255, 127, 145, 0.2)";
            messageElement.style.background = "rgba(255, 127, 145, 0.06)";
        }
    }

    function clearMessage() {
        messageElement.textContent = "";
        messageElement.style.display = "none";
    }

    function setLoading(loading) {
        submitButton.disabled = loading;
        submitButton.setAttribute("aria-busy", String(loading));

        const label = submitButton.querySelector("span:first-child");

        if (label) {
            label.textContent = loading ? "Signing in..." : "Sign in";
        }
    }

    if (togglePasswordButton) {
        togglePasswordButton.addEventListener("click", () => {
            const showPassword = passwordInput.type === "password";

            passwordInput.type = showPassword ? "text" : "password";
            togglePasswordButton.textContent = showPassword ? "Hide" : "Show";
            togglePasswordButton.setAttribute(
                "aria-label",
                showPassword ? "Hide password" : "Show password"
            );
            togglePasswordButton.setAttribute(
                "aria-pressed",
                String(showPassword)
            );
        });
    }

    form.addEventListener("input", clearMessage);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !emailInput.validity.valid) {
            showMessage("Please enter a valid email address.");
            emailInput.focus();
            return;
        }

        if (!password) {
            showMessage("Please enter your password.");
            passwordInput.focus();
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({ email, password })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success !== true) {
                showMessage(
                    result.message ||
                    result.error ||
                    "Login failed. Check your email and password."
                );
                return;
            }

            // Retain user information if the backend returns it.
            // The backend remains responsible for authentication.
            if (result.user) {
                try {
                    localStorage.setItem("user", JSON.stringify(result.user));

                    if (result.user.id !== undefined) {
                        localStorage.setItem("user_id", String(result.user.id));
                    }

                    if (result.user.name) {
                        localStorage.setItem("user_name", result.user.name);
                    }

                    if (result.user.email) {
                        localStorage.setItem("user_email", result.user.email);
                    }
                } catch (storageError) {
                    console.warn("Could not save optional user details.", storageError);
                }
            }

            showMessage("Login successful. Opening your workspace...", "success");

            window.setTimeout(() => {
                window.location.href = "/dashboard.html";
            }, 500);

        } catch (error) {
            console.error("Login request failed:", error);

            showMessage(
                "Cannot connect to Data Link AI. Make sure the Flask server is running."
            );
        } finally {
            setLoading(false);
        }
    });
});
