document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const forgotPassword = document.getElementById("forgotPassword");
    const rememberMe = document.getElementById("rememberMe");
    const loginMessage = document.getElementById("loginMessage");


    /* =====================================================
       DEMO CASHIER ACCOUNT
    ===================================================== */

    const CASHIER_EMAIL = "cashier@cozycup.com";
    const CASHIER_PASSWORD = "cozy123";


    /* =====================================================
       SHOW / HIDE PASSWORD
    ===================================================== */

    if (togglePassword) {

        togglePassword.addEventListener("click", function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";
                togglePassword.textContent = "🙈";

            } else {

                passwordInput.type = "password";
                togglePassword.textContent = "👁";

            }

        });

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;


        /* =================================================
           CASHIER LOGIN
        ================================================= */

        if (
            email === CASHIER_EMAIL &&
            password === CASHIER_PASSWORD
        ) {

            localStorage.setItem(
                "cozyCupCashierLoggedIn",
                "true"
            );

            localStorage.setItem(
                "cozyCupCashierName",
                "COZY CUP Cashier"
            );

            localStorage.setItem(
                "cozyCupUserRole",
                "cashier"
            );


            showMessage(
                "Cashier login successful! Opening cashier dashboard...",
                "success"
            );


            setTimeout(function () {

                window.location.href = "cashier.html";

            }, 800);

            return;
        }


        /* =================================================
           NORMAL CUSTOMER LOGIN
        ================================================= */

        let users = [];

        try {

            users = JSON.parse(
                localStorage.getItem("cozyCupUsers")
            ) || [];

        } catch (error) {

            users = [];

        }


        const user = users.find(function (account) {

            return (
                account.email &&
                account.email.toLowerCase() === email &&
                account.password === password
            );

        });


        if (user) {

            localStorage.setItem(
                "cozyCupLoggedIn",
                "true"
            );

            localStorage.setItem(
                "cozyCupCurrentUser",
                JSON.stringify(user)
            );

            localStorage.setItem(
                "cozyCupUserRole",
                "customer"
            );


            if (rememberMe && rememberMe.checked) {

                localStorage.setItem(
                    "cozyCupRememberedEmail",
                    email
                );

            } else {

                localStorage.removeItem(
                    "cozyCupRememberedEmail"
                );

            }


            showMessage(
                "Login successful! Welcome to COZY CUP.",
                "success"
            );


            setTimeout(function () {

                window.location.href = "index.html";

            }, 800);


        } else {

            showMessage(
                "Invalid email or password.",
                "error"
            );

        }

    });


    /* =====================================================
       REMEMBER EMAIL
    ===================================================== */

    const rememberedEmail =
        localStorage.getItem("cozyCupRememberedEmail");


    if (rememberedEmail) {

        emailInput.value = rememberedEmail;

        if (rememberMe) {
            rememberMe.checked = true;
        }

    }


    /* =====================================================
       FORGOT PASSWORD
    ===================================================== */

    if (forgotPassword) {

        forgotPassword.addEventListener("click", function (event) {

            event.preventDefault();

            showMessage(
                "For this demo, please contact the COZY CUP administrator to reset your password.",
                "error"
            );

        });

    }


    /* =====================================================
       MESSAGE
    ===================================================== */

    function showMessage(message, type) {

        if (!loginMessage) return;

        loginMessage.textContent = message;

        loginMessage.className =
            "login-message " + type;

        loginMessage.style.display = "block";


        setTimeout(function () {

            loginMessage.style.display = "none";

        }, 4000);

    }

});