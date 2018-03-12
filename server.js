var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var clientID = 0;
var roomList = [];
var clientList = [];
var roomTracker = 0;
var firstRoomCreated = false;

//to load static resources I was required to "include" the working directory with below line of code
app.use(express.static(__dirname));

app.get('/', function(req, res) {
	//res.send('<h1>Hello World!</h1>');
	res.sendFile(__dirname + '/index.html');
	
});


io.on('connection', function(socket) {

	console.log("inside of connect event serverside");
	//console.log("a user connected with socket.id: " + socket.id);
	//console.log("clientCounter: ", clientCounter);
	socket.join('connected'); //join general "connected room" to ease the broadcasting more - on join a "real" room - leave this common "connected" room. To only receive the relevant messages
	console.log("socket.rooms: ", socket.rooms);
	console.log("socket.id: ", socket.id);
	
	
	socket.username = "client" + clientID; //store username for socket serverside
	console.log("socket.username: ", socket.username);
	socket.cid = clientID; // save clientID to the socket
	console.log("socket.cid = " + socket.cid);
	clientList.push({	username: socket.username, 
								createdRoom: {name: "", pw: "", createdTime: 0}, 
								clientID: clientID,
								roomActive: false,
								intervalSet: {set: false, intervalID: null}});
								
	var clientIndex = getClientIndex(socket.cid);
	console.log("clientList[" + clientIndex + "]: ", clientList[clientIndex]);
	//[socket.cid] instead of push was used and worked soso- until disconnect fried its shit - what I instead of the "cozy" socket.cid must do here on out on serverside, is loop through clientList to find the client Im looking for.
	//socket.emit('connect', socket.cid);
	//console.log("before increment clientID: ", clientID);
	
	//on connection to the server - check if there are rooms created on the server, if so: load them and initiate roomlist update
	if(roomList.length > 0)
	{
		console.log("loading existing rooms on connect/page update.");
		socket.emit('load existing rooms on connect', roomList); //load the rooms on connect if there are any
	}
	
	//console.log("after increment clientID: ", clientID);
	
	//console.log("firstRoomCreated = " + firstRoomCreated);	
	
	
	if(firstRoomCreated && !clientList[clientIndex].intervalSet.set)
	{
		//updateLobbyList = true; //this will help us control "stopping" the setTimeout/interval?
		//socket.broadcast.emit('initiate roomlist update'); //, updateLobbyList // do this for all incl. creator in a room?
		socket.emit('initiate individual roomlist update');
		//if the connected client* have setInterval to false, && firstRoomCreated, then go ahead initiate timer
		//io.in('connected').emit('initiate roomlist update'); //broadcast to ALL connected to start updating createdtimer on connect if rooms have been previously created.
		
		//socket.emit('initiate roomlist update'); // , updateLobbyList // should be done for all clients even the one in a game room in background (?) so that when the creator leaves the room hes in he has an updated list //.in('connected') on the other hand - useless to have it update when user in another "room"? have this handled by web worker later ? indefinitely until called off for all connected sockets?
		console.log("broadcasting initiate roomlist update -- should only happen for 1st created room - and when client in room leaves room");
	}
	
	clientID += 1;
	
	
});

//further "upgrade" this function to be "getArrayValueIndex(arr, needle)? or someth?
function getClientIndex(clientID) {
	var clientIndex = -1;
	for(var i = 0; i < clientList.length; i++)
	{
		if(clientList[i].clientID == clientID)
		{
			clientIndex = i;
		}
	}
	
	return clientIndex;
}

