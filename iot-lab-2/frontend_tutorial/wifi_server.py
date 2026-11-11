import socket
import json
# import random
import time 
import picar_4wd as fc
from picar_4wd import encoders

HOST = "192.168.1.179" # IP address of your Raspberry PI
PORT = 65432          # Port to listen on (non-privileged ports are > 1023)

# distance = 0
direction = "stop"
COMMANDS = ["forward", "backward", "left", "right", "stop"]

POWER = 50

WATCHDOG_TIMEOUT = 2
last_contact = time.time()

def drive(command):
    if command == "forward":
        fc.forward(POWER)
    elif command == "backward":
        fc.backward(POWER)
    elif command == "left":
        fc.turn_left(POWER)
    elif command == "right":
        fc.turn_right(POWER)
    else:
        fc.stop()


def read_temperature():
    with open("/sys/class/thermal/thermal_zone0/temp") as f:
        return int(f.read()) / 1000

def get_status():
    #global distance
    #distance += 1
    left_cm, right_cm = encoders.distance_cm() 
    return {
        "temperature": read_temperature(),
        "direction": direction,
        "speed": round(fc.speed_val(), 1),
        "distance": round((left_cm + right_cm)/2, 1),
    }

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((HOST, PORT))
    s.listen()
    s.settimeout(0.5)

    fc.start_speed_thread() 

    try:
        while 1:
            silence = time.time() - last_contact
            if silence > WATCHDOG_TIMEOUT and direction != "stop":
                direction = "stop"
                drive("stop")
                print(f"WATCHDOG: no contact for {silence:.1f}s, stopping")
            try:
                client, clientInfo = s.accept()
            except socket.timeout:
                continue

            print("server recv from: ", clientInfo)
            data = client.recv(1024)      # receive 1024 Bytes of message in binary format
            last_contact = time.time()

            request = data.decode().strip()
            print(clientInfo, "sent:", request)

            if request in COMMANDS:
                direction = request
                drive(direction)
            elif request == "status":
                pass
            else:
                print("unkown command:", request)

            message = json.dumps(get_status())
            print(message)
            client.sendall(message.encode())
            client.close()
 
    except KeyboardInterrupt: 
        print("Closing socket")
    finally:
        fc.stop()
        print("motors stopped")
