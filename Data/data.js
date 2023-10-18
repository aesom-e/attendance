// data.js
var sortingDropdown;
var isLightMode = false;
var hasTableBorder = false;

function toggleSettingsMenu() {
    const settingsMenu = document.querySelector(".settings-menu");
    if(settingsMenu.style.display === "block") {
        settingsMenu.style.display = "none";
    } else {
        settingsMenu.style.display = "block";
    }
}

function hideSettingsMenu() {
    const settingsMenu = document.querySelector(".settings-menu");
    settingsMenu.style.display = "none";
}


function toggleTheme() {
    const themeToggle = document.getElementById("themeToggle");
    isLightMode = !isLightMode;
    if(isLightMode) {
        document.body.classList.add("light-mode");
        themeToggle.innerText = "Dark Mode";
        document.querySelector(".settings-icon img").classList.add("light-mode");
        document.querySelector(".filter-icon img").classList.add("light-mode");
        document.querySelector(".search-container").classList.add("light-mode");
        document.querySelector(".search-container input[type='text']").classList.add("light-mode");
    } else {
        themeToggle.innerText = "Light Mode";
        document.body.classList.remove("light-mode");
        document.querySelector(".settings-icon img").classList.remove("light-mode");
        document.querySelector(".filter-icon img").classList.remove("light-mode")
        document.querySelector(".search-container").classList.add("light-mode");
        document.querySelector(".search-container input[type='text']").classList.remove("light-mode");
    }
    setCookie("theme", isLightMode ? "light" : "dark", 365);
}

function toggleTableBorder() {
    const borderToggle = document.getElementById("borderToggle");
    hasTableBorder = !hasTableBorder;

    // Set the border directly on the table and its cells
    const table = document.querySelector("table");
    const th = document.querySelectorAll("th");
    const td = document.querySelectorAll("td");
    const borderStyle = hasTableBorder ? "2px solid" : "2px solid transparent";

    table.style.border = borderStyle;

    for(let i = 0; i < th.length; i++) {
        th[i].style.border = borderStyle;
    }

    for(let i = 0; i < td.length; i++) {
        td[i].style.border = borderStyle;
    }

    // Store the border preference in a cookie
    setCookie("border", hasTableBorder ? "enabled" : "disabled", 365); // 365 days expiration

    // Update the button text
    borderToggle.innerText = hasTableBorder ? "Disable Border" : "Enable Border";
}

function toggleFilterMenu() {
    const filterMenu = document.querySelector(".filter-menu"); // Replace with the actual class or ID of your filter menu
    if(filterMenu.style.display === "block") {
        filterMenu.style.display = "none";
    } else {
        filterMenu.style.display = "block";
    }
}

function hideFilterMenu() {
    const filterMenu = document.querySelector(".filter-menu");
    filterMenu.style.display = "none";
}

function applySorting(selectedOption) {
    const table = document.querySelector("table");
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    // Sort the rows based on the selected sorting option
    rows.sort((a, b) => {
        const cellA = a.querySelector("td:first-child").textContent.trim();
        const cellB = b.querySelector("td:first-child").textContent.trim();

        if(selectedOption === "name-asc") {
            return cellA.localeCompare(cellB);
        } else if(selectedOption === "name-desc") {
            return cellB.localeCompare(cellA);
        } else if(selectedOption === "hours-asc" || selectedOption === "hours-desc") {
            const hoursA = parseFloat(a.querySelector("td:last-child").textContent.trim());
            const hoursB = parseFloat(b.querySelector("td:last-child").textContent.trim());

            if(!isNaN(hoursA) && !isNaN(hoursB)) {
                return selectedOption === "hours-asc" ? hoursA - hoursB : hoursB - hoursA;
            }
        }

        // Default sorting option
        return 0;
    });

    // Reorder the rows in the table
    setCookie("sorting", selectedOption, 365);
    tbody.innerHTML = "";
    rows.forEach(row => tbody.appendChild(row));
}

// Automatically submit the form when the dropdown selection changes
sortingDropdown = document.getElementById("sorting");
if(sortingDropdown) {
    sortingDropdown.addEventListener("change", function () {
        this.form.submit();
    });
}


