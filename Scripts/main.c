#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/ioctl.h>
#include <netinet/in.h>
#include <net/if.h>
#include <unistd.h>
#include <arpa/inet.h>

#define lcdDisplay "./lcdDisplay"

char* getIp() {
    struct ifreq ifr;
    int n = socket(AF_INET, SOCK_DGRAM, 0);
    ifr.ifr_addr.sa_family = AF_INET;
    strncpy(ifr.ifr_name , "wlan0", IFNAMSIZ - 1);
    ioctl(n, SIOCGIFADDR, &ifr);
    close(n);
    return inet_ntoa(((struct sockaddr_in *)&ifr.ifr_addr )->sin_addr);
}

void wait(int ms) {
    sleep(ms / 1000);
}

void writeKeyToFile(long long int rfid) {
    FILE* keyFile = fopen("keyFile.txt", "w");
    if(keyFile != NULL) {
        fprintf(keyFile, "%lld", rfid);
        fclose(keyFile);
    }
}

long long int getRFID() {
    FILE* cmd = popen("/usr/bin/python3 RFID.py", "r");
    char result[64];
    while(fgets(result, sizeof(result), cmd) != NULL) {}
    pclose(cmd);
    return atoll(result);
}

int userExists(long long int rfidKey) {
    char cmdName[64];
    sprintf(cmdName, "php ../MySQL/cmdApi.php exists rfidKey %lld", rfidKey);
    FILE* cmd = popen(cmdName, "r");
    char result[8];
    while(fgets(result, sizeof(result), cmd) != NULL) {}
    pclose(cmd);
    return atoi(result);
}

int userLoggedIn(long long int rfidKey) {
    char cmdName[64];
    sprintf(cmdName, "php ../MySQL/cmdApi.php isLoggedIn rfidKey %lld", rfidKey);
    FILE* cmd = popen(cmdName, "r");
    char result[8];
    while(fgets(result, sizeof(result), cmd) != NULL) {}
    pclose(cmd);
    return atoi(result);
}

char* userName(long long int rfidKey) {
    char cmdName[128];
    sprintf(cmdName, "php ../MySQL/cmdApi.php getName rfidKey %lld", rfidKey);
    FILE* cmd = popen(cmdName, "r");
    char result[64];
    fgets(result, sizeof(result), cmd);
    pclose(cmd);
    char* resultString = strdup(result);
    return resultString;
}

int signIn(long long int rfidKey) {
    char cmdName[64];
    sprintf(cmdName, "php ../MySQL/cmdUpdate.php signIn rfidKey %lld", rfidKey);
    FILE* cmd = popen(cmdName, "r");
    char result[8];
    while(fgets(result, sizeof(result), cmd) != NULL) {}
    pclose(cmd);
    return atoi(result);
}

int signOut(long long int rfidKey) {
    char cmdName[64];
    sprintf(cmdName, "php ../MySQL/cmdUpdate.php signOut rfidKey %lld", rfidKey);
    FILE* cmd = popen(cmdName, "r");
    char result[8];
    while(fgets(result, sizeof(result), cmd) != NULL) {}
    pclose(cmd);
    return atoi(result);
}


void lcd(char* str) {
    char cmd[128];
    sprintf(cmd, "%s %s", lcdDisplay, str);
    system(cmd);
}

void clearLcd() {
    system(lcdDisplay);
}

int main() {
    clearLcd();
    wait(15000);
    char cmd[128];
    sprintf(cmd, "%s %s", lcdDisplay, getIp());
    system(cmd);
    wait(15000);
    long long int rfid;
    while(1) {
        lcd("Scan RFID Now");
        rfid = getRFID();
        // Flag that tells this program if readRfid.php needs the key or if it should process the key
        if(access("needKey.flag", F_OK) == 0) {
            writeKeyToFile(rfid);
            remove("needKey.flag");
            continue;
        }
        if(userExists(rfid)) {
            char* name = userName(rfid);
            char message[32];
            if(userLoggedIn(rfid)) {
                if(signOut(rfid)) {
                    sprintf(message, "Goodbye, %s", name);
                    lcd(message);
                } else {
                    lcd("Error signing out");
                }
            } else {
                if(signIn(rfid)) {
                    sprintf(message, "Hello, %s", name);
                    lcd(message);
                } else {
                    lcd("Error signing in");
                }
            }
            free(name);
        } else {
            lcd("RFID not tied to any user");
        }
        if(access("needKey.flag", F_OK) == 0) {
            remove("needKey.flag");
        }
        wait(2000);
        writeKeyToFile(-1);
    }
    return 0;
}
