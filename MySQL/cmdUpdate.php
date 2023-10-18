<?php
// Read the configuration from config.json
$configFile = "../config.json";
$config = json_decode(file_get_contents($configFile), true);

// Check if the configuration exists and contains the necessary MySQL credentials
if(
    $config &&
    isset($config["MySQL"]["address"]) &&
    isset($config["MySQL"]["updateUsername"]) &&
    isset($config["MySQL"]["updatePassword"]) &&
    isset($config["MySQL"]["dbName"]) &&
    isset($config["MySQL"]["timeZoneOffset"])
) {
    $address = $config["MySQL"]["address"];
    $updateUsername = $config["MySQL"]["updateUsername"];
    $updatePassword = $config["MySQL"]["updatePassword"];
    $dbname = $config["MySQL"]["dbName"];
    $timeZoneOffset = $config["MySQL"]["timeZoneOffset"];
} else {
    // Configuration is missing necessary MySQL credentials
    echo json_encode(array("message" => "Invalid configuration or missing MySQL credentials."));
    die();
}

// Parse command line arguments
if($argc < 3) {
    echo "Usage: php cmdUpdate.php <action> <userId/'rfidKey'> [rfidKey]\n";
    die();
}

$action = $argv[1];
$userId = null;
$rfidKey = null;

if($argv[2] === "rfidKey") {
    // If $argv[2] is explicitly set to "rfidKey", use the value from $argv[3] as rfidKey
    $rfidKey = $argv[3];
} else {
    // Otherwise, assume $argv[2] is the userId
    $userId = $argv[2];
}

$conn = new mysqli($address, $updateUsername, $updatePassword, $dbname);

if($conn->connect_error) {
    echo json_encode(array("message" => "Unable to connect to the MySQL database: " . $conn->connect_error));
    die();
}

if($action === "signIn") {
    // Set the login duration relative to the time zone offset
    $loginDurationFromNow = date("Y-m-d H:i:s", strtotime("$timeZoneOffset hours"));

    if($userId !== null) {
        // SQL query to set loggedIn to 1 and update lastLogin for a specific user
        $sql = "UPDATE users SET loggedIn = 1, lastLogin = NOW() WHERE userId = $userId";

        if($conn->query($sql) === true) {
            echo "1"; // Success
        } else {
            echo json_encode(array("message" => "Error updating user login status: " . $conn->error));
        }
    } elseif($rfidKey !== null) {
        // SQL query to set loggedIn to 1 and update lastLogin for a user identified by RFID key
        $sql = "UPDATE users SET loggedIn = 1, lastLogin = NOW() WHERE rfidKey = $rfidKey";

        if($conn->query($sql) === true) {
            echo "1";
        } else {
            echo json_encode(array("message" => "Error updating user login status: " . $conn->error));
        }
    }
} elseif($action === "signOut") {
    if($userId !== null) {
        // SQL query to set loggedIn to 0 and update lastLogout for a specific user
        $sql = "UPDATE users SET loggedIn = 0, lastLogout = NOW() WHERE userId = $userId";

        if($conn->query($sql) === true) {
            // SQL query to update user hours and create a record
            $updateHoursSql = "UPDATE users SET hours = hours + (TIMESTAMPDIFF(SECOND, lastLogin, NOW()) / 3600) WHERE userId = $userId";

            if($conn->query($updateHoursSql) === true) {
                // Fetch login and logout times
                $getTimesSql = "SELECT * FROM users WHERE userId = $userId";
                $getTimesResult = $conn->query($getTimesSql);

                if($getTimesResult->num_rows > 0) {
                    $getTimesRow = $getTimesResult->fetch_assoc();
                    $loginTime = $getTimesRow["lastLogin"];
                    $logoutTime = $getTimesRow["lastLogout"];

                    // Insert a record of the user's session
                    $updateRecordsSql = "INSERT INTO records (userId, startTime, endTime) VALUES ($userId, '$loginTime', '$logoutTime')";

                    if($conn->query($updateRecordsSql) === true) {
                        echo "1";
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
    } elseif($rfidKey !== null) {
        // SQL query to set loggedIn to 0 and update lastLogout for a user identified by RFID key
        $sql = "UPDATE users SET loggedIn = 0, lastLogout = NOW() WHERE rfidKey = $rfidKey";

        if($conn->query($sql) === true) {
            // SQL query to update user hours and create a record
            $updateHoursSql = "UPDATE users SET hours = hours + (TIMESTAMPDIFF(SECOND, lastLogin, NOW()) / 3600) WHERE rfidKey = $rfidKey";

            if($conn->query($updateHoursSql) === true) {
                // Fetch the user's ID based on the RFID key
                $getUserIdSql = "SELECT userId FROM users WHERE rfidKey = $rfidKey";
                $result = $conn->query($getUserIdSql);

                if($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $userId = $row["userId"];

                    // Fetch login and logout times
                    $getTimesSql = "SELECT * FROM users WHERE userId = $userId";
                    $getTimesResult = $conn->query($getTimesSql);

                    if($getTimesResult->num_rows > 0) {
                        $getTimesRow = $getTimesResult->fetch_assoc();
                        $loginTime = $getTimesRow["lastLogin"];
                        $logoutTime = $getTimesRow["lastLogout"];

                        // Insert a record of the user's session
                        $updateRecordsSql = "INSERT INTO records (userId, startTime, endTime) VALUES ($userId, '$loginTime', '$logoutTime')";
                        if($conn->query($updateRecordsSql) === true) {
                            echo "1";
                        } else {
                            echo json_encode(array("message" => "Error updating records: " . $conn->error));
                        }
                    } else {
                        echo json_encode(array("message" => "Error fetching user data: " . $conn->error));
                    }
                }
            } else {
                echo json_encode(array("message" => "Error updating user hours: " . $conn->error));
            }
        } else {
            echo json_encode(array("message" => "Error updating user logout status: " . $conn->error));
        }
    }
}

// Close the MySQL database connection when done
$conn->close();
