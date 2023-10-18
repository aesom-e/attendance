<?php
$fileHandle = fopen("needKey.flag", "w");

if($fileHandle === false) {
    die("Failed to create flag");
}

fclose($fileHandle);

while(true) {
    clearstatcache();
    if(file_exists("keyFile.txt") && is_readable("keyFile.txt")) {
        $rfidKey = (int)file_get_contents("keyFile.txt");
        if($rfidKey !== -1) {
            /* The reason it's echoed from the file and not the variable is that 32-bit integers
            only go to 2 147 483 647 and the ids can be larger than that */
            echo file_get_contents("keyFile.txt");
            unlink("keyFile.txt");
            die();
        }
    }
    usleep(100000);
}