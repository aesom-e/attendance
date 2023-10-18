<?php
// Load the config.json file
$configPath = "../config.json";
$config = json_decode(file_get_contents($configPath), true);

if (isset($_GET["token"])) {
    $token = $_GET["token"];
    if ($token !== "FetchPlease") {
        echo "<h1>FORBIDDEN TOKEN</h1>";
        die();
    }
} else {
    echo "Missing token parameter";
}

// Handle action
if (isset($_GET["action"])) {
    $action = $_GET["action"];
    if ($action === "updateToken") {
        if (isset($config["MySQL"]["updateToken"])) {
            echo $config["MySQL"]["updateToken"];
        } else {
            echo "updateToken not found";
        }
    } elseif ($action === "getManagementPassword") {
        if (isset($config["managingPassword"])) {
            echo $config["managingPassword"];
        } else {
            echo "managingPassword not found";
        }
    } elseif ($action === "createUserToken") {
        if (isset($config["MySQL"]["createUserToken"])) {
            echo $config["MySQL"]["createUserToken"];
        } else {
            echo "createUserToken not found";
        }
    } elseif ($action === "getSeasonDisplay") {
        if (isset($config["seasonDisplay"])) {
            echo json_encode($config["seasonDisplay"]);
        } else {
            echo "seasonDisplay not found";
        }
    } else {
        echo "Unsupported action";
    }
} else {
    echo "Missing action parameter";
}
