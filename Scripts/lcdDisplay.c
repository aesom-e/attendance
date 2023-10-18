#include <stdio.h>
#include <string.h>
#include "libs/lcd1602.h"

void clear() {
    lcd1602SetCursor(0, 0);
    lcd1602WriteString("                ");
    lcd1602SetCursor(0, 1);
    lcd1602WriteString("                ");
    lcd1602SetCursor(0, 0);
}

int main(int argc, char** argv) {
    int rc = lcd1602Init(1, 0x27);
    if(rc) {
        printf("Failed initialization\n");
        return -1;
    }
    if(argc < 2) {
        clear();
        return 0;
    }
    clear();
    lcd1602Control(1, 0, 0);
    // Format the input correctly where it will automatically move words to the second line when the first is full
    int chars = 0;
    int secondLine = 0;
    int i;
    for(i=1;i<argc;i++) {
        chars += strlen(argv[i]);
        if(chars >= 16) {
            if(secondLine) {
                break;
            } else {
                chars = 0;
                secondLine = 1;
                lcd1602SetCursor(0, 1);
            }
        }
        lcd1602WriteString(argv[i]);
        lcd1602WriteString(" ");
        chars++;
    }
    return 0;
}