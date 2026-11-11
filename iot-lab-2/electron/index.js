document.onkeydown = updateKey;
document.onkeyup = resetKey;
window.onload = update_data;

var server_port = 65432;
var server_addr = "192.168.1.179";   // the IP address of your Raspberry PI

function client(message){
    
    const net = require('net');
    // var input = document.getElementById("message").value;

    const client = net.createConnection({ port: server_port, host: server_addr }, () => {
        // 'connect' listener.
        console.log('connected to server!');
        // send the message
        client.write(`${message}\r\n`);
    });
    
    // get the data from the server
    client.on('data', (data) => {
        var text = data.toString();
        var status = JSON.parse(text);
        
        document.getElementById("temperature").innerHTML = status.temperature.toFixed(1) + " °C";
        document.getElementById("direction").innerHTML = status.direction;
        document.getElementById("speed").innerHTML = status.speed  + " cm/s";
        document.getElementById("distance").innerHTML = status.distance + " cm";

        document.getElementById("bluetooth").innerHTML = data;

        console.log(data.toString());
        client.end();
        client.destroy();
    });

    client.on('end', () => {
        console.log('disconnected from server');
    });


}

// Lookup table: for each driving key code, which word to send and which arrow to light up
var KEYS = {
    87: { command: "forward",  arrow: "upArrow" },     // W
    83: { command: "backward", arrow: "downArrow" },   // S
    65: { command: "left",     arrow: "leftArrow" },   // A
    68: { command: "right",    arrow: "rightArrow" }   // D
};

var heldKey = null;     // the driving key currently held down (null = none)
var stopTimer = null;   // a "stop" waiting to be sent (null = none waiting)

// turn all four arrows grey
function greyArrows() {
    document.getElementById("upArrow").style.color = "grey";
    document.getElementById("downArrow").style.color = "grey";
    document.getElementById("leftArrow").style.color = "grey";
    document.getElementById("rightArrow").style.color = "grey";
}

// key pressed
function updateKey(e) {
    e = e || window.event;

    var key = KEYS[e.keyCode];          // look the key up in the table
    if (!key) {
        return;                         // not W/A/S/D: ignore it
    }

    // A stop is waiting? This press cancels it (it was a fake release)
    if (stopTimer !== null) {
        clearTimeout(stopTimer);
        stopTimer = null;
    }

    // Same key as before (still held / auto-repeat): nothing new to tell the Pi
    if (e.keyCode == heldKey) {
        return;
    }

    // A genuinely new key: remember it, light its arrow, tell the Pi
    heldKey = e.keyCode;
    greyArrows();
    document.getElementById(key.arrow).style.color = "green";
    client(key.command);
}

// key released
function resetKey(e) {
    e = e || window.event;

    // Released a key we're not driving with? Ignore it
    if (e.keyCode != heldKey) {
        return;
    }

    // Don't stop right away: wait 100 ms. If a press of a driving key
    // comes in meanwhile, updateKey cancels this (it was a fake release).
    stopTimer = setTimeout(function(){
        stopTimer = null;
        heldKey = null;
        greyArrows();
        client("stop");
    }, 100);
}



// update data for every 1000ms
function update_data(){
    setInterval(function(){
        // get image from python server
        client("status");
    }, 1000);
}
