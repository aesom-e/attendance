<?php
if($argc < 3) {
    die("Usage: php $argv[0] <action> <userId/'rfidKey'> [keyValue]\n");
}

$action = $argv[1];
$rfidKey = null;
$userId = null;

if($argc == 4) {
    if($argv[2] === "rfidKey") {
        $rfidKey = $argv[3];
    } else {
        die("Invalid argument: $argv[2]");
    }
} elseif($argc == 3) {
    $userId = $argv[2];
}

$configFile = "../config.json";
$config = json_decode(file_get_contents($configFile), true);
if($config) {
    $servername = $config["MySQL"]["address"];
    $username = $config["MySQL"]["apiUsername"];
    $password = $config["MySQL"]["apiPassword"];
    $dbname = $config["MySQL"]["dbName"];
} else {
    die("config.json error");
}

$conn = new mysqli($servername, $username, $password, $dbname);

if($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if($action === "getName") {
    // Check if either "userId" or "rfidKey" is provided
    if($userId !== null || $rfidKey !== null) {
        if($userId !== null) {
            $sql = "SELECT name FROM users WHERE userId = ?";
        } elseif($rfidKey !== null) {
            $sql = "SELECT name FROM users WHERE rfidKey = ?";
        }

        $stmt = $conn->prepare($sql);

        // Bind the appropriate parameter
        if($userId !== null) {
            $stmt->bind_param("i", $userId);
        } elseif($rfidKey !== null) {
            $stmt->bind_param("s", $rfidKey);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            echo $user['name'];
        } else {
            echo "NULL";
        }
    } else {
        echo "Missing userId or rfidKey parameter.\n";
    }
} elseif($action === "isLoggedIn") {
    if($userId !== null || $rfidKey !== null) {
        if($userId !== null) {
            $sql = "SELECT loggedIn FROM users WHERE userId = ?";
        } elseif($rfidKey !== null) {
            $sql = "SELECT loggedIn FROM users WHERE rfidKey = ?";
        }

        $stmt = $conn->prepare($sql);

        if($userId !== null) {
            $stmt->bind_param("i", $userId);
        } elseif($rfidKey !== null) {
            $stmt->bind_param("s", $rfidKey);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            echo $user['loggedIn'];
        } else {
            echo "0";
        }
    } else {
        echo "Missing userId or rfidKey parameter.\n";
    }
} elseif($action === "exists") {
    if($userId !== null || $rfidKey !== null) {
        if($userId !== null) {
            $sql = "SELECT COUNT(*) as userExists FROM users WHERE userId = ?";
        } elseif($rfidKey !== null) {
            $sql = "SELECT COUNT(*) as userExists FROM users WHERE rfidKey = ?";
        }

        $stmt = $conn->prepare($sql);

        if($userId !== null) {
            $stmt->bind_param("i", $userId);
        } elseif($rfidKey !== null) {
            $stmt->bind_param("s", $rfidKey);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if($result->num_rows > 0) {
            $userExists = $result->fetch_assoc();
            echo $userExists['userExists'];
        } else {
            echo "0";
        }
    } else {
        echo "Missing userId or rfidKey parameter.\n";
    }
} else {
    echo "Invalid action.\n";
}

$conn->close();
?>
