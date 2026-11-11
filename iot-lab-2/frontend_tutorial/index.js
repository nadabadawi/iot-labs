var server_port = 65432;
var server_addr = "192.168.1.179";   // the IP address of your Raspberry PI

function to_server(name){
    fetch(`http://${server_addr}:5000/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(name)
    })
    .then(res => res.json())
    .then(data => {

    document.getElementById("greet_from_server").innerHTML =
    data.server_greet;
        console.log(data.server_greet);
    })
    .catch(err => console.log("flask error: " + err));
}

function client(){
    
    const net = require('net');
    var input = document.getElementById("myName").value;

    const client = net.createConnection({ port: server_port, host: server_addr }, () => {
        // 'connect' listener.
        console.log('connected to server!');
        // send the message
        client.write(`${input}\r\n`);
    });
    
    // get the data from the server
    client.on('data', (data) => {
        document.getElementById("greet_from_server").innerHTML = data;
        console.log(data.toString());
        client.end();
        client.destroy();
    });

    client.on('end', () => {
        console.log('disconnected from server');
    });


}

function greeting(){

    // get the element from html
    var name = document.getElementById("myName").value;
    // update the content in html
    document.getElementById("greet").innerHTML = "Hello " + name + " !";
    // send the data to the server 
    to_server(name);
    client();

}
