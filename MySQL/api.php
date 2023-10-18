<?php
// Check for a valid token
if (isset($_GET['token'])) {
    $clientToken = $_GET['token'];
    $expectedToken = 'GiveData';

    if ($clientToken !== $expectedToken) {
        echo "<h1>FORBIDDEN TOKEN</h1>";
        die();
    }
} else {
    echo "<h1>FORBIDDEN</h1>";
    die();
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

// Create a connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

header("Content-Type: application/json");

// Handle API requests
if(isset($_GET["action"])) {
    $action = $_GET["action"];
    if($action === "getUsers") {
        if(isset($_GET["userId"])) {
            // Fetch data for a specific user by userId using prepared statement
            $userId = $_GET["userId"];
            $sql = "SELECT * FROM users WHERE userId = ?";

            $stmt = $conn->prepare($sql);

            $stmt->bind_param("i", $userId);

            $stmt->execute();

            $result = $stmt->get_result();

            if($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                echo json_encode($user);
            } else {
                echo json_encode(array("message" => "User not found."));
            }
        } else {
            // Fetch data for all users
            $sql = "SELECT * FROM users";
            $result = $conn->query($sql);
            if($result->num_rows > 0) {
                $users = array();
                while ($row = $result->fetch_assoc()) {
                    $users[] = $row;
                }
                echo json_encode($users);
            } else {
                echo json_encode(array("message" => "No users found."));
            }
        }
    } elseif($action === "getLoggedInUsers") {
        // Fetch data for logged-in users
        $sql = "SELECT * FROM users WHERE loggedIn = 1";
        $result = $conn->query($sql);
        if($result->num_rows > 0) {
            $loggedInUsers = array();
            while($row = $result->fetch_assoc()) {
                $loggedInUsers[] = $row;
            }
            echo json_encode($loggedInUsers);
        } else {
            echo json_encode(array("message" => "No logged-in users found."));
        }
    } elseif($action === "getName") {
        if(isset($_GET["userId"]) || isset($_GET["rfidKey"])) {
            // Check if either "userId" or "rfidKey" is provided
            $userId = isset($_GET["userId"]) ? $_GET["userId"] : null;
            $rfidKey = isset($_GET["rfidKey"]) ? $_GET["rfidKey"] : null;

            if($userId !== null) {
                $sql = "SELECT name FROM users WHERE userId = ?";
            } elseif ($rfidKey !== null) {
                $sql = "SELECT name FROM users WHERE rfidKey = ?";
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
                foreach($user as $line) {
                    echo $line;
                }
            } else {
                echo "NULL";
            }
        } else {
            echo json_encode(array("message" => "No userId or rfidKey provided."));
        }
    } elseif($action === "isLoggedIn") {
        if(isset($_GET["userId"]) || isset($_GET["rfidKey"])) {
            $userId = $_GET["userId"];
            $rfidKey = $_GET["rfidKey"];

            // Check if the user is logged in based on userId or rfidKey
            if (isset($userId)) {
                $sql = "SELECT loggedIn FROM users WHERE userId = $userId";
            } elseif (isset($rfidKey)) {
                $sql = "SELECT loggedIn FROM users WHERE rfidKey = $rfidKey";
            }

            $result = $conn->query($sql);

            if($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                echo $user["loggedIn"];
            } else {
                echo json_encode(array("message" => "User not found."));
            }
        } else {
            echo json_encode(array("message" => "Missing userId or rfidKey parameter."));
        }
    } elseif($action === "exists") {
        if(isset($_GET["userId"]) || isset($_GET["rfidKey"])) {
            $userId = $_GET["userId"];
            $rfidKey = $_GET["rfidKey"];

            // Check if the user exists based on userId or rfidKey
            if(isset($userId)) {
                $sql = "SELECT COUNT(*) as userExists FROM users WHERE userId = $userId";
            } elseif (isset($rfidKey)) {
                $sql = "SELECT COUNT(*) as userExists FROM users WHERE rfidKey = $rfidKey";
            }

            $result = $conn->query($sql);

            if($result->num_rows > 0) {
                $userExists = $result->fetch_assoc();
                echo $userExists["userExists"];
            } else {
                echo json_encode(array("message" => "Error checking user existence."));
            }
        } else {
            echo json_encode(array("message" => "Missing userId or rfidKey parameter."));
        }
    } elseif($action === "getSeasonStartDates") {
        $sql = "SELECT DISTINCT seasonStartDate FROM pastseasons";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            $seasonStartDates = array();
            while ($row = $result->fetch_assoc()) {
                $seasonStartDates[] = $row["seasonStartDate"];
            }
            echo json_encode($seasonStartDates);
        } else {
            echo json_encode(array("message" => "No season start dates found."));
        }
    } elseif($action === "filterBySeasonStartDate") {
        if(isset($_GET["seasonStartDate"])) {
            $selectedSeasonStartDate = $_GET["seasonStartDate"];

            if($selectedSeasonStartDate === "all") {
                $sql = "SELECT * FROM pastseasons";
            } else {
                $sql = "SELECT * FROM pastseasons WHERE seasonStartDate = $selectedSeasonStartDate";
            }

            $stmt = $conn->prepare($sql);

            if($selectedSeasonStartDate !== "all") {
                $stmt->bind_param("s", $selectedSeasonStartDate);
            }

            $stmt->execute();
            $result = $stmt->get_result();

            if($result->num_rows > 0) {
                $seasons = array();
                while($row = $result->fetch_assoc()) {
                    $seasons[] = $row;
                }
                echo json_encode($seasons);
            } else {
                echo json_encode(array("message" => "No data found for the selected seasonStartDate."));
            }
        } else {
            echo json_encode(array("message" => "No seasonStartDate provided."));
        }
    }
} else {
    echo json_encode(array("message" => "Invalid action."));
}

// Close the database connection
$conn->close();
?>
