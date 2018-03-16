var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var clientID = 0;
var roomList = []; //store count of activeClientsInSpecificRoom to see when its full
var activeFullRoomsList = []; //track rooms when they are "removed" from roomList and thereby roomList update
var clientList = [];
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

	//clear windows console history on each connect?
	//console.reset = function () {
	//  return process.stdout.write('\033c');
	//}
	//https://stackoverflow.com/questions/9006988/node-js-on-windows-how-to-clear-console
	//var lines = process.stdout.getWindowSize()[1];
	//for(var i = 0; i < lines; i++) {
	//	console.log('\r\n');
	//}
	
	
	console.log("inside of connect event serverside");
	
	console.log("socket.rooms: ", socket.rooms);
	console.log("socket.id: ", socket.id);
	socket.userReg = false;
	
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
		
		socket.join('connected'); //join general "connected room" to ease the broadcasting more - on join a "real" room - leave this common "connected" room. To only receive the relevant messages
		
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
							activeRoom: "",
							intervalSet: {set: false, intervalID: null},
							lastMessageSent: 0,
							lastMessage: ""});
							
		var clientIndex = getClientIndex(socket.cid);
		console.log("clientList[" + clientIndex + "]: ", clientList[clientIndex]);
		
		io.in('connected').emit('update siteStatsArea', clientList);
		
		clientID += 1; //increment for every user ever created - but never remove on disconnect
			
		console.log("clientList: ", clientList);
		
		socket.emit('user registered', socket.username); //send back to the registering client that user was successfully regged together with username?
		
		console.log("user: " + socket.username + " is registered.");
		
		socket.userReg = true;
		
		//if user reg is completed, check to see if roomList.length have any rooms
		//if there is - trigger individual update or w/e I called it
		if(roomList.length > 0)
		{
			//then there are rooms created already -- load them and keep them updated!
			socket.emit('load roomlist', roomList);
		}
	});
	
	socket.on('start roomlist update', function() {
		socket.emit('initiate roomlist update');
	});
	
	/*
	=================================================================
			Create room received emit events below
	=================================================================
	*/
	
	socket.on('create room', function(data) {
		console.log("inside of create room serverside");
		
		var lobbyname = data.name;
		
		//scroll through roomList checking lobbynames for match, if one is found, redefine lobbyname var with sockets client id appended for uniqueness
		
		if(roomList.length > 0) //no use in doing this if roomList is empty
		{
			for(var i = 0; i < roomList.length; i++)
			{
				if(roomList[i].name == lobbyname) //check for duplicate lobbynames among rooms
				{
					lobbyname += socket.cid; //if this dont work do clientList[socket.cid].clientID basically
				}
			}
		}
		
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
		clientList[clientIndex].activeRoom = lobbyname;
		
		console.log("clientList[" + clientIndex + "] after room creation: ", clientList[clientIndex]);
		
		//rooms cannot have the same lobbyname --- fix this by adding clientID to lobbyname here as well.
		
		roomList.push({name: lobbyname, 
						pw: (pwSet ? pw : "none"),
						firstUserJoined: true, 
						activeUserNmbr: 1,
						createdTime: clientList[clientIndex].createdRoom.createdTime,
						readycheck: [],
						startingPlayerCID: -1}); //do I need creator in this?
						//{user: "", response: false}, {user: "", response: false}
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
		
		//if successful create - send update roomlist via broadcast (perhaps also to self?)
		//somehow need to apply a setTimeout every 1s trigger timer to this event - so list can be kept updated 
		/*socket.broadcast.emit('add to roomlist', {
			roomname: lobbyname, pwSet: pwSet, createdTime: clientList[clientIndex].createdRoom.createdTime
		});*/
		/*socket.to('connected').emit('add to roomlist', {
			roomname: lobbyname, pwSet: pwSet, createdTime: clientList[clientIndex].createdRoom.createdTime
			
			//wouldnt it just be enough otherwise to simply "update" the roomlist for connected clients?
			
		});*/
		
		console.log("firstRoomCreated: ", firstRoomCreated);
		if(firstRoomCreated == false)
		{
			//socket.broadcast.emit('initiate first roomlist update'); //if multiple sockets connected and first room is created - send out 'initiate roomlist interval updater'
			
			socket.to('connected').emit('load roomlist', roomList);
			firstRoomCreated = true;
		}
		
		socket.to('connected').emit('update siteStatsArea', clientList);
	});
	
	
	/*
	=================================================================
			Update room emit events below
	=================================================================
	*/
	
	/*socket.on('first update roomList', function(data) {
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].intervalSet.set = true;
		console.log("socket.rooms: ", socket.rooms);
		console.log("inside update roomList serverside");
		clientList[clientIndex].intervalSet.intervalID = data.intervalID;
		console.log("interval ID check serverside: ", data.intervalID);
		console.log("data contains serverside: ", data);
		
		io.in('connected').emit('update roomList for all', roomList); //send roomlist to all connected clients
		
		
		if(data.selectedValue.length > 1)
		{
			console.log("sending update selected option serverside");
			socket.emit('update selected option', data.selectedValue); //send back to client who selected option
		}
	});*/
	
	socket.on('update roomList', function(data) {
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].intervalSet.set = true;
		console.log("socket.rooms: ", socket.rooms);
		console.log("inside update roomList serverside");
		clientList[clientIndex].intervalSet.intervalID = data.intervalID;
		console.log("interval ID check serverside: ", data.intervalID);
		console.log("data contains serverside: ", data);
		//socket.in('connected').broadcast.emit('update roomList for all', {rooms: roomList, selectedValue: data.selectedValue}); //should not be sent to the guy(s) inside of a chat room
		socket.emit('load roomlist', roomList); //send roomlist to all connected clients
		
		
		if(data.selectedValue.length > 1)
		{
			console.log("sending update selected option serverside");
			socket.emit('update selected option', data.selectedValue); //send back to client who selected option
		}
	});
	
	
	//once a room is full with 2 people - delete / remove it from the selecet-option list
	//not sure I fixed this functionality yet.. something I gotta work on fixing.
	//do this for when second person / other client joins a room
	
	/*
	=================================================================
			Join room received emit events below
	=================================================================
	*/
	
	socket.on('join room', function(selectedRoom) {
		console.log("inside of join room serverside");
		
		//when this is triggered, assume room is full, since this is client joining the room, and room only have capacity of 2
		
		
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
		
		if(roomList[roomIndex].pw !== "none") //if there is a PW to gain access to room
		{
			socket.emit('show login form', roomIndex);
			
		}else {
			//if no pw - join room instantly
			//if successful send successful login and do all the necessary serverside actions to login user to room
			if(roomList[roomIndex].activeUserNmbr < 2)
			{
				socket.leave('connected');
			
				socket.join(roomList[roomIndex].name);
				
				//stop interval if it exists when a client joins a room..
				var clientIndex = getClientIndex(socket.cid);
				if(clientList[clientIndex].intervalSet.set) //stop interval if joining room
				{
					console.log("stopping interval on joining room");
					socket.emit('stop lobby update interval', clientList[clientIndex].intervalSet.intervalID);
				}
				
				roomList[roomIndex].activeUserNmbr += 1; //should bring it up to 2 in this event
				
				
				//this should bring activeUserNmbr to the value of 2, which in turn should trigger readycheck. And on second user joining room - every client in that room should get the readycheck AND notify in chat that a user joined the room AND 
				
				socket.room = roomList[roomIndex].name;
				console.log("client: " + clientIndex + " left connected room and joined: " + roomList[roomIndex].name);
				socket.roomActive = true;
				clientList[clientIndex].roomActive = true;
				clientList[clientIndex].activeRoom = socket.room;
				
				//test this if this works..
				activeFullRoomsList.push(roomList[roomIndex]); // push over all the room data over to the activeFullRoomsList to "save" the data while removing it from lobbylist..
				console.log("activeFullRoomsList after push-copy now contains: ", activeFullRoomsList);
				roomList.splice(roomIndex, 1); //remove from roomList
				
				console.log("roomList after spliced away the joined room consist of: ", roomList);
				
				//socket.to('connected').emit('instant interface update', roomList);
				socket.to('connected').emit('load roomlist', roomList);
				//update interface for all looking at it instantly when someone joined the room so no1 else can join the room cuz its full.
				
				socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room}); //creator joins room but for "second" client to join the room..
				
				socket.to(socket.room).emit('client joined room', clientList[clientIndex].username);
				//this emit method sends to all in room EXCEPT sender himself.
				
				//which means every time a client/user joins a room that is not the creator - readycheck should commence and broadcast that a user joined the room to all in that room should be done, every time. ALSO room should be "temporarily" removed from lobbylist so no1 else can attempt to join... remove it from roomList BUT keep its roomDetails within activeRoomList (or fullRoomList)
				
				//broadcast to all in the room that a readycheck should be shown in canvas (or outside of canvas)
				
				socket.to('connected').emit('update siteStatsArea', clientList);
			}else {
				//if not less than 2... activeUserNmbr --- then user will not be able to join.
				//simple precaution.
				//nothing should happen then? if room is full and for some reason still exist in roomlist?
			}
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
			
			//test this if this works..
			activeFullRoomsList.push(roomList[data.roomindex]); // push over all the room data over to the activeFullRoomsList to "save" the data while removing it from lobbylist..
			roomList.splice(data.roomindex, 1); //remove from roomList
			
			socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room}); //creator joins room but for "second" client to join the room..
			
		}else {
			//if failed pw -- notify user and provide them with a button to "go out of" login screen in case they actually dont know the pw
			socket.emit('room login failed');
			console.log("pw failed");
		}
	});
	
	/*
	=================================================================
			Readycheck emit events below
	=================================================================
	*/
	
	
	socket.on('trigger readycheck broadcast for room', function(roomname) {
		io.in(roomname).emit('readycheck'); //shows readycheck form like roomlogin form clientside
		//store readycheck starttime somehow for gameroom? seem not necessary
	});
	
	
	socket.on('readycheck response', function(data) {
		//ok so in here we have to check if its first or second response we receive,
		//we have to check what answer was given
		//we have to check what socket sent this response - creator or client of room
		//we then have to send back to client what should be next step for interface
		//also in this block of code we do the serverside logic for if a no-response - kick player from room, if creator sent no-response, remove room and kick everyone
		
		//socket emit event here : ('readycheck response callback', 
		
		//step 1: roomList identify what index our room has
		//step 2: use that index to reach readycheck array inside of that room
		var roomIndex = -1;
		for(var i = 0; i < activeFullRoomsList.length; i++)
		{
			if(activeFullRoomsList[i].name == socket.room)
			{
				roomIndex = i;
			}
		}
		
		var clientIndex = getClientIndex(socket.cid);
		
		//imagine pushing the response directly into the readycheck array
		activeFullRoomsList[roomIndex].readycheck.push({user: clientList[clientIndex].username, response: data});
		
		
		console.log("--------------------------------------------------------------");
		
		
		if(activeFullRoomsList[roomIndex].readycheck.length == 1)
		{
			//if its the first response received serverside
			console.log("pushed readycheck responses = 1");
			console.log("activeFullRoomsList[" + roomIndex + "] data : ", activeFullRoomsList[roomIndex]);
			console.log("activeFullRoomsList[" + roomIndex + "].readycheck data: ", activeFullRoomsList[roomIndex].readycheck);
			//find out if response was sent from creator or client?
			if(clientList[clientIndex].createdRoom.name == socket.room)
			{
				console.log("first readycheck response received from creator of the room");
				//then we can assume creator response
				//so we now know, its the very first response received serverside
				//its the creator that sent the response
				//we have what type of response
				//if a yes: stop all readycheck chinanigans and hide readycheck and load waiting for opponent interface
				if(data == true)
				{
					console.log("first readycheck response from creator was Yes");
					socket.emit('stop all readycheck chinanigans');
					
					//load boardPieces
				
				}else {
					console.log("first readycheck response from creator was No");
					//if a no: ALL readycheck activity should seize for ALL clients in the room, readycheck should be clientside hidden, client should be kicked out of the room and scrubbed of room data, and so should the creator -- Buuut, room should also be deleted completely from our roomList or activeFullRoomsList					
					io.in(activeFullRoomsList[roomIndex].name).emit('stop all readycheck chinanigans');
					
					io.in(activeFullRoomsList[roomIndex].name).emit('kick client from a room', roomList);
					
					if(roomList.length == 0)
					{
						console.log("send out a beacon to clear all intervals on room leave");
						io.in(activeFullRoomsList[roomIndex].name).emit('clear intervals');
					}
					
					//scrub room data - need to be done for both client and creator
					//I could do it from one socket IF I knew ALL sockets clientID in a room
					
					//this socket is the creator, so we lookin for the client
					//var theClientsIndex = -1;
					//for(var i = 0; i < clientList.length; i++)
					//{
					//	if(clientList[i].activeRoom == socket.room && clientList[i].clientID != socket.cid)
					//	{
							//if in same room as creator, and clientID is not the same as creator, then its the client
					//		theClientsIndex = i;
					//	}
					//}
					
					//what data to scrub off of the room creator
					//I cant do socket.leave from the creators end - gotta do that on the clients end...
					//if I send out io.in the room - that would reach both client and creator
					socket.leave(activeFullRoomsList[roomIndex].name);
					socket.join('connected'); //this way next line emit only reaches client who is left in the room
					console.log("creator left room: " + activeFullRoomsList[roomIndex].name + " and joined connected");
					
					
					clientList[clientIndex].createdRoom.name = "";
					clientList[clientIndex].createdRoom.pw = "";
					clientList[clientIndex].createdRoom.createdTime = 0;
					clientList[clientIndex].activeRoom = "";
					clientList[clientIndex].roomActive = false;
					
					socket.room = "connected";
					socket.roomActive = false;
					
					//broadcast to all in connected new siteStatsArea
					
					
					io.in(activeFullRoomsList[roomIndex].name).emit('roomleaving data scrubbing'); //do I have to send along the room that gets removed here?
					//actually could scrub creator here, and just scrub client via that emit hm.
					console.log("sending roomleaving data scrubbing to the remaining party in the room (the client)");
					
					//what data to scrub off of the room client
					
					//removing the actual room and all of its related data
					activeFullRoomsList.splice(roomIndex, 1);
					
					if(roomList.length == 0)
					{
						firstRoomCreated = false;
					}
					
					
				}
				
			}else
			{
				console.log("first readycheck response received from client");
				//else if client..
				//if client sent first response received serverside as a yes:
				//stop all readycheck timers and chinanigans, hide readycheck and load canvas interface in wait for other - the creator
				if(data == true)
				{
					console.log("1st readycheck response received from client was a Yes");
					socket.emit('stop all readycheck chinanigans');
					
					//load boardPieces
					
					
				}else {
					console.log("first readycheck response received from client was a No");
					//if a no was sent:
					//stop all readycheck chinanigans and hide readycheck, then kick the client out of the room and scrub all room data (dont forget to decrement activeUserNmbr for the room As well as inform the creator
					
					
					
					//var clientIndex = getClientIndex(socket.cid);
		
					clientList[clientIndex].activeRoom = "";
					clientList[clientIndex].roomActive = false;
					
					socket.room = "connected";
					socket.roomActive = false;
					
					activeFullRoomsList[roomIndex].activeUserNmbr -= 1;
					
					socket.leave(activeFullRoomsList[roomIndex].name);
					socket.join("connected");
					
					socket.emit('stop all readycheck chinanigans');
					socket.to(activeFullRoomsList[roomIndex].name).emit('a user left the room', clientList[clientIndex].username);
					
					//if a client answers No --- activeFullRoomsList index should be copied back over to roomList
					
					//clear readycheck responses so that this eventdriven feature works the next time a single clinet leaves and then wants to rejoin
					//for(var i = 0; i < activeFullRoomsList[roomIndex].readycheck.length; i++)
					//{
					//	activeFullRoomsList.readycheck.splice(i, 1);
					//}
					activeFullRoomsList[roomIndex].readycheck.splice(0,2);
					console.log("activeFullRoomsList[roomIndex].readycheck after clearing", activeFullRoomsList[roomIndex].readycheck);
					
					//must stop readycheck for creator if client leaves during readycheck?
					//how the heck do I stop readycheck hm...?
					socket.to(activeFullRoomsList[roomIndex].name).emit("stop all readycheck chinanigans"); //sent to creator of the room to interrupt readycheck if client left during readycheck -- also add message telling creator that client left the room so send along the username of the leaver
					
					roomList.push(activeFullRoomsList[roomIndex]);
					activeFullRoomsList.splice(roomIndex, 1);
					
					
					socket.emit('kick client from a room', roomList);
								
				}
				
				
			}
		}else if(activeFullRoomsList[roomIndex].readycheck.length == 2)
		{
			console.log("second readycheck response received");
			console.log("activeFullRoomsList[" + roomIndex + "] data : ", activeFullRoomsList[roomIndex]);
			console.log("activeFullRoomsList[" + roomIndex + "].readycheck data: ", activeFullRoomsList[roomIndex].readycheck);
			//if second response server receives from readycheck
			
			//if we assume first response was a no from the creator, the client shouldn't even reach this part I think
			//on the other hand, if it was a no from client -> creator reaches this part, if yes from creator -> client reaches this part, if yes from client -> creator reaches this part
			
			//find out if response was sent from creator or client?
			if(clientList[clientIndex].createdRoom.name == socket.room)
			{
				console.log("second readycheck response was from creator");
				//then we can assume creator response
				//so we now know, its the very first response received serverside
				//its the creator that sent the response
				//we have what type of response
				//if a yes: stop all readycheck chinanigans and hide readycheck and load waiting for opponent interface
				if(data == true)
				{
					console.log("second readycheck response from creator was Yes");
					socket.emit('stop all readycheck chinanigans');
					//if creator was the second response and they sent a yes, then either client sent no or yes previously - find out which - if a no creator should just stay in the room, if a yes - check this to broadcast "start game"
					if(activeFullRoomsList[roomIndex].readycheck[0].response)
					{
						//if client responded true:
						//stop all readycheck bullshit, aand, broadcast start game to both clients
						//or determine who should start here already?
						//RNG between 0 & 1 -> index for player response that holds player names
						//if for example response 0 got to start, then I can broadcast to all in room EXCEPT this socket, if response 1 got to start - broadcast to this socket to get to start simple -- keep track of starting player as well in roomList?
						var startingPlayer = randomize(0,1);
						console.log("startingPlayer is response: ", startingPlayer);
						
						var startingPlayerUsername = activeFullRoomsList[roomIndex].readycheck[startingPlayer].user;
						console.log("starting player username is: " + startingPlayerUsername);
						
						var startingPlayerCID = -1;
						
						for(var i = 0; i < clientList.length; i++)
						{
							if(clientList[i].username == startingPlayerUsername)
							{
								startingPlayerCID = i;
							}
						}
						console.log("starting player CID = " + startingPlayerCID);
						
						activeFullRoomsList[roomIndex].startingPlayerCID = startingPlayerCID;
						//who goes first when game starts is now stored in room object
						
						if(startingPlayer == 0)
						{
							console.log("starting player is first readycheck responder");
							//if first response gets to start, broadcast to all except this socket in the room (a.k.a: the client)
							io.in(socket.room).emit('prep for start of game');
							socket.to(socket.room).emit('your turn in game');
							socket.emit('opponents turn in game');
							
							//starting the game I have to keep track of how all the pieces on the board for the game are moving alltogether for both sockets, as well as for every socket? - 2 sets of boardPiece arrays to track board movements?
							
							
						}else if(startingPlayer == 1)
						{
							console.log("starting player is second readycheck responder");
							//socket.emit('start the game'); //involves painting up board pieces available for both sockets, 
							//io.in(room).emit start the game -- to prep it with everything for both sockets?
							//then send "personal" emit for the one currently whos turn it is
							//I have to attach listener when its the players turn? and not when opponents turn?
							io.in(socket.room).emit('prep for start of game');
							socket.emit('your turn in game');
							socket.to(socket.room).emit('opponents turn in game');
							//for every turn in the game attach canvas mouseclick listener (correct it so it works in this implementation), then once a move is done --- submit move to server - store it serverside for room and maybe even for socket, on clientside paint the move/update canvas with the move, and pass the turn to other player and also paint for that - waiting on opponent -- dont forget to attach timer fuckers for each move turn oh gawd I facking hate timers in JS...
							
						}
					}
					
					
				
				}else {
					console.log("second readycheck response from creator was a No");
					
					//here we have to take into consideration WHAT was done WHEN client answered YES and then build upon that I think
					//we just stopped all readychecking
					
					//if a no: ALL readycheck activity should seize for ALL clients in the room, readycheck should be clientside hidden, client should be kicked out of the room and scrubbed of room data, and so should the creator -- Buuut, room should also be deleted completely from our roomList or activeFullRoomsList
					io.in(activeFullRoomsList[roomIndex].name).emit('stop all readycheck chinanigans');
					
					io.in(activeFullRoomsList[roomIndex].name).emit('kick client from a room', roomList);
					
					if(roomList.length == 0)
					{
						console.log("send out a beacon to clear all intervals on room leave");
						io.in(activeFullRoomsList[roomIndex].name).emit('clear intervals');
					}
					
					//console.log("roomList.length: ", roomList.length);
					
					//console.log("clientList data: ", clientList); //to check intervals
					
					//scrub room data - need to be done for both client and creator
					//I could do it from one socket IF I knew ALL sockets clientID in a room
					//or that I know this is creator, socket.to gives client in room ta-daa
					
					//what data to scrub off of the room creator
					//I cant do socket.leave from the creators end - gotta do that on the clients end...
					//if I send out io.in the room - that would reach both client and creator
					socket.leave(activeFullRoomsList[roomIndex].name);
					socket.join('connected'); //this way next line emit only reaches client who is left in the room
					
					
					clientList[clientIndex].createdRoom.name = "";
					clientList[clientIndex].createdRoom.pw = "";
					clientList[clientIndex].createdRoom.createdTime = 0;
					clientList[clientIndex].activeRoom = "";
					clientList[clientIndex].roomActive = false;
					
					socket.room = "connected";
					socket.roomActive = false;
					
					
					io.in(activeFullRoomsList[roomIndex].name).emit('roomleaving data scrubbing'); //do I have to send along the room that gets removed here?
					//actually could scrub creator here, and just scrub client via that emit hm.
					
					//what data to scrub off of the room client
					
					//removing the actual room and all of its related data
					activeFullRoomsList.splice(roomIndex, 1);
					
					if(roomList.length == 0)
					{
						firstRoomCreated = false;
					}
					
					console.log("clientList here contains: ", clientList);
					
				}
				
			}else
			{
				console.log("second readycheck response was from client");
				//else if client.. and second response oh boi... my head will facking explode... srsly.. 
				//if client sent first response received serverside as a yes:
				//stop all readycheck timers and chinanigans, hide readycheck and load canvas interface in wait for other - the creator
				if(data == true)
				{
					console.log("second readycheck response from client was Yes");
					socket.emit('stop all readycheck chinanigans');
					
					//everything creator did to start the game... goes here
					//if(activeFullRoomsList[roomIndex].readycheck[1].response)
					//{
					//if client responded true:
					//stop all readycheck bullshit, aand, broadcast start game to both clients
					//or determine who should start here already?
					//RNG between 0 & 1 -> index for player response that holds player names
					//if for example response 0 got to start, then I can broadcast to all in room EXCEPT this socket, if response 1 got to start - broadcast to this socket to get to start simple -- keep track of starting player as well in roomList?
					var startingPlayer = randomize(0,1);
					console.log("startingPlayer is response: ", startingPlayer);
					
					var startingPlayerUsername = activeFullRoomsList[roomIndex].readycheck[startingPlayer].user;
					console.log("starting player username: " + startingPlayerUsername);
					
					var startingPlayerCID = -1;
					
					for(var i = 0; i < clientList.length; i++)
					{
						if(clientList[i].username == startingPlayerUsername)
						{
							startingPlayerCID = i;
						}
					}
					
					activeFullRoomsList[roomIndex].startingPlayerCID = startingPlayerCID;
					//who goes first when game starts is now stored in room object
					
					if(startingPlayer == 0)
					{
						console.log("starting player is first readycheck responder");
						//if first response gets to start, broadcast to all except this socket in the room (a.k.a: the client)
						io.in(socket.room).emit('prep for start of game');
						socket.to(socket.room).emit('your turn in game');
						socket.emit('opponents turn in game');
						
						//starting the game I have to keep track of how all the pieces on the board for the game are moving alltogether for both sockets, as well as for every socket? - 2 sets of boardPiece arrays to track board movements?
						
						
					}else if(startingPlayer == 1)
					{
						console.log("starting player is second readycheck responder");
						//socket.emit('start the game'); //involves painting up board pieces available for both sockets, 
						//io.in(room).emit start the game -- to prep it with everything for both sockets?
						//then send "personal" emit for the one currently whos turn it is
						//I have to attach listener when its the players turn? and not when opponents turn?
						io.in(socket.room).emit('prep for start of game');
						socket.emit('your turn in game');
						socket.to(socket.room).emit('opponents turn in game');
						//for every turn in the game attach canvas mouseclick listener (correct it so it works in this implementation), then once a move is done --- submit move to server - store it serverside for room and maybe even for socket, on clientside paint the move/update canvas with the move, and pass the turn to other player and also paint for that - waiting on opponent -- dont forget to attach timer fuckers for each move turn oh gawd I facking hate timers in JS...
						
					}
					
					
					
					
					
				}else {
					console.log("second readycheck response received from client was a No");
					//if a no was sent:
					//stop all readycheck chinanigans and hide readycheck, then kick the client out of the room and scrub all room data (dont forget to decrement activeUserNmbr for the room As well as inform the creator
					socket.emit('stop all readycheck chinanigans');
					
					
					//var clientIndex = getClientIndex(socket.cid);
		
					clientList[clientIndex].activeRoom = "";
					clientList[clientIndex].roomActive = false;
					
					socket.room = "connected";
					socket.roomActive = false;
					
					activeFullRoomsList[roomIndex].activeUserNmbr -= 1;
					
					console.log("activeFullRoomsList AFTER -1 on activeUserNmbr: ", activeFullRoomsList[roomIndex]);
					
					socket.leave(activeFullRoomsList[roomIndex].name);
					socket.join("connected");
					
					socket.to(activeFullRoomsList[roomIndex].name).emit('a user left the room', clientList[clientIndex].username); //on this send back to clear readychecks?
					
					//clear readycheck responses so that this eventdriven feature works the next time a single clinet leaves and then wants to rejoin
					//only do this if previously readycheck response was a yes though..
					console.log("activeFullRoomsList contains: ", activeFullRoomsList[roomIndex].readycheck);
					if(activeFullRoomsList[roomIndex].readycheck[0].response == true)
					{
						activeFullRoomsList[roomIndex].readycheck.splice(0, 2);
					}
					console.log("activeFullRoomsList contains AFTER clearing readycheck: ", activeFullRoomsList[roomIndex].readycheck);
					
					
					//if a client answers No --- activeFullRoomsList index should be copied back over to roomList
					roomList.push(activeFullRoomsList[roomIndex]);
					activeFullRoomsList.splice(roomIndex, 1);
					socket.emit('kick client from a room', roomList);
								
				}
				
				
			}
			
		}
		
	});
	
	
	socket.on('roomleave data scrub', function() {
		var clientIndex = getClientIndex(socket.cid);
		
		if(socket.room != "connected")
		{
			socket.leave(socket.room);
			socket.join("connected");
		}
		
		//clientList[clientIndex].activeRoom = "";
		//clientList[clientIndex].roomActive = false;
		
		//socket.room = "connected";
		//socket.roomActive = false;
		
		clientList[clientIndex].activeRoom = "";
		clientList[clientIndex].roomActive = false;
		
		socket.room = "connected";
		socket.roomActive = false;
		
		io.in('connected').emit('update siteStatsArea', clientList); //should happen for both creator and client once reaches this point cuz at this point both that was in room should have left the room..
		
	});
	
	
	
	/*
	=================================================================
			Game logics emit events
	=================================================================
	*/
	
	socket.on('switch turn', function() {
		
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
			console.log("inside of initiate roomlist update");
			console.log("roomList.length: ", roomList.length);
			socket.emit('initiate roomlist update');
		}
		
		socket.room = "connected";
		
		socket.roomActive = false;
		clientList[clientIndex].roomActive = false;
		
		socket.emit('leaving room'); //possibly track users in rooms? when 2 users its full u know.. 
		//notify others that still is in room that someone left..
		//io.in(roomList[roomindex].name).emit('user left room', username); //pick it up clientside and append message to #m or w/e easypeasy
		
		//if creator leaves room, same as on disconnect - inform other client in the room (if there is any - check this), and return them to main screen - also remove room from and all of its data - and issue a broadcast updating the select-option list - unless setTimeout takes care of this already?
		
		io.in('connected').emit('update siteStatsArea', clientList);
		
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
		
		if(socket.userReg && clientList[clientToRemoveFromClientList].intervalSet.set)
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
		
		socket.to('connected').emit('update siteStatsArea', clientList);
		
		//must somehow here take into account and check if activeFullRoomsList has the room and it should be removed from this one, it will come... patience..
		
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
			//roomTracker -= 1;
		}
		
		if(clientList.length == 0) //only when everyone left should first room be available to spark new interval
		{
			//what happens with the interval if a client joins AFTER the interval has already begun? check this.
			firstRoomCreated = false;
			clientID = 0;
		}
		
		
		
		
		
		
		
		//if(clientList.length == 0)
		//{
		//	clientID = 0; //reset clientID counter if all clients left site
		//}
		
		
		//if disconnecting user had created a room, delete this room from all lists etc. --> if other client in said room - inform them that owner of the room disconnected, and that they will be returned to the main screen in 5 seconds.
		
	});
	
	
	
	
	
	/*socket.on('disconnect', function() {
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
	});*/
	
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

function randomize(min, max) { //random(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
}
