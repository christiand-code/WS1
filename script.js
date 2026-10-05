document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       COZY CUP MAIN JAVASCRIPT
    ===================================================== */


    /* =====================================================
       CURRENT USER
    ===================================================== */

    let currentUser = null;

    try {
        const savedUser = localStorage.getItem("cozyCupCurrentUser");

        if (savedUser) {
            currentUser = JSON.parse(savedUser);
        }

    } catch (error) {
        console.error("Error loading current user:", error);
        currentUser = null;
    }

    const currentEmail =
        currentUser && currentUser.email
            ? String(currentUser.email).toLowerCase()
            : "guest";

    const userKey =
        currentEmail.replace(/[^a-zA-Z0-9]/g, "_");


    /* =====================================================
       STORAGE
    ===================================================== */

    const CART_KEY =
        "cozyCupCart_" + userKey;

    const DARK_MODE_KEY =
        "cozyCupDarkMode_" + userKey;

    const ORDERS_KEY =
        "cozyCupOrders_" + userKey;

    const CUSTOMIZATION_KEY =
        "cozyCupCustomization_" + userKey;


    /* =====================================================
       INDEXEDDB DATABASE
       COZY CUP DATABASE
    ===================================================== */

    const DB_NAME = "CozyCupDatabase";
    const DB_VERSION = 1;
    const ORDER_STORE = "orders";


    /* =====================================================
       OPEN DATABASE
    ===================================================== */

    function openCozyCupDatabase() {

        return new Promise(function (resolve, reject) {

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );


            request.onupgradeneeded =
                function (event) {

                    const db =
                        event.target.result;


                    if (!db.objectStoreNames.contains(ORDER_STORE)) {

                        const orderStore =
                            db.createObjectStore(
                                ORDER_STORE,
                                {
                                    keyPath: "id",
                                    autoIncrement: true
                                }
                            );


                        orderStore.createIndex(
                            "orderNumber",
                            "orderNumber",
                            {
                                unique: true
                            }
                        );


                        orderStore.createIndex(
                            "status",
                            "status",
                            {
                                unique: false
                            }
                        );


                        orderStore.createIndex(
                            "createdAt",
                            "createdAt",
                            {
                                unique: false
                            }
                        );

                    }

                };


            request.onsuccess =
                function (event) {

                    resolve(
                        event.target.result
                    );

                };


            request.onerror =
                function (event) {

                    console.error(
                        "IndexedDB error:",
                        event.target.error
                    );

                    reject(
                        event.target.error
                    );

                };

        });

    }


    /* =====================================================
       SAVE ORDER TO DATABASE
    ===================================================== */

    async function saveOrderToDatabase(order) {

        try {

            const db =
                await openCozyCupDatabase();


            return new Promise(
                function (resolve, reject) {

                    const transaction =
                        db.transaction(
                            ORDER_STORE,
                            "readwrite"
                        );


                    const store =
                        transaction.objectStore(
                            ORDER_STORE
                        );


                    const request =
                        store.add(order);


                    request.onsuccess =
                        function () {

                            order.id =
                                request.result;

                            resolve(order);

                        };


                    request.onerror =
                        function (event) {

                            console.error(
                                "Could not save order:",
                                event.target.error
                            );

                            reject(
                                event.target.error
                            );

                        };

                }
            );

        } catch (error) {

            console.error(
                "Database error:",
                error
            );

            throw error;

        }

    }


    /* =====================================================
       GET ALL ORDERS
       USED BY CASHIER
    ===================================================== */

    async function getAllOrders() {

        try {

            const db =
                await openCozyCupDatabase();


            return new Promise(
                function (resolve, reject) {

                    const transaction =
                        db.transaction(
                            ORDER_STORE,
                            "readonly"
                        );


                    const store =
                        transaction.objectStore(
                            ORDER_STORE
                        );


                    const request =
                        store.getAll();


                    request.onsuccess =
                        function () {

                            resolve(
                                request.result || []
                            );

                        };


                    request.onerror =
                        function (event) {

                            reject(
                                event.target.error
                            );

                        };

                }
            );

        } catch (error) {

            console.error(
                "Could not get orders:",
                error
            );

            return [];

        }

    }


    /* =====================================================
       UPDATE ORDER STATUS
    ===================================================== */

    async function updateOrderStatus(
        orderId,
        newStatus
    ) {

        try {

            const db =
                await openCozyCupDatabase();


            return new Promise(
                function (resolve, reject) {

                    const transaction =
                        db.transaction(
                            ORDER_STORE,
                            "readwrite"
                        );


                    const store =
                        transaction.objectStore(
                            ORDER_STORE
                        );


                    const request =
                        store.get(orderId);


                    request.onsuccess =
                        function () {

                            const order =
                                request.result;


                            if (!order) {

                                reject(
                                    new Error(
                                        "Order not found."
                                    )
                                );

                                return;

                            }


                            order.status =
                                newStatus;

                            order.updatedAt =
                                new Date().toISOString();


                            const updateRequest =
                                store.put(order);


                            updateRequest.onsuccess =
                                function () {

                                    resolve(order);

                                };


                            updateRequest.onerror =
                                function (event) {

                                    reject(
                                        event.target.error
                                    );

                                };

                        };


                    request.onerror =
                        function (event) {

                            reject(
                                event.target.error
                            );

                        };

                }
            );

        } catch (error) {

            console.error(
                "Could not update order:",
                error
            );

            throw error;

        }

    }


    /* =====================================================
       GENERATE ORDER NUMBER
    ===================================================== */

    function generateOrderNumber() {

        const date =
            new Date();


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        const random =
            Math.floor(
                1000 +
                Math.random() * 9000
            );


        return (
            "CC-" +
            year +
            month +
            day +
            "-" +
            random
        );

    }


    /* =====================================================
       CREATE DATABASE ORDER
    ===================================================== */

    async function createCustomerOrder(
        customerName,
        customerPhone,
        orderType,
        paymentMethod,
        notes,
        cartItems,
        total
    ) {

        const order = {

            orderNumber:
                generateOrderNumber(),

            customerName:
                customerName,

            customerPhone:
                customerPhone,

            orderType:
                orderType,

            paymentMethod:
                paymentMethod,

            notes:
                notes || "",

            items:
                cartItems.map(function (item) {

                    return {
                        id: item.id,
                        name: item.name,
                        image: item.image || "",
                        basePrice:
                            Number(item.basePrice) || 0,
                        price:
                            Number(item.price) || 0,
                        quantity:
                            Number(item.quantity) || 1,
                        customization:
                            item.customization || null
                    };

                }),

            total:
                Number(total) || 0,

            status:
                "Pending",

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };


        return await saveOrderToDatabase(
            order
        );

    }


    /* =====================================================
       INITIALIZE DATABASE
    ===================================================== */

    openCozyCupDatabase()
        .then(function () {

            console.log(
                "Cozy Cup database ready."
            );

        })
        .catch(function (error) {

            console.error(
                "Database initialization failed:",
                error
            );

        });


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const darkModeButton =
        document.getElementById(
            "darkModeToggle"
        );

    const cartButton =
        document.getElementById(
            "cartButton"
        );

    const cartModal =
        document.getElementById(
            "cartModal"
        );

    const closeCartButton =
        document.getElementById(
            "closeCart"
        );

    const cartItems =
        document.getElementById(
            "cartItems"
        );

    const cartCount =
        document.getElementById(
            "cartCount"
        );

    const cartTotal =
        document.getElementById(
            "cartTotal"
        );

    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );

    const checkoutModal =
        document.getElementById(
            "checkoutModal"
        );

    const closeCheckoutButton =
        document.getElementById(
            "closeCheckout"
        );

    const checkoutForm =
        document.getElementById(
            "checkoutForm"
        );

    const toast =
        document.getElementById(
            "toast"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    const searchInput =
        document.getElementById(
            "menuSearch"
        );


    /* =====================================================
       CART
    ===================================================== */

    let cart = [];


    try {

        const savedCart =
            localStorage.getItem(
                CART_KEY
            );


        if (savedCart) {

            const parsedCart =
                JSON.parse(savedCart);


            if (Array.isArray(parsedCart)) {

                cart = parsedCart;

            }

        }

    } catch (error) {

        console.error(
            "Error loading cart:",
            error
        );

        cart = [];

    }


    /* =====================================================
       CART ID
    ===================================================== */

    function createCartId() {

        return (
            Date.now().toString() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 9)
        );

    }


    /* =====================================================
       FIX OLD CART DATA
    ===================================================== */

    cart = cart.map(function (item) {

        return {

            id:
                item.id ||
                createCartId(),

            name:
                item.name ||
                "Coffee",

            image:
                item.image ||
                "",

            basePrice:
                Number(item.basePrice) ||
                Number(item.price) ||
                0,

            price:
                Number(item.price) ||
                0,

            quantity:
                Math.max(
                    1,
                    Number(item.quantity) || 1
                ),

            customization:
                item.customization ||
                null

        };

    });


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message) {

        if (!toast) {
            return;
        }


        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        clearTimeout(
            showToast.timer
        );


        showToast.timer =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                2500
            );

    }


    /* =====================================================
       SAVE CART
    ===================================================== */

    function saveCart() {

        try {

            localStorage.setItem(
                CART_KEY,
                JSON.stringify(cart)
            );

        } catch (error) {

            console.error(
                "Could not save cart:",
                error
            );

        }

    }


    /* =====================================================
       DARK MODE
    ===================================================== */

    function loadDarkMode() {

        let savedMode =
            "false";


        try {

            savedMode =
                localStorage.getItem(
                    DARK_MODE_KEY
                ) || "false";

        } catch (error) {

            console.error(
                "Could not load dark mode:",
                error
            );

        }


        const isDark =
            savedMode === "true";


        document.body.classList.toggle(
            "dark-mode",
            isDark
        );


        updateDarkModeButton(
            isDark
        );

    }


    function updateDarkModeButton(
        isDark
    ) {

        if (!darkModeButton) {
            return;
        }


        darkModeButton.textContent =
            isDark
                ? "☀️"
                : "🌙";


        darkModeButton.title =
            isDark
                ? "Switch to Light Mode"
                : "Switch to Dark Mode";

    }


    if (darkModeButton) {

        darkModeButton.addEventListener(
            "click",
            function () {

                const isDark =
                    document.body.classList.toggle(
                        "dark-mode"
                    );


                try {

                    localStorage.setItem(
                        DARK_MODE_KEY,
                        isDark
                            ? "true"
                            : "false"
                    );

                } catch (error) {

                    console.error(
                        "Could not save dark mode:",
                        error
                    );

                }


                updateDarkModeButton(
                    isDark
                );

            }
        );

    }


    loadDarkMode();


    /* =====================================================
       SEARCH + CATEGORY FILTER
    ===================================================== */

    let selectedCategory =
        "all";


    function filterMenu() {

        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        document
            .querySelectorAll(
                ".menu-item"
            )
            .forEach(
                function (card) {

                    const name =
                        (
                            card.dataset.name ||
                            ""
                        ).toLowerCase();


                    const descriptionElement =
                        card.querySelector("p");


                    const description =
                        descriptionElement
                            ? descriptionElement
                                .textContent
                                .toLowerCase()
                            : "";


                    const category =
                        (
                            card.dataset.category ||
                            ""
                        ).toLowerCase();


                    const matchesSearch =
                        !searchTerm ||
                        name.includes(searchTerm) ||
                        description.includes(searchTerm) ||
                        category.includes(searchTerm);


                    const matchesCategory =
                        selectedCategory === "all" ||
                        category === selectedCategory;


                    card.classList.toggle(
                        "hidden",
                        !(
                            matchesSearch &&
                            matchesCategory
                        )
                    );

                }
            );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterMenu
        );

    }


    /* =====================================================
       CATEGORY BUTTONS
    ===================================================== */

    const categoryButtons =
        document.querySelectorAll(
            ".category-button"
        );


    categoryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    selectedCategory =
                        (
                            button.dataset.category ||
                            "all"
                        ).toLowerCase();


                    categoryButtons.forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    filterMenu();

                }
            );

        }
    );


    /* =====================================================
       COFFEE CUSTOMIZATION
    ===================================================== */

    const coffeeModal =
        document.getElementById(
            "coffeeModal"
        );

    const closeCoffeeModal =
        document.getElementById(
            "closeCoffeeModal"
        );

    const customCoffeeImage =
        document.getElementById(
            "customCoffeeImage"
        );

    const customCoffeeName =
        document.getElementById(
            "customCoffeeName"
        );

    const customCoffeeDescription =
        document.getElementById(
            "customCoffeeDescription"
        );

    const customCoffeeTotal =
        document.getElementById(
            "customCoffeeTotal"
        );

    const coffeeMilk =
        document.getElementById(
            "coffeeMilk"
        );

    const coffeeSugar =
        document.getElementById(
            "coffeeSugar"
        );

    const coffeeQuantity =
        document.getElementById(
            "coffeeQuantity"
        );

    const decreaseCoffeeQty =
        document.getElementById(
            "decreaseCoffeeQty"
        );

    const increaseCoffeeQty =
        document.getElementById(
            "increaseCoffeeQty"
        );

    const addCustomCoffee =
        document.getElementById(
            "addCustomCoffee"
        );

    const saveCustomizationButton =
        document.getElementById(
            "saveCustomization"
        );


    let selectedCoffee = null;

    let selectedCoffeeBasePrice = 0;

    let selectedCoffeeQuantity = 1;


    /* =====================================================
       COFFEE DESCRIPTIONS
    ===================================================== */

    const coffeeDescriptions = {

        "Classic Kopi":
            "Rich and aromatic traditional coffee.",

        "Iced Kopi":
            "Cold, refreshing, and full of coffee flavor.",

        "Caramel Latte":
            "Smooth espresso with creamy caramel.",

        "Chocolate Mocha":
            "Espresso blended with rich chocolate."

    };


    /* =====================================================
       ADDONS
    ===================================================== */

    function getCoffeeAddonElements() {

        return document.querySelectorAll(
            'input[name="coffeeAddon"], input[name="coffeeAddons"]'
        );

    }


    /* =====================================================
       QUANTITY
    ===================================================== */

    function getCoffeeQuantity() {

        if (!coffeeQuantity) {

            return selectedCoffeeQuantity;

        }


        let value;


        if (
            coffeeQuantity.tagName === "INPUT" ||
            coffeeQuantity.tagName === "SELECT"
        ) {

            value =
                Number(
                    coffeeQuantity.value
                );

        } else {

            value =
                Number(
                    coffeeQuantity.textContent
                );

        }


        return value > 0
            ? value
            : 1;

    }


    function setCoffeeQuantity(
        quantity
    ) {

        selectedCoffeeQuantity =
            Math.max(
                1,
                Number(quantity) || 1
            );


        if (!coffeeQuantity) {
            return;
        }


        if (
            coffeeQuantity.tagName === "INPUT" ||
            coffeeQuantity.tagName === "SELECT"
        ) {

            coffeeQuantity.value =
                selectedCoffeeQuantity;

        } else {

            coffeeQuantity.textContent =
                selectedCoffeeQuantity;

        }

    }


    /* =====================================================
       OPEN COFFEE MODAL
    ===================================================== */

    function openCoffeeCustomization() {

        if (!coffeeModal) {
            return;
        }


        coffeeModal.classList.add(
            "active"
        );

    }


    /* =====================================================
       CLOSE COFFEE MODAL
    ===================================================== */

    function closeCoffeeCustomization() {

        if (!coffeeModal) {
            return;
        }


        coffeeModal.classList.remove(
            "active"
        );

    }


    /* =====================================================
       COFFEE ORDER BUTTONS
    ===================================================== */

    document
        .querySelectorAll(
            ".coffee-order"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        const coffeeName =
                            button.dataset.name;


                        const coffeePrice =
                            Number(
                                button.dataset.price
                            );


                        if (
                            !coffeeName ||
                            !Number.isFinite(
                                coffeePrice
                            )
                        ) {

                            showToast(
                                "Coffee information is missing."
                            );

                            return;

                        }


                        selectedCoffee = {

                            name:
                                coffeeName,

                            price:
                                coffeePrice,

                            image:
                                button.dataset.image ||
                                ""

                        };


                        selectedCoffeeBasePrice =
                            coffeePrice;


                        setCoffeeQuantity(1);


                        if (customCoffeeName) {

                            customCoffeeName.textContent =
                                coffeeName;

                        }


                        if (customCoffeeImage) {

                            customCoffeeImage.src =
                                selectedCoffee.image;

                            customCoffeeImage.alt =
                                coffeeName;

                        }


                        if (customCoffeeDescription) {

                            customCoffeeDescription.textContent =
                                coffeeDescriptions[
                                    coffeeName
                                ] ||
                                "Customize your coffee.";

                        }


                        /* RESET SIZE */

                        const smallSize =
                            document.querySelector(
                                'input[name="coffeeSize"][value="Small"]'
                            );


                        if (smallSize) {

                            smallSize.checked =
                                true;

                        }


                        /* RESET MILK */

                        if (coffeeMilk) {

                            coffeeMilk.value =
                                "Regular";

                        }


                        /* RESET SUGAR */

                        if (coffeeSugar) {

                            coffeeSugar.value =
                                "50%";

                        }


                        /* RESET ADDONS */

                        getCoffeeAddonElements()
                            .forEach(
                                function (addon) {

                                    addon.checked =
                                        false;

                                }
                            );


                        updateCoffeeTotal();

                        openCoffeeCustomization();

                    }
                );

            }
        );


    /* =====================================================
       CLOSE COFFEE MODAL
    ===================================================== */

    if (closeCoffeeModal) {

        closeCoffeeModal.addEventListener(
            "click",
            closeCoffeeCustomization
        );

    }


    if (coffeeModal) {

        coffeeModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    coffeeModal
                ) {

                    closeCoffeeCustomization();

                }

            }
        );

    }


    /* =====================================================
       SIZE
    ===================================================== */

    function getSelectedSize() {

        const selectedSize =
            document.querySelector(
                'input[name="coffeeSize"]:checked'
            );


        if (!selectedSize) {

            return {

                name:
                    "Small",

                price:
                    0

            };

        }


        return {

            name:
                selectedSize.value,

            price:
                Number(
                    selectedSize.dataset.price ||
                    0
                )

        };

    }


    /* =====================================================
       MILK
    ===================================================== */

    function getSelectedMilk() {

        if (!coffeeMilk) {

            return {

                name:
                    "Regular",

                price:
                    0

            };

        }


        const option =
            coffeeMilk.options[
                coffeeMilk.selectedIndex
            ];


        if (!option) {

            return {

                name:
                    "Regular",

                price:
                    0

            };

        }


        return {

            name:
                option.value,

            price:
                Number(
                    option.dataset.price ||
                    0
                )

        };

    }


    /* =====================================================
       ADDONS
    ===================================================== */

    function getSelectedAddons() {

        const addons = [];


        getCoffeeAddonElements()
            .forEach(
                function (addon) {

                    if (addon.checked) {

                        addons.push({

                            name:
                                addon.value ||
                                addon.dataset.name ||
                                "Add-on",

                            price:
                                Number(
                                    addon.dataset.price ||
                                    0
                                )

                        });

                    }

                }
            );


        return addons;

    }


    /* =====================================================
       COFFEE PRICE
    ===================================================== */

    function calculateCoffeeUnitPrice() {

        if (!selectedCoffee) {
            return 0;
        }


        const size =
            getSelectedSize();


        const milk =
            getSelectedMilk();


        const addons =
            getSelectedAddons();


        let addonTotal =
            0;


        addons.forEach(
            function (addon) {

                addonTotal +=
                    addon.price;

            }
        );


        return (
            selectedCoffeeBasePrice +
            size.price +
            milk.price +
            addonTotal
        );

    }


    /* =====================================================
       UPDATE COFFEE TOTAL
    ===================================================== */

    function updateCoffeeTotal() {

        if (!selectedCoffee) {
            return;
        }


        selectedCoffeeQuantity =
            getCoffeeQuantity();


        const unitPrice =
            calculateCoffeeUnitPrice();


        const total =
            unitPrice *
            selectedCoffeeQuantity;


        if (customCoffeeTotal) {

            customCoffeeTotal.textContent =
                "₱" +
                total.toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

        }

    }


    /* =====================================================
       CUSTOMIZATION EVENTS
    ===================================================== */

    document
        .querySelectorAll(
            'input[name="coffeeSize"]'
        )
        .forEach(
            function (option) {

                option.addEventListener(
                    "change",
                    updateCoffeeTotal
                );

            }
        );


    if (coffeeMilk) {

        coffeeMilk.addEventListener(
            "change",
            updateCoffeeTotal
        );

    }


    if (coffeeSugar) {

        coffeeSugar.addEventListener(
            "change",
            updateCoffeeTotal
        );

    }


    getCoffeeAddonElements()
        .forEach(
            function (addon) {

                addon.addEventListener(
                    "change",
                    updateCoffeeTotal
                );

            }
        );


    /* =====================================================
       QUANTITY BUTTONS
    ===================================================== */

    if (decreaseCoffeeQty) {

        decreaseCoffeeQty.addEventListener(
            "click",
            function () {

                const quantity =
                    getCoffeeQuantity();


                setCoffeeQuantity(
                    Math.max(
                        1,
                        quantity - 1
                    )
                );


                updateCoffeeTotal();

            }
        );

    }


    if (increaseCoffeeQty) {

        increaseCoffeeQty.addEventListener(
            "click",
            function () {

                const quantity =
                    getCoffeeQuantity();


                setCoffeeQuantity(
                    quantity + 1
                );


                updateCoffeeTotal();

            }
        );

    }


    /* =====================================================
       SAVE CUSTOMIZATION
    ===================================================== */

    if (saveCustomizationButton) {

        saveCustomizationButton.addEventListener(
            "click",
            function () {

                if (!selectedCoffee) {

                    showToast(
                        "Please select a coffee first."
                    );

                    return;

                }


                const size =
                    getSelectedSize();


                const milk =
                    getSelectedMilk();


                const sugar =
                    coffeeSugar
                        ? coffeeSugar.value
                        : "50%";


                const addons =
                    getSelectedAddons();


                const quantity =
                    getCoffeeQuantity();


                const customization = {

                    coffeeName:
                        selectedCoffee.name,

                    image:
                        selectedCoffee.image,

                    basePrice:
                        selectedCoffeeBasePrice,

                    size:
                        size.name,

                    milk:
                        milk.name,

                    sugar:
                        sugar,

                    addons:
                        addons.map(
                            function (addon) {

                                return addon.name;

                            }
                        ),

                    quantity:
                        quantity

                };


                try {

                    localStorage.setItem(
                        CUSTOMIZATION_KEY,
                        JSON.stringify(
                            customization
                        )
                    );


                    showToast(
                        "Customization saved successfully!"
                    );


                } catch (error) {

                    console.error(error);


                    showToast(
                        "Unable to save customization."
                    );

                }

            }
        );

    }


    /* =====================================================
       ADD CUSTOM COFFEE
    ===================================================== */

    if (addCustomCoffee) {

        addCustomCoffee.addEventListener(
            "click",
            function () {

                if (!selectedCoffee) {

                    showToast(
                        "Please select a coffee first."
                    );

                    return;

                }


                const size =
                    getSelectedSize();


                const milk =
                    getSelectedMilk();


                const sugar =
                    coffeeSugar
                        ? coffeeSugar.value
                        : "50%";


                const addons =
                    getSelectedAddons();


                const quantity =
                    getCoffeeQuantity();


                const unitPrice =
                    calculateCoffeeUnitPrice();


                const cartItem = {

                    id:
                        createCartId(),

                    name:
                        selectedCoffee.name,

                    image:
                        selectedCoffee.image,

                    basePrice:
                        selectedCoffeeBasePrice,

                    price:
                        unitPrice,

                    quantity:
                        quantity,

                    customization: {

                        size:
                            size.name,

                        milk:
                            milk.name,

                        sugar:
                            sugar,

                        addons:
                            addons.map(
                                function (addon) {

                                    return addon.name;

                                }
                            )

                    }

                };


                cart.push(cartItem);


                saveCart();


                updateCart();


                closeCoffeeCustomization();


                showToast(
                    selectedCoffee.name +
                    " added to cart! ☕"
                );


                selectedCoffee =
                    null;

            }
        );

    }


    /* =====================================================
       NORMAL FOOD ITEMS
    ===================================================== */

    document
        .querySelectorAll(
            ".normal-order"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const name =
                            button.dataset.name;


                        const price =
                            Number(
                                button.dataset.price
                            );


                        if (
                            !name ||
                            !Number.isFinite(price)
                        ) {

                            showToast(
                                "Item information is missing."
                            );

                            return;

                        }


                        const item = {

                            id:
                                createCartId(),

                            name:
                                name,

                            price:
                                price,

                            basePrice:
                                price,

                            quantity:
                                1,

                            image:
                                button.dataset.image ||
                                "",

                            customization:
                                null

                        };


                        cart.push(item);


                        saveCart();


                        updateCart();


                        showToast(
                            name +
                            " added to cart!"
                        );

                    }
                );

            }
        );


    /* =====================================================
       UPDATE CART
    ===================================================== */

    function updateCart() {

        let totalQuantity =
            0;


        cart.forEach(
            function (item) {

                totalQuantity +=
                    Math.max(
                        1,
                        Number(item.quantity) || 1
                    );

            }
        );


        if (cartCount) {

            cartCount.textContent =
                totalQuantity;

        }


        renderCart();

    }


    /* =====================================================
       RENDER CART
    ===================================================== */

    function renderCart() {

        if (!cartItems) {
            return;
        }


        if (cart.length === 0) {

            cartItems.innerHTML = `

                <div class="empty-cart">

                    <div style="font-size:40px;">
                        🛒
                    </div>

                    <p>
                        Your cart is empty.
                    </p>

                </div>

            `;


            if (cartTotal) {

                cartTotal.textContent =
                    "₱0.00";

            }


            if (checkoutButton) {

                checkoutButton.disabled =
                    true;

            }


            return;

        }


        if (checkoutButton) {

            checkoutButton.disabled =
                false;

        }


        cartItems.innerHTML =
            "";


        let total =
            0;


        cart.forEach(
            function (item, index) {

                const quantity =
                    Math.max(
                        1,
                        Number(item.quantity) || 1
                    );


                const price =
                    Number(item.price) || 0;


                const itemTotal =
                    price *
                    quantity;


                total +=
                    itemTotal;


                let customizationHTML =
                    "";


                if (item.customization) {

                    const custom =
                        item.customization;


                    customizationHTML = `

                        <div class="cart-customization">

                            <div>
                                <strong>Size:</strong>
                                ${custom.size || "Small"}
                            </div>

                            <div>
                                <strong>Milk:</strong>
                                ${custom.milk || "Regular"}
                            </div>

                            <div>
                                <strong>Sugar:</strong>
                                ${custom.sugar || "50%"}
                            </div>

                            ${
                                custom.addons &&
                                custom.addons.length
                                    ? `
                                        <div>
                                            <strong>Add-ons:</strong>
                                            ${custom.addons.join(", ")}
                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    `;

                }


                const cartItem =
                    document.createElement(
                        "div"
                    );


                cartItem.className =
                    "cart-item";


                cartItem.innerHTML = `

                    <div class="cart-item-image">

                        ${
                            item.image
                                ? `
                                    <img
                                        src="${item.image}"
                                        alt="${item.name}"
                                    >
                                  `
                                : `
                                    <div class="cart-no-image">
                                        ☕
                                    </div>
                                  `
                        }

                    </div>


                    <div class="cart-item-info">

                        <h3>
                            ${item.name}
                        </h3>

                        ${customizationHTML}

                        <div class="cart-item-price">

                            ₱${price.toLocaleString(
                                "en-PH",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}

                        </div>


                        <div class="cart-item-controls">

                            <button
                                type="button"
                                class="cart-minus"
                                data-index="${index}"
                            >
                                −
                            </button>


                            <span>
                                ${quantity}
                            </span>


                            <button
                                type="button"
                                class="cart-plus"
                                data-index="${index}"
                            >
                                +
                            </button>


                            <button
                                type="button"
                                class="cart-remove"
                                data-index="${index}"
                            >
                                🗑
                            </button>

                        </div>

                    </div>


                    <div class="cart-item-total">

                        ₱${itemTotal.toLocaleString(
                            "en-PH",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )}

                    </div>

                `;


                cartItems.appendChild(
                    cartItem
                );

            }
        );


        if (cartTotal) {

            cartTotal.textContent =
                "₱" +
                total.toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

        }


        addCartButtonEvents();

    }


    /* =====================================================
       CART ITEM BUTTONS
    ===================================================== */

    function addCartButtonEvents() {

        document
            .querySelectorAll(
                ".cart-minus"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    button.dataset.index
                                );


                            if (!cart[index]) {
                                return;
                            }


                            if (
                                Number(
                                    cart[index].quantity
                                ) > 1
                            ) {

                                cart[index].quantity--;

                            } else {

                                cart.splice(
                                    index,
                                    1
                                );

                            }


                            saveCart();

                            updateCart();

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".cart-plus"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    button.dataset.index
                                );


                            if (!cart[index]) {
                                return;
                            }


                            cart[index].quantity =
                                Number(
                                    cart[index].quantity || 1
                                ) + 1;


                            saveCart();

                            updateCart();

                        }
                    );

                }
            );


        document
            .querySelectorAll(
                ".cart-remove"
            )
            .forEach(
                function (button) {

                    button.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    button.dataset.index
                                );


                            if (!cart[index]) {
                                return;
                            }


                            const name =
                                cart[index].name;


                            cart.splice(
                                index,
                                1
                            );


                            saveCart();

                            updateCart();


                            showToast(
                                name +
                                " removed from cart."
                            );

                        }
                    );

                }
            );

    }


    /* =====================================================
       OPEN CART
    ===================================================== */

    if (cartButton) {

        cartButton.addEventListener(
            "click",
            function () {

                renderCart();


                if (cartModal) {

                    cartModal.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
       CLOSE CART
    ===================================================== */

    if (closeCartButton) {

        closeCartButton.addEventListener(
            "click",
            function () {

                if (cartModal) {

                    cartModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (cartModal) {

        cartModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    cartModal
                ) {

                    cartModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
       CHECKOUT
    ===================================================== */

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                if (cart.length === 0) {

                    showToast(
                        "Your cart is empty."
                    );

                    return;

                }


                const customerName =
                    document.getElementById(
                        "customerName"
                    );


                if (
                    customerName &&
                    currentUser &&
                    currentUser.fullname
                ) {

                    customerName.value =
                        currentUser.fullname;

                }


                if (cartModal) {

                    cartModal.classList.remove(
                        "active"
                    );

                }


                if (checkoutModal) {

                    checkoutModal.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
       CLOSE CHECKOUT
    ===================================================== */

    if (closeCheckoutButton) {

        closeCheckoutButton.addEventListener(
            "click",
            function () {

                if (checkoutModal) {

                    checkoutModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (checkoutModal) {

        checkoutModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    checkoutModal
                ) {

                    checkoutModal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
       PLACE ORDER
       SAVE TO LOCALSTORAGE + INDEXEDDB
    ===================================================== */

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                if (cart.length === 0) {

                    showToast(
                        "Your cart is empty."
                    );

                    return;

                }


                const customerName =
                    document.getElementById(
                        "customerName"
                    );


                const customerPhone =
                    document.getElementById(
                        "customerPhone"
                    );


                const orderType =
                    document.getElementById(
                        "orderType"
                    );


                const paymentMethod =
                    document.getElementById(
                        "paymentMethod"
                    );


                const orderNotes =
                    document.getElementById(
                        "orderNotes"
                    );


                if (
                    !customerName ||
                    !customerPhone ||
                    !orderType ||
                    !paymentMethod
                ) {

                    showToast(
                        "Checkout form is missing required fields."
                    );

                    return;

                }


                const name =
                    customerName.value.trim();


                const phone =
                    customerPhone.value.trim();


                const type =
                    orderType.value;


                const payment =
                    paymentMethod.value;


                const notes =
                    orderNotes
                        ? orderNotes.value.trim()
                        : "";


                if (
                    !name ||
                    !phone ||
                    !type ||
                    !payment
                ) {

                    showToast(
                        "Please complete the required fields."
                    );

                    return;

                }


                /* =================================================
                   CALCULATE TOTAL
                ================================================= */

                const total =
                    cart.reduce(
                        function (
                            sum,
                            item
                        ) {

                            return (
                                sum +
                                (
                                    Number(
                                        item.price
                                    ) *
                                    Number(
                                        item.quantity
                                    )
                                )
                            );

                        },
                        0
                    );


                /* =================================================
                   CREATE ORDER OBJECT
                ================================================= */

                const order = {

                    orderId:
                        "CC-" +
                        Date.now(),

                    orderNumber:
                        generateOrderNumber(),

                    customerName:
                        name,

                    customerPhone:
                        phone,

                    orderType:
                        type,

                    paymentMethod:
                        payment,

                    notes:
                        notes,

                    items:
                        cart.map(
                            function (item) {

                                return {
                                    ...item
                                };

                            }
                        ),

                    total:
                        total,

                    status:
                        "Pending",

                    date:
                        new Date()
                            .toLocaleString(
                                "en-PH"
                            ),

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()

                };


                /* =================================================
                   SAVE TO INDEXEDDB
                ================================================= */

                try {

                    await saveOrderToDatabase(
                        order
                    );


                    console.log(
                        "Order saved to Cozy Cup database:",
                        order
                    );


                } catch (error) {

                    console.error(
                        "IndexedDB save failed:",
                        error
                    );


                    showToast(
                        "Database error. Order was not saved."
                    );

                    return;

                }


                /* =================================================
                   BACKUP SAVE TO LOCALSTORAGE
                ================================================= */

                let orders = [];


                try {

                    const savedOrders =
                        localStorage.getItem(
                            ORDERS_KEY
                        );


                    if (savedOrders) {

                        const parsedOrders =
                            JSON.parse(
                                savedOrders
                            );


                        if (
                            Array.isArray(
                                parsedOrders
                            )
                        ) {

                            orders =
                                parsedOrders;

                        }

                    }

                } catch (error) {

                    console.error(
                        "Error loading old orders:",
                        error
                    );

                }


                orders.push(order);


                try {

                    localStorage.setItem(
                        ORDERS_KEY,
                        JSON.stringify(
                            orders
                        )
                    );

                } catch (error) {

                    console.error(
                        "Could not save backup order:",
                        error
                    );

                }


                /* =================================================
                   CLEAR CART
                ================================================= */

                cart = [];


                saveCart();


                updateCart();


                checkoutForm.reset();


                if (checkoutModal) {

                    checkoutModal.classList.remove(
                        "active"
                    );

                }


                /* =================================================
                   SUCCESS
                ================================================= */

                showToast(
                    "Order placed successfully! ☕"
                );


                console.log(
                    "ORDER NUMBER:",
                    order.orderNumber
                );

                console.log(
                    "ORDER STATUS:",
                    order.status
                );

            }
        );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmLogout =
                    window.confirm(
                        "Are you sure you want to log out?"
                    );


                if (!confirmLogout) {
                    return;
                }


                localStorage.removeItem(
                    "cozyCupLoggedIn"
                );


                localStorage.removeItem(
                    "cozyCupUserName"
                );


                localStorage.removeItem(
                    "cozyCupCurrentUser"
                );


                window.location.replace(
                    "login.html"
                );

            }
        );

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updateCart();

    filterMenu();


    /* =====================================================
       MAKE DATABASE FUNCTIONS AVAILABLE
       TO CASHIER PAGE
    ===================================================== */

    window.CoZyCupDatabase = {

        getAllOrders:
            getAllOrders,

        updateOrderStatus:
            updateOrderStatus,

        saveOrderToDatabase:
            saveOrderToDatabase,

        createCustomerOrder:
            createCustomerOrder

    };

});