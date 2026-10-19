
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const togglePasswordButton = document.getElementById("togglePassword");
    const messageElement = document.getElementById("registerMessage");
    const submitButton = document.getElementById("registerButton");

    if (!form || !nameInput || !emailInput || !passwordInput ||
        !confirmPasswordInput || !messageElement || !submitButton) {
        console.error("Registration form elements are missing.");
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

    function setLoading(isLoading) {
        submitButton.disabled = isLoading;

        const label = submitButton.querySelector("span:first-child");

        if (label) {
            label.textContent = isLoading
                ? "Creating account..."
                : "Create account";
        }

        submitButton.setAttribute("aria-busy", String(isLoading));
    }

    if (togglePasswordButton) {
        togglePasswordButton.addEventListener("click", () => {
            const isPasswordHidden = passwordInput.type === "password";

            passwordInput.type = isPasswordHidden ? "text" : "password";
            confirmPasswordInput.type = isPasswordHidden ? "text" : "password";

            togglePasswordButton.textContent = isPasswordHidden
                ? "Hide"
                : "Show";

            togglePasswordButton.setAttribute(
                "aria-label",
                isPasswordHidden ? "Hide password" : "Show password"
            );

            togglePasswordButton.setAttribute(
                "aria-pressed",
                String(isPasswordHidden)
            );
        });
    }

    form.addEventListener("input", () => {
        if (messageElement.textContent) {
            clearMessage();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (name.length < 2) {
            showMessage("Please enter your full name.");
            nameInput.focus();
            return;
        }

        if (!emailInput.validity.valid || !email) {
            showMessage("Please enter a valid email address.");
            emailInput.focus();
            return;
        }

        if (password.length < 8) {
            showMessage("Your password must contain at least 8 characters.");
            passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            showMessage("The passwords do not match.");
            confirmPasswordInput.focus();
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false || result.error) {
                const errorMessage =
                    result.message ||
                    result.error ||
                    "Registration failed. Please check your details and try again.";

                showMessage(
                    typeof errorMessage === "string"
                        ? errorMessage
                        : "Registration failed. Please try again."
                );
                return;
            }

            if (result.success === true || response.ok) {
                showMessage(
                    "Account created successfully! Redirecting to login...",
                    "success"
                );

                form.reset();

                window.setTimeout(() => {
                    window.location.href = "/index.html";
                }, 1200);
            }
        } catch (error) {
            console.error("Registration request failed:", error);

            showMessage(
                "Unable to connect to the server. Check that the Flask backend is running and try again."
            );
        } finally {
            setLoading(false);
        }
    });
});
