// data.js

let password = "NULL";

async function fetchManagementPassword() {
    const response = await fetch("Scripts/fetchConfig.php?action=getManagementPassword&token=FetchPlease")
    if(response.ok) {
        password = (await response.text()).toString();
    } else {
        console.error("Error reading from fetchConfig");
    }
}

// Function to fetch user data
async function fetchUserData() {
    try {
        // Fetch user data from MySQL database
        const response = await fetch("MySQL/api.php?action=getUsers&token=GiveData");
        if(response.ok) {
            return await response.json();
        } else {
            console.error("Failed to fetch user data from MySQL:", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
    return []; // Return an empty array if there's an error
}

// Function to fetch a single user's data
async function fetchSingleUserData(userId) {
    try {
        const response = await fetch(`MySQL/api.php?action=getUsers&userId=${userId}&token=GiveData`);
        if(response.ok) {
            const userData = await response.json();
            if(userData) {
                return userData;
            } else {
                console.error(`No data found for user ${userId}.`);
                return null; // Return null if no data is found
            }
        } else {
            console.error(`Failed to fetch user data for user ${userId}: ${response.status} ${response.statusText}`);
            return null; // Return null on request failure
        }
    } catch (error) {
        console.error(`Error fetching user data for user ${userId}: ${error}`);
        return null; // Return null on error
    }
}

// Function to generate a user box
async function generateUserBox(userId) {
    return new Promise(async (resolve) => {
        const hasManagementPermission = getCookie("managementPermission") === "true";
        // Fetch user data for the specific user
        fetchSingleUserData(userId).then((user) => {
            if(!user) {
                resolve();
                return;
            }
            activeUserIds.push(user.userId);
            const userBox = document.createElement("div");
            userBox.id = `user-box-${user.userId}`;
            userBox.classList.add("user-container", "rounded");

            // Display the username
            const userName = document.createElement("div");
            userName.classList.add("user-name");
            userName.textContent = user.name;
            userBox.appendChild(userName);

            // Check if the user has management permission
            if(hasManagementPermission) {
                // If the user has management permission, display the user ID
                const userIdElement = document.createElement("div");
                userIdElement.classList.add("user-id");
                userIdElement.textContent = user.userId;
                userBox.appendChild(userIdElement);
                userBox.classList.add("has-management");
            }

            // Parse the lastLogin date and calculate the time difference
            const lastLoginString = user.lastLogin;
            const lastLoginDate = new Date(lastLoginString.replace(" ", "T"));
            const currentTimestamp = new Date();
            const timeDifference = currentTimestamp - lastLoginDate;

            const loginTime = document.createElement("div");
            loginTime.classList.add("user-login-time");
            loginTime.textContent = `${formatTimeDifference(timeDifference)}`;

            userBox.appendChild(loginTime);

            // Add a click event listener to the newly created user box
            userBox.addEventListener("click", function () {
                const userDataPopup = document.getElementById("user-data-popup");
                // Handle user box click event here
                let isManager = hasManagementPermissions();
                // Get the user ID from the clicked user box (you may have to modify this based on your HTML structure)
                const userId = userBox.id.split("-")[2];

                fetchSingleUserData(userId).then(function (userData) {
                    if(isManager) {
                        // Populate the pop-up box with user data
                        populateUserDataPopup(userData);
                    }
                });

                if(isManager) {
                    // Display the pop-up
                    userDataPopup.style.display = "block";
                }
            });
            resolve(userBox);
        });
    });
}


async function generateUserBoxes() {
    const userContainer = document.getElementById("user-container");

    try {
        let userData = await fetchUserData();
        userData = userData.filter((user) => user.loggedIn === "1");
        userData.sort((a, b) => {
            const aTime = new Date(a.lastLogin.replace(" ", "T")).getTime();
            const bTime = new Date(b.lastLogin.replace(" ", "T")).getTime();
            return aTime - bTime;
        });

        // Clear existing content in the user container
        userContainer.innerHTML = "";

        // Promises to track the creation of user boxes
        const userBoxPromises = userData.map((user) => generateUserBox(user.userId));

        // Resolve the promises in order and append the user boxes
        for(const userBoxPromise of userBoxPromises) {
            const userBox = await userBoxPromise;
            userContainer.appendChild(userBox);
        }
    } catch (error) {
        console.error("Error generating user boxes:", error);
    }
}

// Function to format the time difference as "HH:MM:SS"
function formatTimeDifference(timeDifference) {
    const seconds = Math.floor((timeDifference / 1000) % 60);
    const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);

    // Add leading zeros if needed
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}


function goToData() {
    window.location.replace("Data/");
}

function hasManagementPermissions() {
    const managementPermission = getCookie("managementPermission");
    return managementPermission === "true";
    /* This is treated the same as
    if(managementPermission === "true") {
        return true;
    } else {
        return false;
    }
    */
}

// Function to update the visibility of the buttons based on permissions
function updateButtonVisibility() {
    const manageButton = document.getElementById("manage-button");
    const logAllOutButton = document.getElementById("log-all-out-button");

    if(hasManagementPermissions()) {
        // If the user has management permissions, show the "Log all out" button and hide the "Manage" button
        manageButton.style.display = "none";
        logAllOutButton.style.display = "block";
    } else {
        // If the user doesn't have management permissions, show the "Manage" button and hide the "Log all out" button
        manageButton.style.display = "block";
        logAllOutButton.style.display = "none";
    }
}

// Function to handle password submission
function handlePasswordSubmit() {
    const passwordInput = document.getElementById("password-input");
    const passwordError = document.getElementById("password-error");

    if(passwordInput.value === password && password !== "NULL") {
        setCookie("managementPermission", "true", 30);
        location.reload();
    } else {
        passwordError.textContent = "Incorrect password. Please try again.";
        passwordError.style.display = "block";
    }
    passwordInput.value = "";
}

function openLoginModal() {
    document.getElementById("login-modal").style.display = "block";
}

// Function to close the login modal
function closeLoginModal() {
    document.getElementById("login-modal").style.display = "none";
    const passwordInput = document.getElementById("password-input");
    passwordInput.value = "";
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const cookies = document.cookie.split(";");
    for(const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split("=");
        if(cookieName === name) {
            return cookieValue;
        }
    }
    return null; // Cookie not found
}

function updateLastLoginTimestamp() {
    fetchUserData().then((userData) => {
        // Loop through user data and update login times for logged-in users
        userData.forEach((user) => {
            if(user.loggedIn === "1") {
                const lastLoginString = user.lastLogin;
                const lastLoginDate = new Date(lastLoginString.replace(" ", "T"));
                const currentTimestamp = new Date();
                const timeDifference = currentTimestamp - lastLoginDate;
                // Find the existing login time element within the user box
                const userBox = document.getElementById(`user-box-${user.userId}`);
                if(userBox) {
                    const loginTimeElement = userBox.querySelector(".user-login-time");
                    if(loginTimeElement) {
                        // Update the login time content
                        loginTimeElement.textContent = `${formatTimeDifference(timeDifference)}`;
                    }
                }
            }
        });
    });
}

function logAllOut() {
    // Fetch user data
    fetchUserData().then((userData) => {
        // Loop through user data and log out each user
        userData.forEach((user) => {
            if(user.loggedIn === "1") {
                // Call the logOut action for each user
                logOut(user.userId);
            }
        });
    });
}

async function logOut(userId) {
    if(!hasManagementPermissions()) {
        return;
    }
    let updateKey;
    const response = await fetch("Scripts/fetchConfig.php?action=updateToken&token=FetchPlease")
    if(response.ok) {
        updateKey = (await response.text()).toString();
        fetch(`MySQL/update.php?action=signOut&userId=${userId}&token=${updateKey}`)
            .then((response) => {
                if(response.ok) {
                    const userBox = document.getElementById(`user-box-${userId}`);
                    if(userBox) {
                        userBox.remove(); // Remove the user's box from the DOM
                    }
                } else {
                    // Handle errors if the log out fails
                    console.error(`Failed to log out user ${userId}.`);
                }
            })
            .catch((error) => {
                console.error(`Error while logging out user ${userId}: ${error}`);
            });
    } else {
        console.error("Error reading from fetchConfig");
    }
}

// Function to populate user data in the popup
function populateUserDataPopup(userData) {
    const table = document.getElementById("user-data-table");

    // Clear existing table rows
    table.innerHTML = '<tr id="user-data-text"><th id="user-data-text">Key</th><th id="user-data-text">Data</th></tr>';

    // Iterate over user data and populate the table
    for(const key in userData) {
        const row = document.createElement("tr");
        const cellKey = document.createElement("td");
        const cellData = document.createElement("td");

        row.id = "user-data-text";
        cellKey.id = "user-data-text";
        cellData.id = "user-data-text";
        cellKey.textContent = key;
        cellData.textContent = userData[key];

        row.appendChild(cellKey);
        row.appendChild(cellData);
        table.appendChild(row);
    }
    const logOutButton = document.getElementById("log-out-button");
    logOutButton.setAttribute("data-user-id", userData.userId);
}

// Function to fetch the list of active user IDs
async function fetchActiveUserIds() {
    try {
        const response = await fetch("MySQL/api.php?action=getLoggedInUsers&token=GiveData");
        if(!response.ok) {
            console.error("Failed to fetch active user IDs");
            return []; // Return an empty array in case of an error
        }
        const userData = await response.json();

        // Check if the received data is an array of user objects
        if(Array.isArray(userData)) {
            // Extract user IDs and return as an array
            return userData
                .filter(user => user.loggedIn === "1")
                .map(user => parseInt(user.userId, 10))
                .filter(id => !isNaN(id));
        } else {
            console.error("Data is not an array of user objects");
            return [];
        }
    } catch (error) {
        console.error("Error fetching active user IDs:", error);
        return [];
    }
}


function toggleSettingsMenu() {
    const settingsMenu = document.getElementById("settings-menu");
    if(settingsMenu.style.display === "block") {
        settingsMenu.style.display = "none";
    } else {
        settingsMenu.style.display = "block";
    }
}

function toggleTheme() {
    const body = document.body;
    const button = document.getElementById("themeToggle")
    button.innerText = body.classList.contains("light-mode") ? "Light Mode" : "Dark Mode"
    body.classList.toggle("light-mode");
    setCookie("theme", body.classList.contains("light-mode") ? "light" : "dark", 365);
}

let activeUserIds = [];

// Function to update user boxes for new sign-ins and logouts
async function updateActiveUserBoxes() {
    try {
        const newActiveUserIds = await fetchActiveUserIds();

        // Find the user IDs that signed out
        const loggedOutUserIds = activeUserIds.filter(id => !newActiveUserIds.includes(id));

        // Find the user IDs that signed in
        const newSignIns = newActiveUserIds.filter(id => !activeUserIds.includes(id));
        
        // Remove user boxes for logged-out users
        loggedOutUserIds.forEach(userId => {
            const userBox = document.getElementById(`user-box-${userId}`);
            if(userBox) {
                userBox.remove();
            }
        });

        // Generate user boxes for new sign-ins
        for(const userId of newSignIns) {
            const userContainer = document.getElementById("user-container");
            const userBox = await generateUserBox(userId);
            userContainer.appendChild(userBox);
        }

        // Update the active user IDs
        activeUserIds = newActiveUserIds;
        
        // Update the user count display
        updateUserCount();
    } catch (error) {
        console.error("Error updating active user boxes:", error);
    }
}

function handleRFIDInput() {
    const input = document.getElementById("rfid-input")
    const button = document.getElementById("tap-rfid-button")
    button.innerText = "Waiting";
    fetch("../Scripts/readRfid.php")
        .then(response => response.text())
        .then(data => {
            input.value = data;
            button.innerText = "Tap RFID";
        })
        .catch(error => {
            console.error("Error fetching RFID data:", error);
            button.innerText = "Tap RFID";
        });
}
async function addUser() {
    const nameInput = document.getElementById("name-input");
    const rfidInput = document.getElementById("rfid-input");

    const name = nameInput.value.trim();
    const rfid = rfidInput.value.replace(/\D/g, "");

    if(name && rfid) {
        // Fetch the createUserToken from fetchConfig
        try {
            const tokenResponse = await fetch("Scripts/fetchConfig.php?action=createUserToken&token=FetchPlease");
            if(tokenResponse.ok) {
                // Construct the URL for create user with the fetched token
                const createUserURL = `MySQL/createUser.php?name=${name}&rfid=${rfid}&token=${(await tokenResponse.text()).toString()}`;
                try {
                    const response = await fetch(createUserURL, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    if(response.ok) {
                        const result = await response.text();
                        if(result === "User created successfully") {
                            alert("User created successfully");
                            nameInput.value = "";
                            rfidInput.value = "";
                        } else if(result === "RFID already exists") {
                            alert("RFID already exists");
                        } else {
                            alert(result);
                        }
                    } else {
                        alert("Error creating user");
                    }
                } catch (error) {
                    alert("An error occurred while creating the user");
                    console.error(error);
                }
            } else {
                alert("Failed to retrieve the createUserToken");
            }
        } catch (error) {
            alert("An error occurred while fetching createUserToken");
            console.error(error);
        }
    }
}

// Function to update the user count in the header
function updateUserCount() {
    const userCountElement = document.getElementById("user-count");
    if (userCountElement) {
        const count = activeUserIds.length;
        userCountElement.textContent = `(${count})`;
    }
}


let noHideLogin = ["password-input", "login-modal", "login-modal-content", "login-modal-text", "login-button"];
let noHideUserData = ["user-data-table", "user-data-content", "user-data-text"];
let noHideSettingsMenu = ["settings-icon", "settings-menu", "themeToggle", "settings-img"];
let noHideAddUserMenu = ["add-user-menu-text", "name-input", "rfid-input", "add-user-button",
    "add-user-menu-content", "create-user-menu-button", "create-user-menu-icon", "tap-rfid-button", "name-input-container", "rfid-input-container"];

document.addEventListener("DOMContentLoaded", async function () {
    await generateUserBoxes();
    await updateButtonVisibility();
    await fetchManagementPassword();
    updateUserCount(); // Add this line to update the count initially

    const themeCookie = getCookie("theme");
    const button = document.getElementById("themeToggle")
    if(themeCookie === "light") {
        document.body.classList.add("light-mode");
        button.innerText = "Dark Mode";
    }


    const addUserButton = document.getElementById("create-user-menu-button")
    if(hasManagementPermissions()) {
        addUserButton.style.display = "flex";
    }

    const settingsMenu = document.getElementById("settings-menu");
    const userDataPopup = document.getElementById("user-data-popup");
    const addUserMenu = document.getElementById("add-user-menu");
    document.addEventListener("click", function (event) {
        if(event.target.id === "create-user-menu-button" || event.target.id === "create-user-menu-icon" && hasManagementPermissions()) {
            if(addUserMenu.style.display === "flex") {
                addUserMenu.style.display = "none";
            } else {
                addUserMenu.style.display = "flex";
            }
        }
        if(event.target.id === "log-out-button" && hasManagementPermissions()) {
            const userId = event.target.getAttribute("data-user-id");
            if(userId) {
                logOut(userId);
            }
        }
        if(event.target.id === "login-button") {
            handlePasswordSubmit();
        }
        if(event.target.id === "log-all-out-button") {
            logAllOut();
        }
        if(event.target.id === "tap-rfid-button") {
            handleRFIDInput();
        }
        if(event.target.id === "add-user-button") {
            addUser();
        }
        let hideLoginModal = true;
        let hideUserData = true;
        let hideSettingsMenu = true;
        let hideAddUserMenu = true;
        if(event.target.id === "manage-button") {
            openLoginModal();
            hideLoginModal = false;
        } else if(noHideLogin.indexOf(event.target.id) >= 0) {
            hideLoginModal = false;
        }
        if(noHideSettingsMenu.indexOf(event.target.id) >= 0) {
            hideSettingsMenu = false;
        }
        if(event.target.id === "close-login-modal") {
            hideLoginModal = true;
        }
        // User boxes have an id of user-box-[user id]
        if(noHideUserData.indexOf(event.target.id) >= 0 || event.target.id.toString().startsWith("user-box-")) {
            hideUserData = false;
        }
        if(event.target.id === "user-data-close") {
            hideUserData = true;
        }
        if(noHideAddUserMenu.indexOf(event.target.id) >= 0) {
            hideAddUserMenu = false;
        }
        if(event.target.id === "") {
            hideAddUserMenu = true;
        }
        if(hideLoginModal) {
            closeLoginModal();
        }
        if(hideUserData) {
            userDataPopup.style.display = "none";
        }
        if(hideSettingsMenu) {
            settingsMenu.style.display = "none";
        }
        if(hideAddUserMenu) {
            addUserMenu.style.display = "none";
            document.getElementById("rfid-input").value = "";
            document.getElementById("name-input").value = "";
        }
    });

    const passwordInput = document.getElementById("password-input");
    const dataPopup = document.getElementById("user-data-popup");
    const nameInput = document.getElementById("name-input");
    const rfidInput = document.getElementById("rfid-input");

    document.addEventListener("keydown", function (event) {
        if(event.key === "Enter" && document.activeElement === passwordInput) {
            event.preventDefault();
            handlePasswordSubmit();
        } else if(event.key === "Enter" && (document.activeElement === nameInput || document.activeElement === rfidInput) && nameInput.value !== "" && rfidInput.value !== "") {
            event.preventDefault();
            addUser();
        } else if(event.key === "Escape") {
            console.log(addUserMenu);
            event.preventDefault();
            // Close all menus
            closeLoginModal();
            dataPopup.style.display = "none";
            settingsMenu.style.display = "none";
            addUserMenu.style.display = "none";
        }
    });

    updateLastLoginTimestamp();
    setInterval(updateLastLoginTimestamp, 1000);
    setInterval(updateActiveUserBoxes, 15000);

});