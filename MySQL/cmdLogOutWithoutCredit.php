<?php

// Check for the correct number of command line arguments
if($argc < 2) {
    die("Usage: php $argv[0] <userId>\n");
}

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
    echo json_encode(array("message" => "Invalid configuration or missing MySQL credentials."));
    die();
}

$conn = new mysqli($address, $updateUsername, $updatePassword, $dbname);

if($conn->connect_error) {
    echo json_encode(array("message" => "Unable to connect to the MySQL database: " . $conn->connect_error));
    die();
}

if($argv[1] !== "all") {
    // Logout a specific user
    $createRecordSql = "INSERT INTO records (userId, startTime, endTime) SELECT userId, lastLogin, CONCAT(CURDATE(), ' 00:00:00') FROM users WHERE userId = $argv[1]";
    $sql = "UPDATE users SET loggedIn = 0, lastLogout = CONCAT(CURDATE(), ' 00:00:00') WHERE userId = $argv[1]";
} else {
    // Logout all logged-in users
    $createRecordSql = "INSERT INTO records (userId, startTime, endTime) SELECT userId, lastLogin, CONCAT(CURDATE(), ' 00:00:00') FROM users WHERE loggedIn = 1";
    $sql = "UPDATE users SET loggedIn = 0, lastLogout = CONCAT(CURDATE(), ' 00:00:00') WHERE loggedIn = 1";
}

// Execute SQL queries to log out users and create records
if($conn->query($createRecordSql) === true && $conn->query($sql) === true) {
    echo "1";
} else {
    die("Failure: " . $conn->error);
}

$conn->close();
