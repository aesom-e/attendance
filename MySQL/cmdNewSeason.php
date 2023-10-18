<?php
if ($argc < 2) {
    die("Usage: php $argv[0] <Date in form y-m-d>\n");
}

$seasonStartDate = $argv[1];

// Read the configuration from config.json
$configFile = "../config.json";
$config = json_decode(file_get_contents($configFile), true);

// Check if the configuration exists and contains the necessary MySQL credentials
if (
    $config &&
    isset($config["MySQL"]["address"]) &&
    isset($config["MySQL"]["updateUsername"]) &&
    isset($config["MySQL"]["updatePassword"]) &&
    isset($config["MySQL"]["dbName"])
) {
    $address = $config["MySQL"]["address"];
    $updateUsername = $config["MySQL"]["updateUsername"];
    $updatePassword = $config["MySQL"]["updatePassword"];
    $dbname = $config["MySQL"]["dbName"];
} else {
    // Configuration is missing necessary MySQL credentials
    echo json_encode(array("message" => "Invalid configuration or missing MySQL credentials."));
    die();
}

$conn = new mysqli($address, $updateUsername, $updatePassword, $dbname);

if ($conn->connect_error) {
    // Unable to connect to the MySQL database
    echo json_encode(array("message" => "Unable to connect to the MySQL database: " . $conn->connect_error));
    die();
}

// Copy data from users to pastseasons
$copyDataSql = "INSERT INTO pastseasons (userId, hours, name, seasonStartDate)
    SELECT userId, hours, name, '$seasonStartDate' FROM users WHERE hours > 0";
if ($conn->query($copyDataSql) === true) {
    echo "Data copied to pastseasons successfully.\n";

    // Reset data in the users table
    $resetDataSql = "UPDATE users SET hours = 0, loggedIn = 0, lastLogin = '0000-00-00 00:00:00', lastLogout = '0000-00-00 00:00:00'";
    if ($conn->query($resetDataSql) === true) {
        echo "Data in users table reset.\n";
    } else {
        echo "Error resetting data in users table: " . $conn->error;
    }
} else {
    echo "Error copying data to pastseasons: " . $conn->error;
}
