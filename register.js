document.addEventListener("DOMContentLoaded", function () {

    const registerForm = document.getElementById("registerForm");

    const fullnameInput = document.getElementById("fullname");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const togglePassword =
        document.getElementById("togglePassword");

    const toggleConfirmPassword =
        document.getElementById("toggleConfirmPassword");

    const registerMessage =
        document.getElementById("registerMessage");


    /* =========================
       SHOW / HIDE PASSWORD
    ========================= */

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


    if (toggleConfirmPassword) {

        toggleConfirmPassword.addEventListener(
            "click",
            function () {

                if (confirmPasswordInput.type === "password") {
                    confirmPasswordInput.type = "text";
                    toggleConfirmPassword.textContent = "🙈";
                } else {
                    confirmPasswordInput.type = "password";
                    toggleConfirmPassword.textContent = "👁";
                }

            }
        );

    }


    /* =========================
       REGISTER
    ========================= */

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const fullname =
                    fullnameInput.value.trim();

                const email =
                    emailInput.value.trim().toLowerCase();

                const password =
                    passwordInput.value;

                const confirmPassword =
                    confirmPasswordInput.value;


                /* CHECK EMPTY */

                if (
                    fullname === "" ||
                    email === "" ||
                    password === "" ||
                    confirmPassword === ""
                ) {

                    showMessage(
                        "Please complete all fields."
                    );

                    return;
                }


                /* CHECK PASSWORD LENGTH */

                if (password.length < 6) {

                    showMessage(
                        "Password must be at least 6 characters."
                    );

                    return;
                }


                /* CHECK PASSWORD */

                if (password !== confirmPassword) {

                    showMessage(
                        "Passwords do not match."
                    );

                    return;
                }


                /* =========================
                   GET EXISTING USERS
                ========================= */

                let users = [];

                try {

                    const savedUsers =
                        localStorage.getItem("cozyCupUsers");

                    if (savedUsers) {

                        users =
                            JSON.parse(savedUsers);

                    }

                    if (!Array.isArray(users)) {
                        users = [];
                    }

                } catch (error) {

                    users = [];

                }


                /* =========================
                   CHECK DUPLICATE EMAIL
                ========================= */

                const emailExists =
                    users.some(function (user) {

                        return (
                            user &&
                            user.email &&
                            user.email.toLowerCase() === email
                        );

                    });


                if (emailExists) {

                    showMessage(
                        "This email is already registered."
                    );

                    return;
                }


                /* =========================
                   CREATE USER
                ========================= */

                const newUser = {
                    fullname: fullname,
                    email: email,
                    password: password
                };


                /* ADD USER */

                users.push(newUser);


                /* SAVE USERS */

                localStorage.setItem(
                    "cozyCupUsers",
                    JSON.stringify(users)
                );


                console.log(
                    "Registered users:",
                    users
                );


                /* SUCCESS */

                showMessage(
                    "Account created successfully!"
                );


                registerForm.reset();


                setTimeout(function () {

                    window.location.href =
                        "login.html";

                }, 1000);

            }
        );

    }


    /* =========================
       MESSAGE
    ========================= */

    function showMessage(message) {

        if (!registerMessage) {
            alert(message);
            return;
        }

        registerMessage.textContent =
            message;

        registerMessage.classList.add("show");

        setTimeout(function () {

            registerMessage.classList.remove("show");

        }, 3000);

    }

});