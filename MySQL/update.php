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
    isset($config["MySQL"]["updateToken"]) &&
    isset($config["MySQL"]["timeZoneOffset"])
) {
    $address = $config["MySQL"]["address"];
    $updateUsername = $config["MySQL"]["updateUsername"];
    $updatePassword = $config["MySQL"]["updatePassword"];
    $dbname = $config["MySQL"]["dbName"];
    $correctKey = $config["MySQL"]["updateToken"];
    $timeZoneOffset = $config["MySQL"]["timeZoneOffset"];
} else {
    echo json_encode(array("message" => "Invalid configuration or missing MySQL credentials."));
    die();
}

if(isset($_GET["action"]) && isset($_GET["userId"]) && isset($_GET["token"])) {
    $action = $_GET["action"];
    $userId = $_GET["userId"];
    $key = $_GET["token"];
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

if ($conn->connect_error) {
    echo json_encode(array("message" => "Unable to connect to the MySQL database: " . $conn->connect_error));
    die();
}

if ($action === "signIn") {
    $loginDurationFromNow = date('Y-m-d H:i:s', strtotime("$timeZoneOffset hours"));
    // SQL query to set loggedIn to 1 and update lastLogin
    $sql = "UPDATE users SET loggedIn = 1, lastLogin = NOW() WHERE userId = $userId";
    if ($conn->query($sql) === true) {
        echo json_encode(array("message" => "User signed in successfully."));
    } else {
        echo json_encode(array("message" => "Error updating user login status: " . $conn->error));
    }
} elseif ($action === "signOut") {
    // SQL query to set loggedIn to 0 and update lastLogout
    $sql = "UPDATE users SET loggedIn = 0, lastLogout = NOW() WHERE userId = $userId";
    if ($conn->query($sql) === true) {
        $updateHoursSql = "UPDATE users SET hours = hours + (TIMESTAMPDIFF(SECOND, lastLogin, NOW()) / 3600) WHERE userId = $userId";
        if ($conn->query($updateHoursSql) === true) {
            $getTimesSql = "SELECT * FROM users WHERE userId = $userId";
            $getTimesResult = $conn->query($getTimesSql);
            if ($getTimesResult->num_rows > 0) {
                $getTimesRow = $getTimesResult->fetch_assoc();
                $loginTime = $getTimesRow["lastLogin"];
                $logoutTime = $getTimesRow["lastLogout"];
                $updateRecordsSql = "INSERT INTO records (userId, startTime, endTime) VALUES ($userId, '$loginTime', '$logoutTime')";
                if($conn->query($updateRecordsSql) === true) {
                    echo json_encode(array("message" => "User signed out successfully."));
                } else {
                    echo json_encode(array("message" => "Error updating records: " . $conn->error));
                }
            } else {
                echo json_encode(array("message" => "Error fetching user data: " . $conn->error));
            }
        } else {
            echo json_encode(array("message" => "Error updating user hours: " . $conn->error));
        }
    } else {
        echo json_encode(array("message" => "Error updating user logout status: " . $conn->error));
    }
} else {
    echo json_encode(array("message" => "Unknown action."));
}

$conn->close();
