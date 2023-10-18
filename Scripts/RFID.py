from mfrc522 import SimpleMFRC522
import RPi.GPIO as GPIO
GPIO.setwarnings(False)
def read_rfid():
    reader = SimpleMFRC522()
    id, text = reader.read()
    return int(id)

id = read_rfid()
print(id)