function filterTable() {
    let input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("search");
    filter = input.value.toUpperCase();
    table = document.querySelector("table");
    tr = table.getElementsByTagName("tr");

    for(i = 1; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0]; // Assuming the name is in the first column
        if(td) {
            txtValue = td.textContent || td.innerText;
            if(txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

async function fetchAndPopulateTable() {
    try {
        let response = await fetch("../MySQL/api.php?action=getUsers&token=GiveData");
        const data = await response.json();

        if(response.ok) {
            const table = document.querySelector("table");
            const tbody = document.createElement("tbody");

            // Filter out entries with 0 hours
            const filteredData = data.filter(entry => entry.hours > 0);

            // Loop through the filtered data and create table rows
            let totalHours = 0;

            filteredData.forEach(entry => {
                const row = document.createElement("tr");
                const nameCell = document.createElement("td");
                const hoursCell = document.createElement("td");

                nameCell.textContent = entry.name;
                const hours = parseFloat(entry.hours); // Parse the hours as a floating-point number
                hoursCell.textContent = hours;
                totalHours += hours;

                row.appendChild(nameCell);
                row.appendChild(hoursCell);
                tbody.appendChild(row);
            });

            // Create the "Total Hours" row
            const totalRow = document.createElement("tr");
            const totalLabelCell = document.createElement("td");
            const totalHoursCell = document.createElement("td");

            totalLabelCell.textContent = "Total Hours";
            totalLabelCell.style.fontWeight = "bold";
            if(Number.isInteger(totalHours)) {
                totalHoursCell.textContent = totalHours.toFixed(0); // Display as integer
            } else {
                totalHoursCell.textContent = totalHours.toFixed(2); // Display with 2 decimal places
            }

            totalRow.appendChild(totalLabelCell);
            totalRow.appendChild(totalHoursCell);

            tbody.appendChild(totalRow);

            // Replace the existing table body with the new one
            table.querySelector("tbody").replaceWith(tbody);
        } else {
            console.error("Failed to fetch data:", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
    const sortingCookie = getCookie("sorting");
    if(sortingCookie) {
        applySorting(sortingCookie);
    }
    // Initialize border status based on the "border" cookie
    const borderCookie = getCookie("border");
    if(borderCookie === "enabled") {
        toggleTableBorder();
    }
}

async function filterTableBySeasonStartDate() {
    const selectedSeasonStartDate = document.getElementById("seasonStartDateSelect").value;
    setCookie("selectedSeasonStartDate", selectedSeasonStartDate, 365);
    await processDataBySeasonStartDate();
}

async function processDataBySeasonStartDate() {
    const selectedSeasonStartDate = getCookie("selectedSeasonStartDate");
    let apiUrl;
    if(selectedSeasonStartDate !== "current") {
        apiUrl = `../MySQL/api.php?action=filterBySeasonStartDate&seasonStartDate="${selectedSeasonStartDate}"&token=GiveData`;
    } else {
        // Get data normally
        apiUrl = "../MySQL/api.php?action=getUsers&token=GiveData";
    }

    try {
        let response = await fetch(apiUrl);
        if(!response.ok) {
            console.error("Failed to fetch data:", response.status, response.statusText);
            return;
        }

        let data = await response.json();

        const table = document.querySelector("table");
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = "";

        // Filter out entries with 0 hours
        const filteredData = data.filter(entry => entry.hours > 0);

        // Loop through the filtered data and create table rows
        let totalHours = 0;

        filteredData.forEach(entry => {
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            const hoursCell = document.createElement("td");

            nameCell.textContent = entry.name;
            const hours = parseFloat(entry.hours);
            hoursCell.textContent = hours;
            totalHours += hours; // Update total hours

            row.appendChild(nameCell);
            row.appendChild(hoursCell);
            tbody.appendChild(row);
        });

        // Create the "Total Hours" row
        const totalRow = document.createElement("tr");
        const totalLabelCell = document.createElement("td");
        const totalHoursCell = document.createElement("td");

        totalLabelCell.textContent = "Total Hours";
        totalLabelCell.style.fontWeight = "bold";
        if(Number.isInteger(totalHours)) {
            totalHoursCell.textContent = totalHours.toFixed(0); // Display as an integer
        } else {
            totalHoursCell.textContent = totalHours.toFixed(2); // Display with 2 decimal places
        }

        totalRow.appendChild(totalLabelCell);
        totalRow.appendChild(totalHoursCell);

        tbody.appendChild(totalRow);

        const sortingCookie = getCookie("sorting");
        if(sortingCookie) {
            applySorting(sortingCookie);
        }
    } catch (error) {
        console.error("Error processing data:", error);
    }
}


async function populateSeasonStartDateDropdown() {
    const dropdown = document.getElementById("seasonStartDateSelect");

    try {

        const seasonStartOption = document.createElement("option");
        seasonStartOption.value = "seasonStart";
        seasonStartOption.textContent = "Season Start";
        seasonStartOption.style.fontWeight = "bold";
        seasonStartOption.disabled = true; // Make it unselectable
        dropdown.appendChild(seasonStartOption);

        // Add a "Current" option as the first selectable option
        const currentOption = document.createElement("option");
        currentOption.value = "current";
        currentOption.textContent = "Current";
        dropdown.appendChild(currentOption);

        // Fetch the season start dates
        let response = await fetch("../MySQL/api.php?action=getSeasonStartDates&token=GiveData");
        const data = await response.json();

        if(response.ok) {

            // Fetch and process the "seasonDisplay" data
            const seasonDisplayResponse = await fetch("../Scripts/fetchConfig.php?action=getSeasonDisplay&token=FetchPlease");
            if(seasonDisplayResponse.ok) {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ];
                const seasonDisplayData = (await seasonDisplayResponse.text()).toString().slice(1, -1);
                if(seasonDisplayData === "year") {
                    data.forEach((date) => {
                        const option = document.createElement("option");
                        option.value = date;
                        option.textContent = new Date(date).getFullYear().toString();
                        dropdown.appendChild(option);
                    });
                } else if(seasonDisplayData === "month") {
                    data.forEach((date) => {
                        const option = document.createElement("option");
                        option.value = date;
                        option.textContent = monthNames[new Date(date).getMonth()] + " " + new Date(date).getFullYear().toString();
                        dropdown.appendChild(option);
                    });
                } else if(seasonDisplayData === "day") {
                    data.forEach((date) => {
                        const option = document.createElement("option");
                        option.value = date;
                        option.textContent = monthNames[new Date(date).getMonth()] + " " + (new Date(date).getDate() + 1).toString() + ", " + new Date(date).getFullYear().toString();
                        dropdown.appendChild(option);
                    });
                } else {
                    console.error('Invalid "seasonDisplay" data format.');
                }
            } else {
                console.error('Failed to fetch "seasonDisplay" data:', seasonDisplayResponse.status, seasonDisplayResponse.statusText);
            }
        } else {
            console.error("Failed to fetch season start dates:", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}




function goBack() {
    window.location.replace("/");
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

function selectDropdownItemByValue(dropdown, value) {
    for(let option of dropdown.options) {
        if(option.value === value) {
            option.selected = true;
            return;
        }
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    await populateSeasonStartDateDropdown();
    const seasonStartDateCookie = getCookie("selectedSeasonStartDate");
    if(seasonStartDateCookie) {
        selectDropdownItemByValue(document.getElementById("seasonStartDateSelect"), seasonStartDateCookie);
        if(seasonStartDateCookie === "current") {
            await fetchAndPopulateTable();
        } else {
            await processDataBySeasonStartDate();
        }
    } else {
        await fetchAndPopulateTable();
    }
    const themeCookie = getCookie("theme");
    if(themeCookie === "light") {
        toggleTheme(); // Enable light mode
    }
    document.addEventListener("click", function (event) {
        let hideFilter = true;
        let hideSettings = true;
        if(event.target.alt === "Filter Icon" || event.target.id === "filterTable") {
            hideFilter = false;
        } else if(event.target.alt === "Settings Icon" || event.target.id === "themeToggle" || event.target.id === "borderToggle") {
            hideSettings = false;
        }
        if(hideFilter) {
            hideFilterMenu();
        }
        if(hideSettings) {
            hideSettingsMenu();
        }
    });
});

document.addEventListener("keydown", function (event) {
    if(event.key === "Escape") {
        // Hide menus on escape key
        hideFilterMenu();
        hideSettingsMenu();
    }
});