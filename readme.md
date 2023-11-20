# Attendance Tracker

## Credit

Thanks to Larry Bank for the lcd1602 library. 
https://github.com/bitbank2/LCD1602

And jpedrodias for the case 3d models. 
https://www.thingiverse.com/thing:3070519

## First time setup

### Installation
This installation is done on a raspberry pi 4 (specifically a pi 4 b running on the 32 bit debian based raspberry pi OS)

First, run this code
```shell
sudo apt install php -y

sudo apt install php-mysql -y

sudo ln -s /etc/php/[version]/mods-available/mysqli.ini /etc/php/[version]/apache2/conf.d/

sudo service apache2 restart

# Set raspberry pi config
sudo raspi-config nonint do_i2c 0
sudo raspi-config nonint do_spi 0

# Python libraries
sudo pip3 install mfrc522
sudo pip3 install GPIO

# Giving the web user permissions to read from the RFID reader
sudo usermod -a -G spi www-data
sudo usermod -a -G gpio www-data
```

Then move the project files to /var/www/html

```shell
sudo chmod 777 /var/www/html/Scripts
```

### MySQL and website setup

As a note, this application has not been built with security in mind

Run these commands:
```shell
sudo apt install mariadb-server -y

sudo mysql_secure_installation
# Options at install:
# Just press enter for the "Enter current password for root"
# Then enter 'y' for everything else

sudo mysql -u root -p
# Enter the password you setup in the last step
```

Once in the MySQL command line enter these SQL commands:
```sql
CREATE DATABASE attendance;

USE attendance;

CREATE TABLE `attendance`.`users` (`userId` INT UNSIGNED NOT NULL AUTO_INCREMENT, 
    `name` VARCHAR(32) NOT NULL, 
    `hours` DECIMAL(10,2) UNSIGNED NOT NULL, 
    `rfidKey` BIGINT UNSIGNED UNIQUE NOT NULL, 
    `loggedIn` BOOLEAN NOT NULL,
     `lastLogin` DATETIME NOT NULL DEFAULT '0000-00-00 00:00:00', 
     `lastLogout` DATETIME NOT NULL DEFAULT '0000-00-00 00:00:00', 
     PRIMARY KEY (`userId`))
     ENGINE = InnoDB;

DESC `users`;
/*
Your table should look like this

+------------+------------------------+------+-----+---------------------+----------------+
| Field      | Type                   | Null | Key | Default             | Extra          |
+------------+------------------------+------+-----+---------------------+----------------+
| userId     | int(10) unsigned       | NO   | PRI | NULL                | auto_increment |
| name       | varchar(32)            | NO   |     | NULL                |                |
| hours      | decimal(10,2) unsigned | NO   |     | NULL                |                |
| rfidKey    | bigint(20) unsigned    | NO   | UNI | NULL                |                |
| loggedIn   | tinyint(1)             | NO   |     | NULL                |                |
| lastLogin  | datetime               | NO   |     | 0000-00-00 00:00:00 |                |
| lastLogout | datetime               | NO   |     | 0000-00-00 00:00:00 |                |
+------------+------------------------+------+-----+---------------------+----------------+
*/

CREATE TABLE `attendance`.`pastseasons` (`userId` INT UNSIGNED NOT NULL, 
    `hours` DECIMAL(10,2) UNSIGNED NOT NULL, `name` VARCHAR(32) NOT NULL, 
    `seasonStartDate` DATE NOT NULL) ENGINE = InnoDB;

DESC `pastseasons`;

/*
+-----------------+------------------------+------+-----+---------+-------+
| Field           | Type                   | Null | Key | Default | Extra |
+-----------------+------------------------+------+-----+---------+-------+
| userId          | int(10) unsigned       | NO   |     | NULL    |       |
| hours           | decimal(10,2) unsigned | NO   |     | NULL    |       |
| name            | varchar(32)            | NO   |     | NULL    |       |
| seasonStartDate | date                   | NO   |     | NULL    |       |
+-----------------+------------------------+------+-----+---------+-------+
*/

CREATE TABLE `attendance`.`records` (`recordId` INT UNSIGNED NOT NULL AUTO_INCREMENT, 
    `userId` INT UNSIGNED NOT NULL, `startTime` DATETIME NOT NULL, 
    `endTime` DATETIME NOT NULL,
    `notes` VARCHAR(64), 
    PRIMARY KEY (`recordId`)) ENGINE = InnoDB;

DESC `records`;

/*
+-----------+------------------+------+-----+---------+----------------+
| Field     | Type             | Null | Key | Default | Extra          |
+-----------+------------------+------+-----+---------+----------------+
| recordId  | int(10) unsigned | NO   | PRI | NULL    | auto_increment |
| userId    | int(10) unsigned | NO   |     | NULL    |                |
| startTime | datetime         | NO   |     | NULL    |                |
| endTime   | datetime         | NO   |     | NULL    |                |
| notes     | varchar(64)      | YES  |     | NULL    |                |
+-----------+------------------+------+-----+---------+----------------+
*/

CREATE USER 'php'@'localhost' IDENTIFIED BY 'thisDataIsPublicIdiot';

GRANT SELECT ON `attendance`.`users` TO 'php'@'localhost';

GRANT SELECT ON `attendance`.`pastseasons` TO 'php'@'localhost';

GRANT SELECT ON `attendance`.`records` TO 'php'@'localhost';

CREATE USER 'update'@'localhost' IDENTIFIED BY 'thisIsInsecure';

GRANT SELECT, INSERT, UPDATE on `attendance`.`users` to 'update'@'localhost';

GRANT SELECT, INSERT, UPDATE on `attendance`.`pastseasons` to 'update'@'localhost';

GRANT SELECT, INSERT, UPDATE on `attendance`.`records` to 'update'@'localhost';

FLUSH PRIVILEGES;

QUIT;
```

