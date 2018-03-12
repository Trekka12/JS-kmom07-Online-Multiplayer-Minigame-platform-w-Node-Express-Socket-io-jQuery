var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var clientID = 0;
var roomList = []; //store count of activeClientsInSpecificRoom to see when its full
var clientList = [];
//var roomTracker = 0;
var firstRoomCreated = false;

//my roomList need to track people entering the rooms as well - as replacement for "oneRegisteredUser" -- to determine color of the player in the room in chat once in room
//store oneRegisteredUser as another detail variable inside of the roomList item players can join


//to load static resources I was required to "include" the working directory with below line of code
app.use(express.static(__dirname));

app.get('/', function(req, res) {
	//res.send('<h1>Hello World!</h1>');
	res.sendFile(__dirname + '/index.html');
	
});


io.on('connection', function(socket) {

	console.log("inside of connect event serverside");
	socket.join('connected'); //join general "connected room" to ease the broadcasting more - on join a "real" room - leave this common "connected" room. To only receive the relevant messages
	console.log("socket.rooms: ", socket.rooms);
	console.log("socket.id: ", socket.id);
	
	//on connection to the server - check if there are rooms created on the server, if so: load them and initiate roomlist update --- should only happen if user is registered
	//if(roomList.length > 0) //if roomlist.length > 0, and user is registered (for endproduct)
	//{
	//	console.log("loading existing rooms on connect/page update.");
	//	socket.emit('load existing rooms on connect', roomList); //load the rooms on connect if there are any
	//}
	
	
	//if(firstRoomCreated && !clientList[clientIndex].intervalSet.set) //and if username is set
	//{
		//updateLobbyList = true; //this will help us control "stopping" the setTimeout/interval?
		//socket.broadcast.emit('initiate roomlist update'); //, updateLobbyList // do this for all incl. creator in a room?
	//	socket.emit('initiate individual roomlist update');
		//if the connected client* have setInterval to false, && firstRoomCreated, then go ahead initiate timer
		//io.in('connected').emit('initiate roomlist update'); //broadcast to ALL connected to start updating createdtimer on connect if rooms have been previously created.
		
		//socket.emit('initiate roomlist update'); // , updateLobbyList // should be done for all clients even the one in a game room in background (?) so that when the creator leaves the room hes in he has an updated list //.in('connected') on the other hand - useless to have it update when user in another "room"? have this handled by web worker later ? indefinitely until called off for all connected sockets?
	//	console.log("broadcasting initiate roomlist update -- should only happen for 1st created room - and when client in room leaves room");
	//}
	
	/*
	=================================================================
			Server received emit events below
	=================================================================
	*/
	
	socket.on('user registration', function(username) {
		//a couple of scenarios to keep in mind when registering a username:
		//1. first user ever connecting
		//2. second or w/e user connecting
		//- should lead to passing on confirmation to client, having it "turn page" interface wise 
	
		//Check if username already exist within our clientList, if it does, add clientID to the name ?
		var clientNameExist = false;
		for(var i = 0; i < clientList.length; i++)
		{
			if(clientList[i].username == username)
			{
				clientNameExist = true;
				//clientIndex = i; //<- whats that for? I really don't understand it tbh..
			}
		}
		
		socket.cid = clientID; // save clientID to the socket
		console.log("socket.cid = " + socket.cid);
		
		//IF clientID == 0 OR !clientNameExisted
		if(clientID === 0 || !clientNameExist)
		{
			socket.username = username;
			console.log("inside of clientID === 0 || !clientNameExist when registering user.");
		}else {
			//if username DID exist -- (this saves us from having them retry other usernames):
			socket.username = username + clientID;
			
		}
		
		//oneRegisteredUser = true;
		
		clientList.push({	username: socket.username, 
							userChatColor: "", //(oneRegisteredUser == false ? "#0000ff" : "#ff0000"),
							createdRoom: {name: "", pw: "", createdTime: 0}, 
							clientID: clientID,
							roomActive: false,
							intervalSet: {set: false, intervalID: null},
							lastMessageSent: 0,
							lastMessage: ""});
							
		var clientIndex = getClientIndex(socket.cid);
		console.log("clientList[" + clientIndex + "]: ", clientList[clientIndex]);
		
		
		
		clientID += 1; //increment for every user ever created - but never remove on disconnect
			
		console.log("clientList: ", clientList);
		
		socket.emit('user registered', socket.username); //send back to the registering client that user was successfully regged together with username?
		
		console.log("user: " + socket.username + " is registered.");
		
		//socket.broadcast.emit('user joined', {
		//	username: socket.username,
		//	userAmount: clientCounter
		//});
	});
	
	/*
	=================================================================
			Create room received emit events below
	=================================================================
	*/
	
	socket.on('create room', function(data) {
		console.log("inside of create room serverside");
		
		var lobbyname = data.name;
		
		var pw = data.pw;
		var pwSet = false;
		//check and filter it - set to none if empty or similar
		if(pw.length > 0)
		{
			pwSet = true;
		}
		
		var clientIndex = getClientIndex(socket.cid);
		
		//if interval is set to true when creating a room (newly connected chap - then clear the interval - no interval function running whilst in the room)
		if(clientList[clientIndex].intervalSet.set)
		{
			socket.emit('stop lobby update interval', clientList[clientIndex].intervalSet.intervalID);
		}
		
		clientList[clientIndex].createdRoom.name = lobbyname;
		clientList[clientIndex].createdRoom.pw = (pwSet ? pw : "none");
		clientList[clientIndex].createdRoom.createdTime = Date.now();
		
		console.log("clientList[" + clientIndex + "] after room creation: ", clientList[clientIndex]);
		
		roomList.push({name: lobbyname, 
						pw: (pwSet ? pw : "none"),
						firstUserJoined: true, 
						activeUserNmbr: 1,
						createdTime: clientList[clientIndex].createdRoom.createdTime}); //do I need creator in this?
		console.log("roomList: ", roomList);
		//socket.emit('created and joined room', roomTracker);
		socket.emit('created and joined room', roomList.length-1); //-1 needed for index and since using "push" method - put last in array
		//roomTracker += 1; //one room created per client //rename to roomTracker or someth ?
		//if a creator disconnects... room is deleted and roomTracker will be fckd
		//perhaps I can use roomList.length to get a more accurate number for roomindex?
		
		//after room has been created - send the user into the room itself!
		socket.leave('connected');
		
		socket.join(lobbyname);
		
		socket.room = lobbyname;
		console.log("client: " + clientIndex + " left connected room and joined: " + lobbyname);
		socket.roomActive = true;
		clientList[clientIndex].roomActive = true;
		socket.emit('creator joins room', {username: clientList[clientIndex].username, room: socket.room}); //allows creator of a room to "bypass" pw-requirement whilst other users looking to join will be required to input pw.
		//socket.emit('join a room', {pwSet: pwSet, pw: pw});
		//io.in(lobbyname).emit("user entered"); <-- send once user entered room (after pw confirmed or once joined)
		
		//alter the chat interface - need a leave button there as well, and we need to deal with what happens when user leaves, etc.
		
		//if user is in room - roomActive = true, broadcast to socket.room
		
		//if successful create - send update roomlist via broadcast (perhaps also to self?)
		//somehow need to apply a setTimeout every 1s trigger timer to this event - so list can be kept updated 
		socket.broadcast.emit('add to roomlist', {
			roomname: lobbyname, pwSet: pwSet, createdTime: clientList[clientIndex].createdRoom.createdTime
		});
		
		console.log("firstRoomCreated: ", firstRoomCreated);
		if(firstRoomCreated == false)
		{
			socket.broadcast.emit('initiate first roomlist update'); //if multiple sockets connected and first room is created - send out 'initiate roomlist interval updater'
			firstRoomCreated = true;
		}
	});
	
	//once a room is full with 2 people - delete / remove it from the selecet-option list
	//not sure I fixed this functionality yet.. something I gotta work on fixing.
	
	/*
	=================================================================
			Update room emit events below
	=================================================================
	*/
	
	socket.on('first update roomList', function(data) {
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].intervalSet.set = true;
		console.log("socket.rooms: ", socket.rooms);
		console.log("inside update roomList serverside");
		clientList[clientIndex].intervalSet.intervalID = data.intervalID;
		console.log("interval ID check serverside: ", data.intervalID);
		console.log("data contains serverside: ", data);
		//socket.in('connected').broadcast.emit('update roomList for all', {rooms: roomList, selectedValue: data.selectedValue}); //should not be sent to the guy(s) inside of a chat room
		io.in('connected').emit('update roomList for all', roomList); //send roomlist to all connected clients
		
		
		if(data.selectedValue.length > 1)
		{
			console.log("sending update selected option serverside");
			socket.emit('update selected option', data.selectedValue); //send back to client who selected option
		}
		//, selectedValue: data.selectedValue
		
		//socket.broadcast.emit('update roomList for all', {rooms: roomList, selectedValue: data.selectedValue});
		//socket.emit('update roomList for all', {rooms: roomList, selectedValue: data.selectedValue});
	});
	
	socket.on('individual update roomList', function(data) {
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].intervalSet.set = true;
		console.log("socket.rooms: ", socket.rooms);
		console.log("inside update roomList serverside");
		clientList[clientIndex].intervalSet.intervalID = data.intervalID;
		console.log("interval ID check serverside: ", data.intervalID);
		console.log("data contains serverside: ", data);
		//socket.in('connected').broadcast.emit('update roomList for all', {rooms: roomList, selectedValue: data.selectedValue}); //should not be sent to the guy(s) inside of a chat room
		socket.emit('individual roomlist update', roomList); //send roomlist to all connected clients
		
		
		if(data.selectedValue.length > 1)
		{
			console.log("sending update selected option serverside");
			socket.emit('update selected option', data.selectedValue); //send back to client who selected option
		}
	});
	
	/*
	=================================================================
			Leave room emit events below
	=================================================================
	*/
	
	socket.on('leave room', function(roomindex) {
		console.log("inside of leave room serverside");
		
		
		socket.leave(roomList[roomindex].name);
		socket.join('connected'); //declare this string as "default channel/room" variable later..
		//check if its creator that is leaving room, or other client - it makes a difference it matters.
		
		console.log("client: " + clientIndex + " left " + roomList[roomindex].name + " room and joined: connected");
		
		var clientIndex = getClientIndex(socket.cid);
		
		//clientList[clientIndex].createdRoom.name.length > 0 && (
		if(clientList[clientIndex].createdRoom.name == roomList[roomindex].name)
		{
			//then creator is the one leaving
			//which means we also need to delete the room from roomList and clear the sockets createdRoom data
			//we also need to check if there are still rooms in roomList after removal, if not - we need to reset "firstCreatedRoom" -- holy hell a lot of stuff to take care of all of sudden :P
			roomList.splice(roomindex, 1); //remove the entire roomList segment for this room that this socket created
			clientList[clientIndex].createdRoom.name = "";
			clientList[clientIndex].createdRoom.pw = "";
			clientList[clientIndex].createdRoom.createdTime = 0;
			
			if(roomList.length == 0)
			{
				firstRoomCreated = false;
			}
		}
		
		//only do this IF rooms in roomlist still exist.. if not, no need to do it ?
		if(!clientList[clientIndex].intervalSet.set && roomList.length > 0) //no need to update shit if roomlist is empty
		{
			console.log("inside of initiate individual roomlist update");
			console.log("roomList.length: ", roomList.length);
			socket.emit('initiate individual roomlist update');
		}
		
		socket.room = "connected";
		
		socket.roomActive = false;
		clientList[clientIndex].roomActive = false;
		
		socket.emit('leaving room'); //possibly track users in rooms? when 2 users its full u know.. 
		//notify others that still is in room that someone left..
		//io.in(roomList[roomindex].name).emit('user left room', username); //pick it up clientside and append message to #m or w/e easypeasy
		
		//if creator leaves room, same as on disconnect - inform other client in the room (if there is any - check this), and return them to main screen - also remove room from and all of its data - and issue a broadcast updating the select-option list - unless setTimeout takes care of this already?
		
	});
	
	
	/*
	=================================================================
			Join room received emit events below
	=================================================================
	*/
	
	socket.on('join room', function(selectedRoom) {
		console.log("inside of join room serverside");
		
		//data will be .val() of selected select-option list - which in our case is the room name to be joined for socket.
		//so when a user attempts to join a specific room - first thing to do is identify the room and check whether or not it is PW protected.
		
		//check if the room has password set
		var roomIndex = -1;
		for(var i = 0; i < roomList.length; i++)
		{
			if(roomList[i].name == selectedRoom)
			{
				roomIndex = i;
			}
		}
		
		if(roomList[roomIndex].pw !== "none")
		{
			socket.emit('show login form', roomIndex);
			
		}else {
			//if no pw - join room instantly
			//if successful send successful login and do all the necessary serverside actions to login user to room
			socket.leave('connected');
		
			socket.join(roomList[roomIndex].name);
			
			//stop interval if it exists when a client joins a room..
			var clientIndex = getClientIndex(socket.cid);
			if(clientList[clientIndex].intervalSet.set)
			{
				socket.emit('stop lobby update interval', clientList[clientIndex].intervalSet.intervalID);
			}
			
			socket.room = roomList[roomIndex].name;
			console.log("client: " + clientIndex + " left connected room and joined: " + roomList[roomIndex].name);
			socket.roomActive = true;
			clientList[clientIndex].roomActive = true;
			
			socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room}); //creator joins room but for "second" client to join the room..
		}
		
		//if it is, PW must match before anything else, if they dont match - emit to client attempting to connect to a room event saying "pw fail" - need a status message area box in the interface to keep users informed of what is happening - in the final product
		//if pw match - send "successful room join" event to client socket and respond by hiding create room, join room sections, and showing chat interface - also logically join appropriate room serverside for the socket user.
		//for the chat functionality after this point, always check what room user is connected to before sending messages
		//in the chat interface, have a leave room button
		//once pressed, have user logically leave room - if user was the creator of the room - also "delete" the room both logically and visually (broadcast) for all other connected sockets from the lobbylist, and "send" user back to regular create/join room interface.
		
		//game logics that will come later will be canvas methods painting appropriate things, and readyceck for example checking that when 2 connected sockets in one room, if they are both ready - if this is the case -- proceed to the game - randomize start player (O's) and give other connected socket X's, then allow them to perform 1 move at a time -- also somehow show amount of pieces they have left to place -- cant place pieces in spots that already have pieces - but perhaps I already fixed this logic?
		
		//if the creator of the room leaves, kick all active players from the room - "back" to main screen, but delete room only for the responsible for creating the room -- also inform user that creator left and that room will be deleted and they will be sent back to main screen after a few seconds delay (fadeOut?)
		
		
	});
	
	socket.on('room login attempt', function(data) {
		console.log("inside of room login attempt serverside");
		console.log("data contains (on login attempt): ", data);
		console.log("roomList[" + data.roomindex + "] contains: ", roomList[data.roomindex]);
		//data.pw && data.roomindex
		//check if the room with roomindex's pw matches data.pw
		if(roomList[data.roomindex].pw == data.pw)
		{
			console.log("pws matched, joining room");
			//if successful send successful login and do all the necessary serverside actions to login user to room
			socket.leave('connected');
		
			socket.join(roomList[data.roomindex].name);
			
			//stop interval if it exists when a client joins a room..
			var clientIndex = getClientIndex(socket.cid);
			if(clientList[clientIndex].intervalSet.set)
			{
				socket.emit('stop lobby update interval', clientList[clientIndex].intervalSet.intervalID);
			}
			
			socket.room = roomList[data.roomindex].name;
			console.log("client: " + clientIndex + " left connected room and joined: " + roomList[data.roomindex].name);
			socket.roomActive = true;
			clientList[clientIndex].roomActive = true;
			
			socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room}); //creator joins room but for "second" client to join the room..
			
		}else {
			//if failed pw -- notify user and provide them with a button to "go out of" login screen in case they actually dont know the pw
			socket.emit('room login failed');
			console.log("pw failed");
		}
	});
	
	
	
	
	/*
	=================================================================
			Chat received emit events below
	=================================================================
	*/
	
	
	socket.on('command', function(command) {
		if(command.length > 14) // /changenick + 1 whitespace == 12 characters, minimum chars for nick is 2 => 14
		{
			//store command as last message here
			var clientNameExist = false;
			var clientIndex = -1;
			for(var i = 0; i < clientList.length; i++)
			{
				if(clientList[i].username == socket.username)
				{
					clientNameExist = true;
					clientIndex = i;
				}
			}
			clientList[clientIndex].lastMessage = command;
			console.log("in command storing lastMessage as: ", clientList[clientIndex].lastMessage);
			
			var theCommand = command.substr(1,10);
			console.log("command: ", command);
			var type = "";
			console.log("theCommand: " + theCommand);
			console.log("theCommand length: " + theCommand.length);
			//console.log()
			if(theCommand == "changenick")
			{
				console.log("inside of changenick ifstatement");
				//type = msg.substr(1,11);
				//console.log("commandType/messagetype: " + type);
				//treat the rest of the changenick message as a possible new username to add:
				//- it cant be empty, and it musn't be less than 2 characters, or over 25 characters
				//console.log("command.length: " + command.length);
				//var commandLength = command.length;
				
				var newnick = command.substr(12); //-1 bcuz of "crapchar" at the end it seems
				//console.log("newnick creation gives with substr: " + command.substr(11, commandLength-5) + ", with length of: " + command.substr(11, commandLength-5).length);
				//console.log("newnick:" + newnick);
				//console.log("newnick length: " + newnick.length);
				
				if(newnick.length > 1 && newnick.length <= 25)
				{
					if(/^[a-zA-Z0-9]+$/.test(newnick))
					{
						
						//time to fix this part - first start by checking if username exist already or not - and remedy the situation.
						//var clientNameExist = false;
						//var clientIndex = -1;
						//clientIndex = -1;
						//for(var i = 0; i < clientList.length; i++)
						//{
						//	if(clientList[i].username == socket.username)
						//	{
						//		clientNameExist = true;
						//		clientIndex = i;
						//	}
						//}
						
						console.log("clientList: ", clientList);
						console.log("clientIndex: ", clientIndex);
						
						var oldNick = socket.username;
						
						//IF clientID == 0 OR !clientNameExisted
						if(clientID === 0 || !clientNameExist)
						{
							console.log("inside changenick for clientID === 0 || !clientNameExist.");
							socket.username = newnick;
							clientList[clientIndex].username = newnick;
							
						}else {
							//if username DID exist:
							console.log("changenick when username did exist");
							socket.username = newnick + clientList[clientIndex].clientID;
							console.log("socket.username changed to following when nick exist: ", socket.username);
							
							clientList[clientIndex].username = newnick + clientList[clientIndex].clientID;
							console.log("clientList[clientIndex].username changed to following when nick exist: ", clientList[clientIndex].username)
						}
						console.log("socket.username after if statement in changenick: ", socket.username);
						
						//var clientIndex = clientList.indexOf(socket.username);
						//clientList[clientIndex] = newnick;
						//console.log("clientList[clientIndex]: " + clientList[clientIndex]);
						
						
						socket.emit('username successfully changed', socket.username);
						
						socket.broadcast.emit('username change', {oldNick: oldNick, newNick: socket.username});
						
						
						//socket.username = newnick;
						//console.log("socket.username = " + socket.username);
					}else {
						socket.emit('unacceptable characters');
					}
				}
				
			}
		}else {
			//if it was a command, but not with sufficient data send back and inform user
				socket.emit('not enough data');
			}
	});
	
	socket.on('chat message', function(data) {
		console.log("message: " + data.msg);
		
				
		//declare socket.textColor instead of having it inside clientList hm?
		//maybe even socket.lastMsgSent ? which is best?
		console.log("clientList: ", clientList);
		console.log("socket.username: ", socket.username); //<-- is correct, but not the changenick declaration for some reason hm...
		
		var clientIndex = -1;
		for(var i = 0; i < clientList.length; i++)
		{
			if(clientList[i].username == socket.username)
			{
				clientIndex = i;
			}
		}
		console.log("user data is as follows: ", clientList[clientIndex]);
		
		clientList[clientIndex].lastMessage = data.msg;
		console.log("in chat storing lastMessage as: ", clientList[clientIndex].lastMessage);
		
		var textColor = clientList[clientIndex].userColor;
		var timeDiff = Date.now() - clientList[clientIndex].lastMessageSent;
		console.log("timeDiff between 2 sent messages is: " + timeDiff);
		if(timeDiff >= 500)
		{
			clientList[clientIndex].lastMessageSent = data.timestamp;
			console.log("msgTimestamp: " + clientList[clientIndex].lastMessageSent);
			
			socket.emit('new message', {
				username: socket.username, //"user" + clientCounter,
				textColor: textColor,
				message: data.msg
			});
			
			socket.broadcast.emit('new message', {
				username: socket.username, //"user" + clientCounter,
				textColor: textColor,
				message: data.msg
			});
		}else
		{
			//if messages was sent too close onto each other --- inform the user
			socket.emit('too fast typing');
		}
		
		
		
		
	});
	
	
	
	//when the client emits 'isTyping', we broadcast that to other clients
	socket.on('isTyping', function() {
		console.log("server side receiving isTyping emit");
		socket.broadcast.emit('isTyping', {
			username: socket.username
		});
	});
	
	//when client emits stopTyping, we broadcast that to other clients as well
	socket.on('stopTyping', function() {
		console.log("server side receiving stopTyping emit");
		socket.broadcast.emit('stopTyping', {
			username: socket.username
		});
	});
	
	socket.on('stopTypingEnter', function() {
		console.log("server side receving stopTypingEnter emit");
		socket.broadcast.emit('stopTypingEnter', {username: socket.username});
	});
	
	socket.on('recreate last message', function() {
		var clientIndex = -1;
		for(var i = 0; i < clientList.length; i++)
		{
			if(clientList[i].username == socket.username)
			{
				clientIndex = i;
			}
		}
		socket.emit('recreate last message', clientList[clientIndex].lastMessage);
	});
	
	/*
	=================================================================
			Leave room received emit events below
	=================================================================
	*/
	
	socket.on('disconnect', function() {
		console.log("user disconnected");
		
		//if intervalID set, send it back to interrupt the loop? //store intervalSet boolean for clients? on disconnect check if set to true or not to "disable" the timer from running more?
		
		var clientToRemoveFromClientList = getClientIndex(socket.cid);
		
		if(clientList[clientToRemoveFromClientList].intervalSet.set)
		{
			socket.emit('stop lobby update interval', clientList[clientToRemoveFromClientList].intervalSet.intervalID); //stop intervals on disconnect
			console.log("emitting stop lobby update interval");
		}
		
		//https://stackoverflow.com/questions/5767325/how-do-i-remove-a-particular-element-from-an-array-in-javascript
		if(clientToRemoveFromClientList > -1)
		{
			clientList.splice(clientToRemoveFromClientList, 1);
			console.log("clientList[" + clientToRemoveFromClientList + "] removed from ClientList.");
		}
		
		var roomIndexForClient = -1;
		if(socket.roomActive)
		{
			//remove said room
			for(var i = 0; i < roomList.length; i++)
			{
				if(roomList[i].lobbyname == socket.room)
				{
					roomIndexForClient = i;
				}
			}
			
			if(roomIndexForClient > -1)
			{
				roomList.splice(roomIndexForClient, 1);
				console.log("removing created room for client from servers roomList");
			}
			socket.roomActive = false;
			roomTracker -= 1;
		}
		
		if(clientList.length == 0) //only when everyone left should first room be available to spark new interval
		{
			//what happens with the interval if a client joins AFTER the interval has already begun? check this.
			firstRoomCreated = false;
		}
		
		
		
		
		
		if(clientList.length == 0)
		{
			clientID = 0; //reset clientID counter if all clients left site
		}
		
		
		//if disconnecting user had created a room, delete this room from all lists etc. --> if other client in said room - inform them that owner of the room disconnected, and that they will be returned to the main screen in 5 seconds.
		
	});
	
	
	
	
	
	socket.on('disconnect', function() {
		console.log("user disconnected");
		
		//decrement clientCounter accordingly
		if(clientCounter > 0 && socket.username)
		{
			clientCounter -= 1;
			
			//var clientIndex = clientList.indexOf(socket.username);
			//console.log("clientIndex: ", clientIndex);
			//to find our current user with a more "complex" user data array to scroll through, we gotta iterate through it, look for its username property to match our socket.username before we remove it
			var clientIndex = -1;
			for(var i = 0; i < clientList.length; i++)
			{
				if(clientList[i].username == socket.username)
				{
					clientIndex = i;
				}
			}
			console.log("clientIndex: ", clientIndex);
			if(clientList[clientIndex].userColor == "#0000ff")
			{
				oneRegisteredUser = false;
			}
			
			if(clientIndex > -1)
			{
				//remove value from array with splice: https://stackoverflow.com/questions/5767325/how-do-i-remove-a-particular-element-from-an-array-in-javascript
				clientList.splice(clientIndex, 1);
				console.log("clientList after removal of client: ", clientList);
			}
		}
		
		//also globally echo that the client left
		socket.broadcast.emit('userLeft', {
			username: socket.username,
			clientCounter: clientCounter
		});
	});
	
});

http.listen(8080, function() {
	console.log('listening on *:8080');
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

