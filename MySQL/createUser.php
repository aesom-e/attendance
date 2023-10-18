<?php

// Read the configuration from config.json
$configFile = "../config.json";
$config = json_decode(file_get_contents($configFile), true);

// Check if the configuration exists and contains the necessary MySQL credentials
if (
    $config &&
    isset($config["MySQL"]["address"]) &&
    isset($config["MySQL"]["updateUsername"]) &&
    isset($config["MySQL"]["updatePassword"]) &&
    isset($config["MySQL"]["dbName"]) &&
    isset($config["MySQL"]["createUserToken"])
) {
    $address = $config["MySQL"]["address"];
    $updateUsername = $config["MySQL"]["updateUsername"];
    $updatePassword = $config["MySQL"]["updatePassword"];
    $dbname = $config["MySQL"]["dbName"];
    $correctKey = $config["MySQL"]["createUserToken"];
} else {
    // Configuration is missing necessary MySQL credentials
    echo json_encode(array("message" => "Invalid configuration or missing MySQL credentials."));
    die();
}

if(isset($_GET['rfid']) && isset($_GET['name']) && isset($_GET['token'])) {
    $rfidKey = $_GET['rfid'];
    $name = $_GET['name'];
    $key = $_GET['token'];
    // Check that $name is any number between 1 and 12 characters long
    if (!preg_match('/^[0-9]{1,12}$/', $rfidKey)) {
        echo json_encode(array("message" => "Invalid rfid parameter: [0-9] 1 - 12 numbers."));
        die();
    }
    // Check that $name is anything between 1 and 32 characters long
    if (!preg_match('/^.{1,32}$/', $name)) {
        echo json_encode(array("message" => "Invalid name parameter: 1 -  32 letters."));
        die();
    }
} else {
    // Invalid request parameters
    echo json_encode(array("message" => "Invalid request parameters."));
    die();
}

if($key !== $correctKey) {
    echo "<h1>FORBIDDEN TOKEN</h1>";
    die();
}

// Create a connection to the MySQL database
$conn = new mysqli($address, $updateUsername, $updatePassword, $dbname);

$checkUserSql = "SELECT COUNT(*) FROM users WHERE rfidKey = '$rfidKey'";
$checkUserResult = $conn->query($checkUserSql);

if ($checkUserResult) {
    $rowCount = $checkUserResult->fetch_row()[0];
    if ($rowCount > 0) {
        echo "RFID already exists";
    } else {
        // Insert the new user if the RFID key doesn't exist
        $sql = "INSERT INTO users (name, hours, rfidKey, loggedIn, lastLogin, lastLogout)
                VALUES ('$name', 0, '$rfidKey', 0, '0000-00-00 00:00:00.000000', '0000-00-00 00:00:00.000000')";

        if ($conn->query($sql) === true) {
            echo "User created successfully";
        } else {
            echo "Error creating user: " . $conn->error;
        }
    }
} else {
    echo "Error checking user: " . $conn->error;
}

if ($conn->connect_error) {
    echo json_encode(array("message" => "Unable to connect to the MySQL database: " . $conn->connect_error));
    die();
}

$conn->close();