If you would like to create a test user to check if everything is working run this:
```shell
sudo mysql -u root -p
```
```sql
USE attendance;

INSERT INTO `users` (`name`, `hours`, `rfidKey`, `loggedIn`, 
    `lastLogin`, `lastLogout`) 
    VALUES ('Test User', '1', '0', '0', '0000-00-00 00:00:00.000000', 
    '0000-00-00 00:00:00.000000');

/*
Go to the hosted site and check if "Test User" is displaying, if so, continue
If the user is not showing up, check the settings in api.php & update.php
to make sure it lines up with what you're using
*/

DELETE FROM `users` WHERE `users`.`name` = 'Test User';

QUIT;
```

Edit the apache2 configuration file
```shell
sudo nano /etc/apache2/apache2.conf

# Change this: 
# <Directory /var/www/>
#        Options Indexes FollowSymLinks
#        AllowOverride None
#        Require all granted
# </Directory>

# To this:
# <Directory /var/www/>
#        Options Indexes FollowSymLinks
#        AllowOverride All
#        Require all granted
# </Directory>
```

Add scripts to crontab
```shell
sudo crontab -e

# choose 1
```

Add this to the end of crontab:
```text
@reboot cd /var/www/html/Scripts && /var/www/html/Scripts/main
0 0 * * * cd /var/www/html/MySQL/ && /usr/bin/php /var/www/html/MySQL/cmdLogOutWithoutCredit.php all
```

### Config

The config file is located in config.json

It's configured with default values so make sure to change them

```json
// Just a note, json doesn't allow comments so don't paste any of this
{
  "managingPassword": "login", // Update
  "MySQL": {
    "address": "localhost",
    "dbName": "attendance",
    "apiUsername": "php",
    "apiPassword": "thisDataIsPublicIdiot", // Update
    "updateToken": "UpdatePlease", // Update
    "updateUsername": "update",
    "updatePassword": "thisIsInsecure", // Update
    "createUserToken": "UserAddPlease", // Update
    "timeZoneOffset": "0:00" // Set this to your timezone (ex. EST: -5:00)
  },
  "updateActiveUsersDelayInSeconds": 5,
  /* year (2023-01-01 will appear as 2023)
  month (2023-01-01 will appear as 2023-01)
  day (2023-01-01 will appear as 2023-01) */
  "seasonDisplay": "year"
}

```

### Using the site

Reboot the pi and wait for the LCD to show the machine's ip

It should look like 192.168.x.x

Navigate to that address on your device to access the website

### Management permissions

In the top right corner of the website there should be a blue "Manage" button

Click it and enter the password set in config.json as "managingPassword" (default: login)

You should be able to press enter and gain management permissions for 30 days which includes the ability to add users,
view user data, and log users out

## A notice of security risks

This script was not written with security in mind

Given that, the user data is easily modified by a malicious actor

I have not given much thought to securing the back end from users who want to read and update the database

This should not be used in a situation where security is necessary

## Seasons and logging

### Creating a new season

php MySQL/cmdNewSeason.php <Date in yyyy-mm-dd>

The season should automatically appear in the dropdown under the Data section of the website

### Logging 

Logging is automatically done by the php scripts

SQL commands run directly will not be logged

To view logs run these commands inside MySQL:

```sql
USE attendance;
SELECT * FROM records;

# Filtering via userId
SELECT * FROM records WHERE userId = [User id];

```

