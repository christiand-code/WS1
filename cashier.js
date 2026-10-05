document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       COZY CUP CASHIER
    ===================================================== */

    const DB_NAME = "CozyCupDatabase";
    const DB_VERSION = 1;
    const ORDER_STORE = "orders";

    let allOrders = [];
    let currentFilter = "all";
    let selectedOrder = null;


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const ordersList =
        document.getElementById("ordersList");

    const totalOrders =
        document.getElementById("totalOrders");

    const pendingOrders =
        document.getElementById("pendingOrders");

    const preparingOrders =
        document.getElementById("preparingOrders");

    const todaySales =
        document.getElementById("todaySales");

    const completedOrders =
        document.getElementById("completedOrders");

    const averageOrder =
        document.getElementById("averageOrder");

    const salesSummary =
        document.getElementById("salesSummary");

    const cashierName =
        document.getElementById("cashierName");

    const paymentModal =
        document.getElementById("paymentModal");

    const paymentOrderNumber =
        document.getElementById("paymentOrderNumber");

    const paymentTotal =
        document.getElementById("paymentTotal");

    const paymentMethod =
        document.getElementById("paymentMethod");

    const cashReceived =
        document.getElementById("cashReceived");

    const cashReceivedGroup =
        document.getElementById("cashReceivedGroup");

    const changeAmount =
        document.getElementById("changeAmount");

    const toast =
        document.getElementById("toast");


    /* =====================================================
       CASHIER NAME
    ===================================================== */

    const savedCashierName =
        localStorage.getItem("cozyCupCashierName");

    if (savedCashierName) {
        cashierName.textContent = savedCashierName;
    }


    /* =====================================================
       INDEXEDDB
    ===================================================== */

    function openDatabase() {

        return new Promise(function (resolve, reject) {

            const request =
                indexedDB.open(DB_NAME, DB_VERSION);


            request.onupgradeneeded = function (event) {

                const db = event.target.result;

                if (!db.objectStoreNames.contains(ORDER_STORE)) {

                    const store =
                        db.createObjectStore(
                            ORDER_STORE,
                            {
                                keyPath: "id",
                                autoIncrement: true
                            }
                        );

                    store.createIndex(
                        "orderNumber",
                        "orderNumber",
                        { unique: false }
                    );

                    store.createIndex(
                        "status",
                        "status",
                        { unique: false }
                    );

                    store.createIndex(
                        "createdAt",
                        "createdAt",
                        { unique: false }
                    );

                }

            };


            request.onsuccess = function () {
                resolve(request.result);
            };


            request.onerror = function () {
                reject(request.error);
            };

        });

    }


    /* =====================================================
       GET ORDERS
    ===================================================== */

    async function getOrders() {

        try {

            const db =
                await openDatabase();

            return new Promise(function (resolve, reject) {

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


                request.onsuccess = function () {

                    resolve(
                        request.result || []
                    );

                };


                request.onerror = function () {

                    reject(request.error);

                };

            });

        } catch (error) {

            console.error(
                "Database error:",
                error
            );

            return [];

        }

    }


    /* =====================================================
       UPDATE ORDER
    ===================================================== */

    async function updateOrder(orderId, updates) {

        try {

            const db =
                await openDatabase();

            return new Promise(function (resolve, reject) {

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


                request.onsuccess = function () {

                    const order =
                        request.result;

                    if (!order) {
                        reject(
                            new Error("Order not found")
                        );
                        return;
                    }


                    Object.assign(
                        order,
                        updates
                    );


                    const updateRequest =
                        store.put(order);


                    updateRequest.onsuccess =
                        function () {

                            resolve(order);

                        };


                    updateRequest.onerror =
                        function () {

                            reject(
                                updateRequest.error
                            );

                        };

                };


                request.onerror = function () {

                    reject(request.error);

                };

            });

        } catch (error) {

            console.error(
                "Update error:",
                error
            );

        }

    }


    /* =====================================================
       LOAD ORDERS
    ===================================================== */

    async function loadOrders() {

        allOrders =
            await getOrders();

        allOrders.sort(function (a, b) {

            return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );

        });


        updateDashboard();

        renderOrders();

    }


    /* =====================================================
       DASHBOARD
    ===================================================== */

    function updateDashboard() {

        totalOrders.textContent =
            allOrders.length;


        const pending =
            allOrders.filter(function (order) {

                return order.status === "Pending";

            }).length;


        const preparing =
            allOrders.filter(function (order) {

                return order.status === "Preparing";

            }).length;


        const completed =
            allOrders.filter(function (order) {

                return order.status === "Completed";

            });


        pendingOrders.textContent =
            pending;

        preparingOrders.textContent =
            preparing;


        const today =
            new Date();

        const todayCompleted =
            completed.filter(function (order) {

                const date =
                    new Date(order.createdAt);

                return (
                    date.getFullYear() ===
                        today.getFullYear() &&

                    date.getMonth() ===
                        today.getMonth() &&

                    date.getDate() ===
                        today.getDate()
                );

            });


        const sales =
            todayCompleted.reduce(
                function (total, order) {

                    return total +
                        Number(order.total || 0);

                },
                0
            );


        todaySales.textContent =
            formatCurrency(sales);

        salesSummary.textContent =
            formatCurrency(sales);


        completedOrders.textContent =
            todayCompleted.length;


        const average =
            todayCompleted.length
                ? sales / todayCompleted.length
                : 0;


        averageOrder.textContent =
            formatCurrency(average);

    }


    /* =====================================================
       RENDER ORDERS
    ===================================================== */

    function renderOrders() {

        let filteredOrders;


        if (currentFilter === "all") {

            filteredOrders =
                allOrders;

        } else {

            filteredOrders =
                allOrders.filter(function (order) {

                    return (
                        order.status ===
                        currentFilter
                    );

                });

        }


        if (!filteredOrders.length) {

            ordersList.innerHTML = `

                <div class="empty-orders">

                    <div>🧾</div>

                    <h3>
                        No orders found
                    </h3>

                    <p>
                        There are no ${currentFilter === "all"
                            ? ""
                            : currentFilter.toLowerCase()
                        } orders right now.
                    </p>

                </div>

            `;

            return;

        }


        ordersList.innerHTML =
            filteredOrders.map(
                createOrderCard
            ).join("");

    }


    /* =====================================================
       ORDER CARD
    ===================================================== */

    function createOrderCard(order) {

        const items =
            Array.isArray(order.items)
                ? order.items
                : [];


        const itemHTML =
            items.map(function (item) {

                const quantity =
                    Number(item.quantity || 1);

                const price =
                    Number(item.price || 0);


                return `

                    <div class="order-item">

                        <span>
                            ${quantity} ×
                            ${escapeHTML(
                                item.name || "Item"
                            )}
                        </span>

                        <span class="order-item-price">
                            ${formatCurrency(
                                price * quantity
                            )}
                        </span>

                    </div>

                `;

            }).join("");


        const statusClass =
            "status-" +
            String(
                order.status || "Pending"
            ).toLowerCase();


        const createdAt =
            order.createdAt
                ? new Date(order.createdAt)
                : new Date();


        const time =
            createdAt.toLocaleString(
                "en-PH",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );


        let actions = "";


        if (order.status === "Pending") {

            actions = `

                <button
                    class="order-action pay-button"
                    onclick="openPayment(${order.id})"
                >
                    💳 Process Payment
                </button>

            `;

        }


        if (order.status === "Preparing") {

            actions = `

                <button
                    class="order-action ready-button"
                    onclick="changeOrderStatus(
                        ${order.id},
                        'Ready'
                    )"
                >
                    ✓ Mark Ready
                </button>

            `;

        }


        if (order.status === "Ready") {

            actions = `

                <button
                    class="order-action complete-button"
                    onclick="changeOrderStatus(
                        ${order.id},
                        'Completed'
                    )"
                >
                    ✓ Complete Order
                </button>

            `;

        }


        return `

            <div class="order-card">

                <div class="order-top">

                    <div>

                        <div class="order-number">
                            ${escapeHTML(
                                order.orderNumber ||
                                "Order #" + order.id
                            )}
                        </div>

                        <div class="order-time">
                            ${time}
                        </div>

                    </div>


                    <span class="status ${statusClass}">
                        ${escapeHTML(
                            order.status || "Pending"
                        )}
                    </span>

                </div>


                <div class="customer-info">

                    <div>

                        <strong>
                            ${escapeHTML(
                                order.customerName ||
                                "Customer"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                order.customerPhone ||
                                "No phone number"
                            )}
                        </span>

                    </div>


                    <div>

                        <strong>
                            ${escapeHTML(
                                order.orderType ||
                                "Dine In"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                order.paymentMethod ||
                                "Cash"
                            )}
                        </span>

                    </div>

                </div>


                <div class="order-items">

                    ${itemHTML}

                </div>


                <div class="order-total">

                    <span>
                        Total
                    </span>

                    <strong>
                        ${formatCurrency(
                            Number(order.total || 0)
                        )}
                    </strong>

                </div>


                ${
                    order.paymentStatus
                    ? `
                        <div class="payment-info">
                            Payment:
                            <strong>
                                ${escapeHTML(
                                    order.paymentStatus
                                )}
                            </strong>
                        </div>
                    `
                    : ""
                }


                ${
                    order.notes
                    ? `
                        <div class="payment-info">
                            Notes:
                            ${escapeHTML(
                                order.notes
                            )}
                        </div>
                    `
                    : ""
                }


                <div class="order-actions">

                    ${actions}

                </div>

            </div>

        `;

    }


    /* =====================================================
       PAYMENT MODAL
    ===================================================== */

    window.openPayment =
        function (orderId) {

            selectedOrder =
                allOrders.find(
                    function (order) {

                        return order.id === orderId;

                    }
                );


            if (!selectedOrder) {
                return;
            }


            paymentOrderNumber.textContent =
                selectedOrder.orderNumber ||
                "Order #" + selectedOrder.id;


            paymentTotal.textContent =
                formatCurrency(
                    Number(
                        selectedOrder.total || 0
                    )
                );


            paymentMethod.value =
                selectedOrder.paymentMethod ||
                "Cash";


            cashReceived.value = "";

            changeAmount.textContent =
                "₱0.00";


            updateCashField();


            paymentModal.classList.add(
                "show"
            );

        };


    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    function updateCashField() {

        if (paymentMethod.value === "Cash") {

            cashReceivedGroup.style.display =
                "block";

        } else {

            cashReceivedGroup.style.display =
                "none";

            changeAmount.textContent =
                "₱0.00";

        }

    }


    paymentMethod.addEventListener(
        "change",
        updateCashField
    );


    /* =====================================================
       CHANGE CALCULATION
    ===================================================== */

    cashReceived.addEventListener(
        "input",
        function () {

            if (!selectedOrder) {
                return;
            }


            const total =
                Number(
                    selectedOrder.total || 0
                );


            const received =
                Number(
                    cashReceived.value || 0
                );


            const change =
                received - total;


            changeAmount.textContent =
                formatCurrency(
                    change > 0
                        ? change
                        : 0
                );

        }
    );


    /* =====================================================
       CONFIRM PAYMENT
    ===================================================== */

    document
        .getElementById("confirmPayment")
        .addEventListener(
            "click",
            async function () {

                if (!selectedOrder) {
                    return;
                }


                const total =
                    Number(
                        selectedOrder.total || 0
                    );


                const method =
                    paymentMethod.value;


                if (method === "Cash") {

                    const received =
                        Number(
                            cashReceived.value || 0
                        );


                    if (received < total) {

                        showToast(
                            "Cash received is not enough.",
                            "error"
                        );

                        return;

                    }

                }


                await updateOrder(
                    selectedOrder.id,
                    {
                        paymentMethod: method,
                        paymentStatus: "Paid",
                        status: "Preparing",
                        paidAt: new Date().toISOString()
                    }
                );


                paymentModal.classList.remove(
                    "show"
                );


                selectedOrder = null;


                showToast(
                    "Payment confirmed. Order is now preparing.",
                    "success"
                );


                await loadOrders();

            }
        );


    /* =====================================================
       CHANGE ORDER STATUS
    ===================================================== */

    window.changeOrderStatus =
        async function (
            orderId,
            status
        ) {

            await updateOrder(
                orderId,
                {
                    status: status
                }
            );


            showToast(
                "Order status updated to " +
                status + ".",
                "success"
            );


            await loadOrders();

        };


    /* =====================================================
       FILTERS
    ===================================================== */

    document
        .querySelectorAll(".filter-button")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    document
                        .querySelectorAll(
                            ".filter-button"
                        )
                        .forEach(
                            function (btn) {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter
                            .toLowerCase();


                    renderOrders();

                }
            );

        });


    /* =====================================================
       REFRESH
    ===================================================== */

    document
        .getElementById("refreshOrders")
        .addEventListener(
            "click",
            loadOrders
        );


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    document
        .getElementById("closePaymentModal")
        .addEventListener(
            "click",
            function () {

                paymentModal.classList.remove(
                    "show"
                );

                selectedOrder = null;

            }
        );


    paymentModal.addEventListener(
        "click",
        function (event) {

            if (event.target === paymentModal) {

                paymentModal.classList.remove(
                    "show"
                );

                selectedOrder = null;

            }

        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "cozyCupCashierLoggedIn"
                );

                localStorage.removeItem(
                    "cozyCupCashierName"
                );

                localStorage.removeItem(
                    "cozyCupUserRole"
                );


                window.location.href =
                    "login.html";

            }
        );


    /* =====================================================
       DATE & TIME
    ===================================================== */

    function updateDateTime() {

        const now =
            new Date();


        document.getElementById(
            "currentDate"
        ).textContent =
            now.toLocaleDateString(
                "en-PH",
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            );


        document.getElementById(
            "currentTime"
        ).textContent =
            now.toLocaleTimeString(
                "en-PH",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }


    updateDateTime();

    setInterval(
        updateDateTime,
        1000
    );


    /* =====================================================
       AUTO REFRESH
    ===================================================== */

    setInterval(
        loadOrders,
        5000
    );


    /* =====================================================
       HELPERS
    ===================================================== */

    function formatCurrency(amount) {

        return "₱" +
            Number(amount || 0)
                .toLocaleString(
                    "en-PH",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

    }


    function escapeHTML(value) {

        return String(value || "")
            .replace(
                /[&<>"']/g,
                function (character) {

                    const entities = {

                        "&": "&amp;",
                        "<": "&lt;",
                        ">": "&gt;",
                        '"': "&quot;",
                        "'": "&#039;"

                    };

                    return entities[
                        character
                    ];

                }
            );

    }


    function showToast(
        message,
        type
    ) {

        toast.textContent =
            message;

        toast.classList.add(
            "show"
        );


        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

    }


    /* =====================================================
       START
    ===================================================== */

    loadOrders();

});