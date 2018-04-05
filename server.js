var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var port = process.env.PORT || 8007;
var clientID = 0;
var roomList = [];
var activeFullRoomsList = [];
var clientList = [];
var firstRoomCreated = false;
var movesCounter = 0;
const DEFAULT_ROOM = "connected";
const winCombos = {	1: [1,2,3],
					2: [4,5,6],
					3: [7,8,9],
					4: [1,4,7],
					5: [2,5,8],
					6: [3,6,9],
					7: [1,5,9],
					8: [3,5,7]};
var funcs = require('./js/projectFunctions'); //thank you earendel from ##javascript @ IRC
var sanitizeHtml = require('sanitize-html');

// Allow only a super restricted set of tags and attributes
//https://github.com/punkave/sanitize-html
/*var clean = sanitizeHtml(input, {
  allowedTags: [],
  allowedAttributes: []
});*/


//to load static resources I was required to "include" the working directory with below line of code
app.use(express.static(__dirname));

app.get('/', function(req, res) {
	//res.send('<h1>Hello World!</h1>');
	//res.sendFile(__dirname + '/index.html');
	res.sendFile('index.html');
	
});


io.on('connection', function(socket) {
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
				
		username = sanitizeData(username);
		
		if(socket.userReg == false)
		{
			var clientNameExist = false;
			for(var i = 0; i < clientList.length; i++)
			{
				if(clientList[i].username == username)
				{
					clientNameExist = true;
				}
			}
			
			socket.join(DEFAULT_ROOM); //join general "connected room" to ease the broadcasting more - on join a "real" room - leave this common "connected" room. To only receive the relevant messages
			
			socket.cid = clientID; // save clientID to the socket
			
			console.log("socket.cid = " + socket.cid);
			
			if(clientID === 0 || !clientNameExist)
			{
				socket.username = username;
				console.log("inside of clientID === 0 || !clientNameExist when registering user.");
			}else {
				//if username DID exist -- (this saves us from having them retry other usernames):
				socket.username = username + clientID;
				
			}
			
			clientList.push({	username: socket.username, 
								userChatColor: "", //(oneRegisteredUser == false ? "#0000ff" : "#ff0000"),
								createdRoom: {name: "", pw: "", createdTime: 0}, 
								clientID: clientID,
								roomActive: false,
								activeRoom: "",
								intervalSet: {set: false, intervalID: null},
								lastMessageSent: 0,
								lastMessage: "",
								game: {movesMade: 0, boardPiece: "", startingPlayer: false, currentMoveMaker: false},
								gameStats: {wonGames: 0, totalGames: 0, avgGameTime: 0},
								gameTimes: []});
								
			var clientIndex = getClientIndex(socket.cid);
			console.log("clientList[" + clientIndex + "]: ", clientList[clientIndex]);
			
			io.in(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
			
			clientID += 1; //increment for every user ever created - but never remove on disconnect
				
			console.log("clientList: ", clientList);
			
			socket.emit('user registered', socket.username);
			
			console.log("user: " + socket.username + " is registered.");
			
			socket.userReg = true;
			
			//if user reg is completed, check to see if roomList.length have any rooms
			//if there is - trigger individual update or w/e I called it
			if(roomList.length > 0)
			{
				//then there are rooms created already -- load them and keep them updated!
				socket.emit('load roomlist', roomList);
			}
		}else {
			socket.emit('ajabaja', "userreg");
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
		
		var clientIndex = getClientIndex(socket.cid);
		
		if(clientIndex != -1) //very important
		{
			if(socket.userReg == true && clientList[clientIndex].createdRoom.name == "")
			{
				//if user is REGISTERED, AND Does NOT already have a created room, then he can create a room.
				
				var lobbyname = data.name;
				
				lobbyname = sanitizeData(lobbyname);
				
				//scroll through roomList checking lobbynames for match, if one is found, redefine lobbyname var with sockets client id appended for uniqueness
				
				if(roomList.length > 0) //no use in doing this if roomList is empty
				{
					for(var i = 0; i < roomList.length; i++)
					{
						if(roomList[i].name == lobbyname) //check for duplicate lobbynames among rooms
						{
							lobbyname += socket.cid;
						}
					}
				}
				
				var pw = data.pw;
				
				//only stringify if not empty
				if(pw != "")
				{
					console.log("pw before stringify: ", pw);
					pw = JSON.stringify(pw); //stringify pw to escape "dangers"
					console.log("pw after stringify: ", pw);
				}
				var pwSet = false;
				//check and filter it - set to none if empty or similar
				if(pw.length > 0)
				{
					pwSet = true;
				}
				
				socket.emit('stop lobby update interval');
				
				clientList[clientIndex].createdRoom.name = lobbyname;
				clientList[clientIndex].createdRoom.pw = (pwSet ? pw : "none");
				clientList[clientIndex].createdRoom.createdTime = Date.now();
				clientList[clientIndex].activeRoom = lobbyname;
				
				console.log("clientList[" + clientIndex + "] after room creation: ", clientList[clientIndex]);
				
				roomList.push({name: lobbyname, 
								pw: (pwSet ? pw : "none"),
								firstUserJoined: true, 
								activeUserNmbr: 1,
								createdTime: clientList[clientIndex].createdRoom.createdTime,
								readycheck: [],
								startingPlayerCID: -1,
								boardGrid: [0,0,0,0,0,0,0,0,0],
								movesMade: 0}); 
								
				console.log("roomList: ", roomList);
				
				socket.emit('created and joined room', roomList.length-1); //-1 needed for index and since using "push" method - put last in array
				
				//after room has been created - send the user into the room itself!
				socket.leave(DEFAULT_ROOM);
				
				socket.join(lobbyname);
				
				socket.room = lobbyname;
				console.log("client: " + clientIndex + " left connected room and joined: " + lobbyname);
				socket.roomActive = true;
				clientList[clientIndex].roomActive = true;
				socket.emit('creator joins room', {username: clientList[clientIndex].username, room: socket.room}); //allows creator of a room to "bypass" pw-requirement whilst other users looking to join will be required to input pw.
				
				console.log("firstRoomCreated: ", firstRoomCreated);
				if(firstRoomCreated == false)
				{
					socket.to(DEFAULT_ROOM).emit('load roomlist', roomList);
					firstRoomCreated = true;
				}
				
				socket.to(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
			}else {
				socket.emit('ajabaja', "createroom");
			}
		}
	});
	
	
	/*
	=================================================================
			Update room emit events below
	=================================================================
	*/
	
	socket.on('update roomList', function(selectedValue) {
		var clientIndex = getClientIndex(socket.cid);
		
		selectedValue = sanitizeData(selectedValue);
		
		console.log("socket.rooms: ", socket.rooms);
		console.log("inside update roomList serverside");
		socket.emit('load roomlist', roomList); //send roomlist to all connected clients
		
		
		if(selectedValue.length > 1)
		{
			console.log("sending update selected option serverside");
			socket.emit('update selected option', selectedValue); //send back to client who selected option
		}
	});
	
	/*
	=================================================================
			Join room received emit events below
	=================================================================
	*/
	
	socket.on('join room', function(selectedRoom) {
		console.log("inside of join room serverside");
		
		//make sure that the room actually sent along on the join room submit was a room that actually exist in our list --- 
		//loop through our roomlist, check if the selected room exists, check if user is registered (also a must), check if any rooms have been created - aka if selected room exists
		
		selectedRoom = sanitizeData(selectedRoom);

		//when this is triggered, assume room is full, since this is client joining the room, and room only have capacity of 2
		
		
		//data will be .val() of selected select-option list - which in our case is the room name to be joined for socket.
		//so when a user attempts to join a specific room - first thing to do is identify the room and check whether or not it is PW protected.
		
		//check if the room has password set
		var roomIndex = getRoomIndex(selectedRoom, roomList); 
		
		if(socket.userReg == true && roomIndex != -1)
		{
			if(roomList[roomIndex].pw !== "none") //if there is a PW to gain access to room
			{
				socket.emit('show login form', roomIndex);
				
			}else {
				//if no pw - join room instantly
				//if successful send successful login and do all the necessary serverside actions to login user to room
				if(roomList[roomIndex].activeUserNmbr < 2)
				{
					socket.leave(DEFAULT_ROOM);
				
					socket.join(roomList[roomIndex].name);
					
					var clientIndex = getClientIndex(socket.cid);
					
					console.log("stopping interval on joining room");
					socket.emit('stop lobby update interval');
					
					roomList[roomIndex].activeUserNmbr += 1; //should bring it up to 2 in this event
					
					
					//this should bring activeUserNmbr to the value of 2, which in turn should trigger readycheck. And on second user joining room - every client in that room should get the readycheck AND notify in chat that a user joined the room
					
					socket.room = roomList[roomIndex].name;
					console.log("client: " + clientIndex + " left connected room and joined: " + roomList[roomIndex].name);
					socket.roomActive = true;
					clientList[clientIndex].roomActive = true;
					clientList[clientIndex].activeRoom = socket.room;
					
					//test this if this works..
					activeFullRoomsList.push(roomList[roomIndex]); // push over all the room data over to the activeFullRoomsList to "save" the data while removing it from lobbylist..
					var newRoomIndex = -1;
					for(var i = 0; i < activeFullRoomsList.length; i++)
					{
						if(activeFullRoomsList[i].name == socket.room)
						{
							newRoomIndex = i;
						}
					}
					io.in(socket.room).emit('update roomToLoginTo index', newRoomIndex); //when both joins we need to update this since room changed listcontainer and thereby also got new index
					
					console.log("activeFullRoomsList after push-copy now contains: ", activeFullRoomsList);
					roomList.splice(roomIndex, 1); //remove from roomList
					
					console.log("roomList after spliced away the joined room consist of: ", roomList);
					
					//socket.to('connected').emit('instant interface update', roomList);
					socket.to(DEFAULT_ROOM).emit('load roomlist', roomList);
					//update interface for all looking at it instantly when someone joined the room so no1 else can join the room cuz its full.
					
					socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room}); //creator joins room but for "second" client to join the room..
					
					socket.to(socket.room).emit('client joined room', clientList[clientIndex].username);
					//this emit method sends to all in room EXCEPT sender himself.
					
					//which means every time a client/user joins a room that is not the creator - readycheck should commence and broadcast that a user joined the room to all in that room should be done, every time. ALSO room should be "temporarily" removed from lobbylist so no1 else can attempt to join... remove it from roomList BUT keep its roomDetails within activeRoomList (or fullRoomList)
					
					//broadcast to all in the room that a readycheck should be shown in canvas (or outside of canvas)
					
					socket.to(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
				}else {
					//if not less than 2... activeUserNmbr --- then user will not be able to join.
					//simple precaution.
				}
			}
		}else {
			socket.emit('ajabaja', "joinroom");
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
		
		data.roomindex = sanitizeData(data.roomindex);
		
		console.log("pw transfer before stringify: ", data.pw);
		data.pw = JSON.stringify(data.pw);
		console.log("pw transfer after stringify: ", data.pw);
		
		if(socket.userReg == true && data.roomindex != -1)
		{
			if(roomList[data.roomindex].activeUserNmbr < 2)
			{
				console.log("data contains (on login attempt): ", data);
				console.log("roomList[" + data.roomindex + "] contains: ", roomList[data.roomindex]);
				
				//check if the room with roomindex's pw matches data.pw
				if(roomList[data.roomindex].pw == data.pw)
				{
					console.log("pws matched, joining room");
					socket.leave(DEFAULT_ROOM);
				
					socket.join(roomList[data.roomindex].name);
					
					//stop interval if it exists when a client joins a room..
					var clientIndex = getClientIndex(socket.cid);
					
					socket.emit('stop lobby update interval');
					
					socket.room = roomList[data.roomindex].name;
					console.log("client: " + clientIndex + " left connected room and joined: " + roomList[data.roomindex].name);
					socket.roomActive = true;
					clientList[clientIndex].roomActive = true;
					roomList[data.roomindex].activeUserNmbr += 1;
					clientList[clientIndex].activeRoom = roomList[data.roomindex].name;
					
					//test this if this works..
					activeFullRoomsList.push(roomList[data.roomindex]); // push over all the room data over to the activeFullRoomsList to "save" the data while removing it from lobbylist..
					roomList.splice(data.roomindex, 1); //remove from roomList
					
					socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room}); //creator joins room but for "second" client to join the room..
					
				}else {
					//if failed pw -- notify user and provide them with a button to "go out of" login screen in case they actually dont know the pw
					socket.emit('room login failed');
					console.log("pw failed");
				}
			}else {
				console.log("unintended usage detected, or bug, javascript manipulation clientside possibility.");
				//if more than 2 already in room due to js manipulation
				socket.emit('too many in room');
			}
		}else {
			socket.emit('ajabaja', "roomlogin");
		}
	});
	
	/*
	=================================================================
			Readycheck emit events below
	=================================================================
	*/
	
	socket.on('trigger readycheck broadcast for room', function(roomname) {
		
		console.log("inside of trigger readycheck broadcast for room serverside");
		
		roomname = sanitizeData(roomname);
		
		//should probably make sure so the actual roomname exist in the roomlist here
		var exists = false;
		for(var i = 0; i < activeFullRoomsList.length; i++)
		{
			if(activeFullRoomsList[i].name == roomname)
			{
				exists = true;
				break;
			}
		}
		
		if(exists)
		{
			io.in(roomname).emit('readycheck'); //shows readycheck form like roomlogin form clientside
		}else {
			console.log("roomname did not exist in activeFullRoomsList.");
		}
	});
	
	
	socket.on('readycheck response', function(data) {
		//ok so in here we have to check if its first or second response we receive,
		//we have to check what answer was given
		//we have to check what socket sent this response - creator or client of room
		//we then have to send back to client what should be next step for interface
		//also in this block of code we do the serverside logic for if a no-response - kick player from room, if creator sent no-response, remove room and kick everyone
		
		if(data == true || data == false)
		{
		
			//make socket is connected to a room serverside, make sure user is registered serverside, make sure 2 people are in the room and that this socket is active in the room
			
			var clientIndex = getClientIndex(socket.cid);
			
			console.log("clientIndex turns out as (in readycheck): ", clientIndex);
			
			var roomIndex = getRoomIndex(socket.room, activeFullRoomsList);
			
			console.log("roomIndex turns out as (in readycheck): ", roomIndex);
			
			console.log("readycheck data contains: ", data);
			
			console.log("READYCHECK DATA: activeFullRoomsList[roomIndex].activeUserNmbr contains: ", activeFullRoomsList[roomIndex].activeUserNmbr);
			
			console.log("READYCHECK DATA: clientList[clientIndex].activeRoom contains: ", clientList[clientIndex].activeRoom);
			
			console.log("READYCHECK DATA: socket.room contains: ", socket.room);
			console.log("READYCHECK DATA: socket.userReg: ", socket.userReg);
			
			
			if(socket.userReg == true && socket.room == clientList[clientIndex].activeRoom && activeFullRoomsList[roomIndex].activeUserNmbr == 2)
			{
			
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
							
							//what data to scrub off of the room creator
							//I cant do socket.leave from the creators end - gotta do that on the clients end...
							//if I send out io.in the room - that would reach both client and creator
							socket.leave(activeFullRoomsList[roomIndex].name);
							socket.join(DEFAULT_ROOM); //this way next line emit only reaches client who is left in the room
							console.log("creator left room: " + activeFullRoomsList[roomIndex].name + " and joined connected");
							
							
							clientList[clientIndex].createdRoom.name = "";
							clientList[clientIndex].createdRoom.pw = "";
							clientList[clientIndex].createdRoom.createdTime = 0;
							clientList[clientIndex].activeRoom = "";
							clientList[clientIndex].roomActive = false;
							
							socket.room = DEFAULT_ROOM;
							socket.roomActive = false;
							
							
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
							
							clientList[clientIndex].activeRoom = "";
							clientList[clientIndex].roomActive = false;
							
							socket.room = DEFAULT_ROOM;
							socket.roomActive = false;
							
							activeFullRoomsList[roomIndex].activeUserNmbr -= 1;
							
							socket.leave(activeFullRoomsList[roomIndex].name);
							socket.join(DEFAULT_ROOM);
							
							socket.emit('stop all readycheck chinanigans');
							socket.to(activeFullRoomsList[roomIndex].name).emit('a user left the room', clientList[clientIndex].username);
							
							//if a client answers No --- activeFullRoomsList index should be copied back over to roomList
							
							//clear readycheck responses so that this eventdriven feature works the next time a single clinet leaves and then wants to rejoin
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
								var startingPlayer = funcs.randomize(0,1);
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
									//socket.to(socket.room).emit('setYourBoardPiecesValue', 4);
									//socket.emit('setOpponentBoardPieceValue', 5);
									socket.to(socket.room).emit('set board piece client value', 5);
									socket.emit('set board piece client value', 4);
									
									io.in(socket.room).emit('prep for start of game');
									//io.in(socket.room).emit('boardPieces paintout');
									socket.to(socket.room).emit('boardPieces paintout');
									socket.emit('boardPieces paintout');
									
									socket.to(socket.room).emit('your turn in game');
									socket.emit('opponents turn in game');
									
									//starting the game I have to keep track of how all the pieces on the board for the game are moving alltogether for both sockets, as well as for every socket? - 2 sets of boardPiece arrays to track board movements?
									socket.to(socket.room).emit('set starting player');
									
								}else if(startingPlayer == 1)
								{
									console.log("starting player is second readycheck responder");
									
									socket.emit('set board piece client value', 5);
									socket.to(socket.room).emit('set board piece client value', 4);
									
									io.in(socket.room).emit('prep for start of game');
									
									socket.to(socket.room).emit('boardPieces paintout');
									socket.emit('boardPieces paintout');
									
									
									socket.emit('your turn in game');
									socket.to(socket.room).emit('opponents turn in game');
									
									clientList[clientIndex].game.startingPlayer = true;
									
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
							//scrub room data - need to be done for both client and creator
							//I could do it from one socket IF I knew ALL sockets clientID in a room
							//or that I know this is creator, socket.to gives client in room ta-daa
							
							//what data to scrub off of the room creator
							//I cant do socket.leave from the creators end - gotta do that on the clients end...
							//if I send out io.in the room - that would reach both client and creator
							socket.leave(activeFullRoomsList[roomIndex].name);
							socket.join(DEFAULT_ROOM); //this way next line emit only reaches client who is left in the room
							
							
							clientList[clientIndex].createdRoom.name = "";
							clientList[clientIndex].createdRoom.pw = "";
							clientList[clientIndex].createdRoom.createdTime = 0;
							clientList[clientIndex].activeRoom = "";
							clientList[clientIndex].roomActive = false;
							
							socket.room = DEFAULT_ROOM;
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
							//safe to assume that first response was true, otherwise this response would not reach this far...
							console.log("second readycheck response from client was Yes");
							socket.emit('stop all readycheck chinanigans');
							
							//everything creator did to start the game... goes here
							//if client responded true:
							//stop all readycheck stuff, and, broadcast start game to both clients
							//or determine who should start here already?
							//RNG between 0 & 1 -> index for player response that holds player names
							//if for example response 0 got to start, then I can broadcast to all in room EXCEPT this socket, if response 1 got to start - broadcast to this socket to get to start simple -- keep track of starting player as well in roomList?
							var startingPlayer = funcs.randomize(0,1);
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
								socket.emit('set board piece client value', 4);
								socket.to(socket.room).emit('set board piece client value', 5);
								
								io.in(socket.room).emit('prep for start of game');
								io.in(socket.room).emit('boardPieces paintout');
								socket.to(socket.room).emit('your turn in game');
								socket.emit('opponents turn in game'); //this socket is not 0 hence socket.emit
								
								//starting the game I have to keep track of how all the pieces on the board for the game are moving alltogether for both sockets, as well as for every socket? - 2 sets of boardPiece arrays to track board movements?
								
								//set other sockets startingplayer to true
								socket.to(socket.room).emit('set starting player');
								
							}else if(startingPlayer == 1)
							{
								console.log("starting player is second readycheck responder");
								
								socket.emit('set board piece client value', 5);
								socket.to(socket.room).emit('set board piece client value', 4);
								
								io.in(socket.room).emit('prep for start of game');
								io.in(socket.room).emit('boardPieces paintout');
								socket.emit('your turn in game');
								socket.to(socket.room).emit('opponents turn in game');
								
								clientList[clientIndex].game.startingPlayer = true;
								//for every turn in the game attach canvas mouseclick listener (correct it so it works in this implementation), then once a move is done --- submit move to server - store it serverside for room and maybe even for socket, on clientside paint the move/update canvas with the move, and pass the turn to other player and also paint for that - waiting on opponent -- dont forget to attach timer fuckers for each move turn oh gawd I facking hate timers in JS...
								
							}					
						}else {
							console.log("second readycheck response received from client was a No");
							//if a no was sent:
							//stop all readycheck chinanigans and hide readycheck, then kick the client out of the room and scrub all room data (dont forget to decrement activeUserNmbr for the room As well as inform the creator
							socket.emit('stop all readycheck chinanigans');
				
							clientList[clientIndex].activeRoom = "";
							clientList[clientIndex].roomActive = false;
							
							socket.room = DEFAULT_ROOM;
							socket.roomActive = false;
							
							activeFullRoomsList[roomIndex].activeUserNmbr -= 1;
							
							console.log("activeFullRoomsList AFTER -1 on activeUserNmbr: ", activeFullRoomsList[roomIndex]);
							
							socket.leave(activeFullRoomsList[roomIndex].name);
							socket.join(DEFAULT_ROOM);
							
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
			}else {
				socket.emit('ajabaja', "readycheck");
			}
		}
	});
	
	socket.on('register starting player', function() {
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].game.startingPlayer = true;
	});
	
	
	socket.on('roomleave data scrub', function() {
		var clientIndex = getClientIndex(socket.cid);
		
		if(socket.room != DEFAULT_ROOM)
		{
			socket.leave(socket.room);
			socket.join(DEFAULT_ROOM);
		}
		
		clientList[clientIndex].activeRoom = "";
		clientList[clientIndex].roomActive = false;
		
		socket.room = DEFAULT_ROOM;
		socket.roomActive = false;
		
		io.in(DEFAULT_ROOM).emit('update siteStatsArea', clientList); //should happen for both creator and client once reaches this point cuz at this point both that was in room should have left the room..
		
		socket.emit('update gameStatsArea', clientList[clientIndex].gameStats);
		
	});
	
	
	/*
	=================================================================
			Game logics emit events
	=================================================================
	*/	
	
	socket.on('register tictactoe move', function(cellHit) {
		//first I need to find out how I get roomIndex for the room this socket is in
		//clientList.activeRoom should provide us with that..
		console.log("inside of register tictactoe move");
		
		var clientIndex = getClientIndex(socket.cid);
		
		console.log("activeFullRoomsList contains: ", activeFullRoomsList);
		
		var roomIndex = -1;
		for(var i = 0; i < activeFullRoomsList.length; i++) //prepare for more than 1 activeFullRoom in that list..
		{
			if(activeFullRoomsList[i].name == clientList[socket.cid].activeRoom)
			{
				roomIndex = i;
			}
		}
		
		console.log("roomIndex = " + roomIndex);
		
		console.log("boardGrid with pieces placed: ", activeFullRoomsList[roomIndex].boardGrid);
		var gameOver = false;
		if(cellHit != -1) //ok it was confirmed a hit for one of the cells, up to server to check if that cell was not yet occupied...
		{
			console.log("cellHit was not -1 - aka an actual hit!");
			
			
			socket.emit('clear game timers');
			//if our cell that was hit contained a 0, aka not yet hit, then mark it as hit.
			activeFullRoomsList[roomIndex].boardGrid[cellHit-1] = (activeFullRoomsList[roomIndex].startingPlayerCID == socket.cid ? 1 : -1); //starting player marked with 1, other -1
			
			
			//io.in(socket.room).emit('update boardPieces');
			if(activeFullRoomsList[roomIndex].startingPlayerCID == socket.cid)
			{
				io.in(socket.room).emit('boardPieces update', 1);
				//if sending along clientID and they get "starting player" + clientID they know that Your board pieces = starting player, ergo 5 pieces, whilst same goes for not starting player + clientID = Your board pieces = 4 while opponent should have 5
			}else
			{
				io.in(socket.room).emit('boardPieces update', -1);
			}
			
			// console.log("move was added to boardGrid");
			
			clientList[clientIndex].game.movesMade += 1;
			
			
			//check win here?
			var winstats = funcs.checkWin(activeFullRoomsList[roomIndex].boardGrid);
			// for(var i = 0; i < winstats.length; i++)
			// {
			//		console.log("winstats: ", winstats[i]);
			// }
			
			
			//count how many 0's exist in boardGrid to find out if DRAW
			
			//loop it through and manually count every 0 there is in it
			var zeroCounter = 0;
			for(var i = 0; i < activeFullRoomsList[roomIndex].boardGrid.length; i++)
			{
				if(activeFullRoomsList[roomIndex].boardGrid[i] == 0)
				{
					zeroCounter += 1;
				}
			}
			// console.log("zeroCounter = " + zeroCounter);
			
			
			
			if(winstats[0].player != 0) //if a winner actually exists
			{
				// console.log("winner detected");
				
				//calculate all winpieces cellnmbrs - ONLY if more than 1 win
				
				var uniqueWinCells = null; //store the unique ones that will need repainting (if 2 rows complete at win = 1 common cell)
				if(winstats.length > 1) //if more than 1 completed row at win
				{
					var winCellNmbrs = [];
					for(var i = 0; i < winstats.length; i++) //for every winrow
					{
						winCellNmbrs[i] = winCombos[winstats[i].wincombo]; //fetch wincells per row
					}
					// console.log("winCellNmbrs[0]: ", winCellNmbrs[0]);
					// console.log("winCellNmbrs[1]: ", winCellNmbrs[1]);
					
					
					//once we got all the cellNmbrs in 2 arrays within winCellNmbrs, somehow merge and delete duplicates
					//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
					var winCellNmbrsConcat =  null;
					
					if(winstats.length == 2)
					{
						winCellNmbrsConcat = winCellNmbrs[0].concat(winCellNmbrs[1]); //merge these two win rows
					}else if(winstats.length == 3)
					{
						winCellNmbrsConcat = winCellNmbrs[0].concat(winCellNmbrs[1], winCellNmbrs[2]); //merge these two win rows
					}
					// console.log("length of concatenated winCellNmbrs arrays: " + winCellNmbrsConcat.length);
					
					// for(var i = 0; i < winCellNmbrsConcat.length; i++) 
					// {
					//		console.log("Iterated winCellNmbrs " + i + ": " + winCellNmbrsConcat[i]);
					// }
					
					uniqueWinCells = funcs.removeDuplicatesFromArray(winCellNmbrsConcat); //remove duplicate (common) cells from win rows
					// console.log("uniqueWinCells: ", uniqueWinCells);
					
				}else {
					uniqueWinCells = winCombos[winstats[0].wincombo]; //fetch wincells per row
					
					// console.log("single row wincell nmbrs: ", uniqueWinCells);
				}
				
				//we want to redraw the win pieces as marked cells here.. start by drawing what is not part of the win I think I figured:
				
				socket.emit('draw win', {winCells: uniqueWinCells, boardGrid: activeFullRoomsList[roomIndex].boardGrid}); //on a won game, increment wingame counter, and total game counter
				socket.to(socket.room).emit('draw lose', {winCells: uniqueWinCells, boardGrid: activeFullRoomsList[roomIndex].boardGrid}); //on a lost game, increment total game counter
				
				gameOver = true;
				
				//what to do once a win registered serverside:
				//add player winstats here to other connected client and update both total games
				socket.emit('update wins');
				io.in(socket.room).emit('update total games');
				
				//for the Avg time I need a Date object to compare it to
				var winTimestamp = Date.now();
				var gameTime = winTimestamp - activeFullRoomsList[roomIndex].createdTime;
				// console.log("gameTime = " + gameTime); //in the update avg game time event - have to convert it to seconds.. possibly minutes and seconds...
				
				io.in(socket.room).emit('update avg game time', gameTime); //add all times to clientList.games.time array and divide by the length
				
				//after drawn the win stuff, fixed the logics, we wanna return player to main screen
				//win basically means destroy the room and go back to main page, now we would love to have timer show up for 10 seconds, with realtime countdown and everything, letting them know they will be returned to main screen within that time
				//so I take it back, still some logics to fix:
				
				//remember the following logic will apply to ALL scenarios of gameOver = true;
				//start by showing the darndest clock?
				io.in(socket.room).emit('ending game procedure');
				io.in(socket.room).emit('deactivate leave room btn');
				
				//activeFullRoomsList.splice(roomIndex, 1);
				
				
				//the only thing that separates draw win and draw lose really is the plack text... oh well
			}else if(winstats[0].player == 0 && zeroCounter == 0) { //else if no boardPieces left and no winner, paint a draw FOR BOTH
				// console.log("draw detected"); //total games incremented for clients, easy for socket.emit (this socket) - for other client can send emit event to clientside "increment total games" and get backt o serverside to increment total games counter..
				io.in(socket.room).emit('draw draw', activeFullRoomsList[roomIndex].boardGrid); //paint as always but change placktext again..
				
				gameOver = true;
				
				io.in(socket.room).emit('update total games');
				
				var gameTimestamp = Date.now();
				var gameTime = gameTimestamp - activeFullRoomsList[roomIndex].createdTime;
				// console.log("gameTime = " + gameTime); //in the update avg game time event - have to convert it to seconds.. possibly minutes and seconds...
				
				io.in(socket.room).emit('update avg game time', gameTime);
				
				io.in(socket.room).emit('ending game procedure');
				io.in(socket.room).emit('deactivate leave room btn');
				
				//if draw total games should still increment for both clients
				//can easily be done for this specific socket, but for the other one a call to client first to then contact server for special event to increment total games has to be made
				
				
			} else {
				//if no win, no lose, no draw:
					// console.log("paint moves called serverside");
				io.in(socket.room).emit('paint moves', activeFullRoomsList[roomIndex].boardGrid);
			}
			
			//somehow fit in here if all boardPieces are used up by one player, game over, if no win by then - paint a draw
			
			//remember this shit should NOT happen if A WIN, A LOSE, or A DRAW --- only otherwise
		}else {
			//if it was -1 -- aka forfeit of turn -- decrement this sockets moves, while incrementing opponents
			// console.log("if forfeit of turn on serverside");
			var clientIndex = getClientIndex(socket.cid);
			socket.emit('clear game timers');
			
			clientList[clientIndex].game.movesMade -= 1;
			socket.emit('decrement boardPieces');
			
			socket.to(socket.room).emit('increment moves');
			socket.to(socket.room).emit('increment boardPieces');
			
			io.in(socket.room).emit('boardPieces update', 0);
			
			//update boardPieces as well!
		}
		
		if(gameOver == false)
		{
			clientList[socket.cid].game.currentMoveMaker = true;
			
			if(clientList[socket.cid].game.currentMoveMaker)
			{
				socket.emit('opponents turn in game');
				socket.to(socket.room).emit('your turn in game', activeFullRoomsList[roomIndex].boardGrid); 
				io.in(socket.room).emit('paint moves', activeFullRoomsList[roomIndex].boardGrid);
				clientList[socket.cid].game.currentMoveMaker = false;
			}
		}
	});
	
	socket.on('incrementing moves', function() {
		// console.log("incrementing moves serverside");
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].game.movesMade += 1;
	});
	
	socket.on('updating wins', function() {
		// console.log("inside of updating wins serverside");
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].gameStats.wonGames += 1;
	});
	
	socket.on('updating total games', function() {
		// console.log("inside of updatig total games serverside");
		
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].gameStats.totalGames += 1;
	});
	
	socket.on('updating avg game time', function(gameTime) {
		// console.log("inside of updating avg game time serverside");
		//add all times to clientList.games.time array and divide by the length
		var clientIndex = getClientIndex(socket.cid);
		
		gameTime = sanitizeData(gameTime);
		
		clientList[clientIndex].gameTimes.push(gameTime);
		
		var avgGameTimeSum = 0;
		for(var i = 0; i < clientList[clientIndex].gameTimes.length; i++)
		{
			avgGameTimeSum += clientList[clientIndex].gameTimes[i]/1000; //make ms into s
		}
		avgGameTimeSum = Math.floor(avgGameTimeSum / clientList[clientIndex].gameTimes.length);
		
		clientList[clientIndex].gameStats.avgGameTime = avgGameTimeSum;
	});
	
	socket.on('now we leave game', function() {
		//after drawn the win stuff, fixed the logics, we wanna return player to main screen
		//win basically means destroy the room and go back to main page, now we would love to have timer show up for 10 seconds, with realtime countdown and everything, letting them know they will be returned to main screen within that time
		//so I take it back, still some logics to fix:
		
		//every socket will reach this point
		// console.log("inside of ending game procedure serverside");
		
		io.in(socket.room).emit('clear game timers');
		
		var clientIndex = getClientIndex(socket.cid);
		
		
		
		// console.log("clientIndex = " + clientIndex);
		// console.log("socket.cid: ", socket.cid);
		
		// console.log("activeFullRoomsList contains: ", activeFullRoomsList);
		// console.log("clientList[socket.cid].activeRoom = ", clientList[socket.cid].activeRoom);
		
		//get activeFullRoomsList specific roomIndex
		var roomIndex = getRoomIndex(clientList[socket.cid].activeRoom, activeFullRoomsList); 
		
		// console.log("roomIndex printout in now we leave game: ", roomIndex);
		// console.log("activeFullRoomsList[roomIndex] contains: ", activeFullRoomsList[roomIndex]);
		
		//if creator of the room, clear created room data activeFullRoomsList[roomIndex]
		if(clientList[clientIndex].createdRoom.name == activeFullRoomsList[roomIndex].name)
		{
			clientList[clientIndex].createdRoom.name = "";
			clientList[clientIndex].createdRoom.pw = "";
			clientList[clientIndex].createdRoom.createdTime = 0;
			clientList[clientIndex].createdRoom.activeRoom = "";
			clientList[clientIndex].createdRoom.roomActive = false;
		}
		
		
		socket.emit('kick client from a room', roomList);
		
		if(roomList.length == 0)
		{
			// console.log("send out a beacon to clear all intervals on room leave if no more created rooms.");
			io.in(socket.room).emit('clear intervals');
			firstRoomCreated = false;
		}
		
		socket.emit('roomleaving data scrubbing');
		socket.emit('clear leave room timers');
		
	});
	
	/*
	=================================================================
			Leave room emit events below
	=================================================================
	*/
	
	socket.on('leave room', function(roomindex) {
		// console.log("inside of leave room serverside");
		
		var clientIndex = getClientIndex(socket.cid);
		
		roomindex = sanitizeData(roomindex);
		
		//to leave a room the user must be in a room - could it cause issue clientList[clientIndex] here if clientIndex was -1 -- Im thinking it might, damn gotta double check that...
		if(clientIndex != -1)
		{
			if(socket.userReg == true && clientList[clientIndex].roomActive == true)
			{
				io.in(socket.room).emit('clear game timers');
				
				//get room index
				//if the room has 1 user it will be in roomList, if 2 users it will be in activeFullRoomsList, hm... scroll through both, see what roomindex that becomes -1 - the one that is other than -1 is where the room can be found another assumption that safely can be made is there is only the creator in a room if it is in roomList
				
				var roomindex1 = -1, roomindex2 = -1;
				
				if(roomList.length > 0)
				{
					for(var i = 0; i < roomList.length; i++)
					{
						if(clientList[clientIndex].createdRoom.name == roomList[i].name)
						{
							roomindex1 = i;
						}
					}
				}
				
				if(activeFullRoomsList.length > 0)
				{
					for(var i = 0; i < activeFullRoomsList.length; i++)
					{
						if(clientList[clientIndex].createdRoom.name == activeFullRoomsList[i].name)
						{
							roomindex2 = i;
						}
					}
				}
				
				//only the creator we need to check for - bcuz he will exist in both rooms no matter if 1 person in it, or 2.
				
				var roomIndex = -1;
				if(roomindex1 != -1 && roomindex2 == -1)
				{
					roomIndex = getRoomIndex(socket.room, roomList);
					
				}else if(roomindex2 != -1 && roomindex1 == -1) 
				{
					roomIndex = getRoomIndex(socket.room, activeFullRoomsList);
				}
				
				if(roomindex1 == -1) //means room does not lie within roomList but in activeFullRoomsList, aka 2 people in room, aka below assumptions safe to make..
				{
					//if creator:
					if(clientList[clientIndex].createdRoom.name == activeFullRoomsList[roomIndex].name)
					{
						io.in(activeFullRoomsList[roomIndex].name).emit('kick client from a room', roomList);
						
						if(roomList.length == 0)
						{
							// console.log("send out a beacon to clear all intervals on room leave");
							io.in(activeFullRoomsList[roomIndex].name).emit('clear intervals');
						}
						
						socket.leave(activeFullRoomsList[roomIndex].name);
						socket.join(DEFAULT_ROOM); //this way next line emit only reaches client who is left in the room
						
						clientList[clientIndex].createdRoom.name = "";
						clientList[clientIndex].createdRoom.pw = "";
						clientList[clientIndex].createdRoom.createdTime = 0;
						clientList[clientIndex].activeRoom = "";
						clientList[clientIndex].roomActive = false;
						
						socket.room = DEFAULT_ROOM;
						socket.roomActive = false;
						
						io.in(activeFullRoomsList[roomIndex].name).emit('roomleaving data scrubbing');
						
						activeFullRoomsList.splice(roomIndex, 1);
						
						if(roomList.length == 0)
						{
							firstRoomCreated = false;
						}
						
						io.in(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
						
					}else {
						//client leaving room ..
						clientList[clientIndex].activeRoom = "";
						clientList[clientIndex].roomActive = false;
						
						socket.to(socket.room).emit('reset creator on client leave');
						socket.to(socket.room).emit('clear creator game-related data');
						
						socket.room = DEFAULT_ROOM;
						socket.roomActive = false;
						
						activeFullRoomsList[roomIndex].activeUserNmbr -= 1;
						
						console.log("activeFullRoomsList AFTER -1 on activeUserNmbr: ", activeFullRoomsList[roomIndex]);
						
						socket.leave(activeFullRoomsList[roomIndex].name);
						socket.join(DEFAULT_ROOM);
						
						//clear readycheck responses so that this eventdriven feature works the next time a single clinet leaves and then wants to rejoin
						//only do this if previously readycheck response was a yes though..
						// console.log("activeFullRoomsList contains: ", activeFullRoomsList[roomIndex].readycheck);
						
						activeFullRoomsList[roomIndex].readycheck.splice(0, 2);
						
						// console.log("activeFullRoomsList contains AFTER clearing readycheck: ", activeFullRoomsList[roomIndex].readycheck);
						
						
						//if a client answers No --- activeFullRoomsList index should be copied back over to roomList
						roomList.push(activeFullRoomsList[roomIndex]);
						activeFullRoomsList.splice(roomIndex, 1);
						socket.emit('kick client from a room', roomList);
						
						//reset the creator in the room to "simply be waiting"
						//commit creator "reset room" -- aka if they were playing, all game vars should be reset, default room mode should be shown, 
						clientList[clientIndex].game.movesMade = 0;
						//clientList[clientIndex].game.startingPlayer = false;
						clientList[clientIndex].lastMessageSent = 0;
						clientList[clientIndex].lastMessage = "";
						
						io.in(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
						
					}
				}else if(roomindex2 == -1)
				{
					//if creator wants to leave room before a client joined - do that here..
					if(roomList.length == 0)
					{
						// console.log("send out a beacon to clear all intervals on room leave");
						socket.emit(roomList[roomIndex].name).emit('clear intervals');
					}
					
					socket.leave(roomList[roomIndex].name);
					socket.join(DEFAULT_ROOM); //this way next line emit only reaches client who is left in the room
					
					clientList[clientIndex].createdRoom.name = "";
					clientList[clientIndex].createdRoom.pw = "";
					clientList[clientIndex].createdRoom.createdTime = 0;
					clientList[clientIndex].activeRoom = "";
					clientList[clientIndex].roomActive = false;
					
					
					
					socket.emit(roomList[roomIndex].name).emit('roomleaving data scrubbing');
					
					roomList.splice(roomIndex, 1);
					
					socket.emit(socket.room).emit('kick client from a room', roomList);
					
					socket.room = DEFAULT_ROOM;
					socket.roomActive = false;
					
					if(roomList.length == 0)
					{
						firstRoomCreated = false;
					}
					
					socket.emit(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
					
					//send immediate update of roomlist for the people in "connected" so they dont have any risk of joining a room that doesnt exist..
					io.in(DEFAULT_ROOM).emit('load roomlist', roomList);
					
				}
				//I have currently developed with naivité that users actually follow my set up interface... I should really "improve it" to not assume this..
			}else {
				socket.emit('ajabaja', 'leaveroom');
			}
		}
		
	});
	
	socket.on('clear creator game data', function() {
		//reset boardGrid
		//get clientIndex
		var clientIndex = getClientIndex(socket.cid);
		
		//get roomindex
		var roomIndex = -1;
		for(var i = 0; i < roomList.length; i++)
		{
			if(clientList[clientIndex].createdRoom.name == roomList[i].name)
			{
				roomIndex = i;
			}
		}
		
		roomList[roomIndex].boardGrid = [0,0,0,0,0,0,0,0,0];
		// console.log("roomList[].boardGrid: ", roomList[roomIndex].boardGrid);
		
		clientList[clientIndex].game.movesMade = 0;
		clientList[clientIndex].lastMessageSent = 0;
		clientList[clientIndex].lastMessage = "";
		
		roomList[roomIndex].movesMade = 0;
	});
	
	/*
	=================================================================
			Chat received emit events below
	=================================================================
	*/
	
	
	socket.on('command', function(command) {
		
		var clientIndex = getClientIndex(socket.cid);
		
		command = sanitizeData(command);
		
		if(clientIndex != -1)
		{
		
			if(socket.userReg == true && clientList[clientIndex].roomActive == true)
			{
			
				if(command.length > 14) // /changenick + 1 whitespace == 12 characters, minimum chars for nick is 2 => 14
				{
					//store command as last message here
					clientList[clientIndex].lastMessage = command;
					// console.log("in command storing lastMessage as: ", clientList[clientIndex].lastMessage);
					
					var theCommand = command.substr(1,10);
					// console.log("command: ", command);
					var type = "";
					// console.log("theCommand: " + theCommand);
					// console.log("theCommand length: " + theCommand.length);
					
					if(theCommand == "changenick")
					{
						// console.log("inside of changenick ifstatement");
						
						var newnick = command.substr(12); 
						
						if(newnick.length > 1 && newnick.length <= 25)
						{
							if(/^[a-zA-Z0-9]+$/.test(newnick))
							{
								var clientNameExist = false;
								//time to fix this part - first start by checking if username exist already or not - and remedy the situation.
															
								for(var i = 0; i < clientList.length; i++)
								{
									if(newnick == clientList[i].username)
									{
										clientNameExist = true;
									}
								}
								
								var oldNick = socket.username;
								
								if(clientID === 0 || !clientNameExist)
								{
									// console.log("inside changenick for clientID === 0 || !clientNameExist.");
									socket.username = newnick;
									clientList[clientIndex].username = newnick;
									
								}else {
									//if username DID exist:
									// console.log("changenick when username did exist");
									socket.username = newnick + clientList[clientIndex].clientID;
									// console.log("socket.username changed to following when nick exist: ", socket.username);
									
									clientList[clientIndex].username = newnick + clientList[clientIndex].clientID;
									// console.log("clientList[clientIndex].username changed to following when nick exist: ", clientList[clientIndex].username)
								}
								// console.log("socket.username after if statement in changenick: ", socket.username);								
								
								socket.emit('username successfully changed', socket.username);
								
								socket.to(socket.room).emit('username change', {oldNick: oldNick, newNick: socket.username});
								
							}else {
								socket.emit('unacceptable characters');
							}
						}
					}
				}else {
					//if it was a command, but not with sufficient data send back and inform user
						socket.emit('not enough data');
				}
			}else {
				socket.emit('ajabaja', 'typing');
			}
		}
	});
	
	socket.on('chat message', function(data) {
		// console.log("message: " + data.msg);
		
		data.msg = sanitizeData(data.msg);
		
		data.timestamp = sanitizeData(data.timestamp);
		
		var clientIndex = getClientIndex(socket.cid);
		
		if(clientIndex != -1)
		{
			//to type successfully user must be part of a room
			if(socket.userReg == true && clientList[clientIndex].roomActive == true)
			{
				
				//declare socket.textColor instead of having it inside clientList hm?
				//maybe even socket.lastMsgSent ? which is best?
				// console.log("clientList: ", clientList);
				// console.log("socket.username: ", socket.username); //<-- is correct, but not the changenick declaration for some reason hm...
				
				
				// console.log("user data is as follows: ", clientList[clientIndex]);
				
				clientList[clientIndex].lastMessage = data.msg;
				// console.log("in chat storing lastMessage as: ", clientList[clientIndex].lastMessage);
				
				var textColor = clientList[clientIndex].userColor;
				var timeDiff = Date.now() - clientList[clientIndex].lastMessageSent;
				// console.log("timeDiff between 2 sent messages is: " + timeDiff);
				if(timeDiff >= 500)
				{
					clientList[clientIndex].lastMessageSent = data.timestamp;
					// console.log("msgTimestamp: " + clientList[clientIndex].lastMessageSent);
					
					socket.emit('new message', {
						username: socket.username,
						textColor: "#000000",
						message: data.msg
					});
					
					socket.to(socket.room).emit('new message', {
						username: socket.username, 
						textColor: "#5BAEC9",
						message: data.msg
					});
				}else
				{
					//if messages was sent too close onto each other --- inform the user
					socket.emit('too fast typing');
				}
			}else {
				socket.emit('ajabaja', "typing");
			}
		}
	});
	
	//when the client emits 'isTyping', we broadcast that to other clients
	socket.on('isTyping', function() {
		// console.log("server side receiving isTyping emit");
		socket.to(socket.room).emit('isTyping', {
			username: socket.username
		});
	});
	
	//when client emits stopTyping, we broadcast that to other clients as well
	socket.on('stopTyping', function() {
		// console.log("server side receiving stopTyping emit");
		socket.to(socket.room).emit('stopTyping');
	});
	
	socket.on('stopTypingEnter', function() {
		// console.log("server side receving stopTypingEnter emit");
		socket.to(socket.room).emit('stopTypingEnter');
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
		// console.log("user disconnected");
		
		var clientToRemoveFromClientList = getClientIndex(socket.cid);
		
		socket.emit('clear intervals');
		
		if(clientToRemoveFromClientList > -1)
		{
			//here we know we got an actual user to disconnect
			//lets start with checking if our client to remove have created a room or not (if client have - check if more than just creator in it , if so - kick them)
			if(socket.roomActive)
			{
				//check socket.room 
				var roomIndexRoomList = getRoomIndex(socket.room, roomList);
					
				var roomIndexActiveFullRoomsList = getRoomIndex(socket.room, activeFullRoomsList);
				
				// console.log("roomIndexRoomList on disconnect = " + roomIndexRoomList + ", roomIndexActiveFullRoomsList on disconnect = " + roomIndexActiveFullRoomsList);
				
				var roomArray = (roomIndexActiveFullRoomsList != -1 ? activeFullRoomsList : roomList);
				
				//as far as I can tell - there will be 2 creator scenarios, and only 1 client scenario -- creator scenarios: creator + 1, creator alone
				
				
				//in case creator of room, and alone in the room (no client)
				if(clientList[clientToRemoveFromClientList].createdRoom.name != "" && roomIndexRoomList != -1)
				{
					//if a room has been created by our client, and only creator in the room
					//to do this I really would need to facking scroll through both roomList as well as activeFullRoomsList hm...
					
					// console.log("registered creator leave alone in room on disconnect");
					
					socket.emit('kick client from a room', roomList);
					
					clientList[clientToRemoveFromClientList].createdRoom.name = "";
					clientList[clientToRemoveFromClientList].createdRoom.pw = "";
					clientList[clientToRemoveFromClientList].createdRoom.createdTime = 0;
					
					io.in(socket.room).emit('roomleaving data scrubbing');
					
					roomList.splice(roomIndexRoomList, 1);
					
					//right after this has been removed, load roomList for all clients CONNECTED so that they immediately get updated roomList
					
					io.in(DEFAULT_ROOM).emit('load roomlist', roomList);
					
					if(roomList.length == 0)
					{
						firstRoomCreated = false;
						console.log("send out a beacon to clear all intervals on room leave");
						io.in(DEFAULT_ROOM).emit('clear intervals');
					}
					
				}else if(clientList[clientToRemoveFromClientList].createdRoom.name != "" && roomIndexActiveFullRoomsList != -1) 
				{
					// console.log("registered creator leave with full room on disconnect");
					//if a room has been created by our client, check if 2 people in that room
					//to do this I really would need to facking scroll through both roomList as well as activeFullRoomsList hm...
					
					io.in(socket.room).emit('disable readycheck');
					
					io.in(socket.room).emit('clear game timers');
					
					io.in(socket.room).emit('kick client from a room', roomList);
					
					//send out to client to leave the room as well...
					
					clientList[clientToRemoveFromClientList].createdRoom.name = "";
					clientList[clientToRemoveFromClientList].createdRoom.pw = "";
					clientList[clientToRemoveFromClientList].createdRoom.createdTime = 0;
					
					//reset game stats beforehand?
					io.in(socket.room).emit('roomleaving data scrubbing');
					
					activeFullRoomsList.splice(roomIndexActiveFullRoomsList, 1);
					
					//right after this has been removed, load roomList for all clients CONNECTED so that they immediately get updated roomList
					
					if(roomList.length == 0)
					{
						//firstRoomCreated = false;
						// console.log("send out a beacon to clear all intervals on room leave");
						io.in(DEFAULT_ROOM).emit('clear intervals');
					}
					
				}else if(clientList[clientToRemoveFromClientList].createdRoom.name == "" && roomIndexActiveFullRoomsList != -1) 
				{
					// console.log("registered client leave in room on disconnect");
					//its the client
					clientList[clientToRemoveFromClientList].activeRoom = "";
					clientList[clientToRemoveFromClientList].roomActive = false;
					
					socket.to(activeFullRoomsList[roomIndexActiveFullRoomsList].name).emit('reset creator on client leave');
					
					//ah must stop the readycheck timers here just in case readycheck is running
					io.in(socket.room).emit('clear game timers');
					
					socket.to(activeFullRoomsList[roomIndexActiveFullRoomsList].name).emit('clear creator game-related data');
					
					socket.room = DEFAULT_ROOM;
					socket.roomActive = false;
					
					activeFullRoomsList[roomIndexActiveFullRoomsList].activeUserNmbr -= 1;
					
					console.log("activeFullRoomsList AFTER -1 on activeUserNmbr: ", activeFullRoomsList[roomIndexActiveFullRoomsList]);
					
					socket.leave(activeFullRoomsList[roomIndexActiveFullRoomsList].name);
					socket.join(DEFAULT_ROOM);
					
					//clear readycheck responses so that this eventdriven feature works the next time a single clinet leaves and then wants to rejoin
					//only do this if previously readycheck response was a yes though..
					console.log("activeFullRoomsList contains: ", activeFullRoomsList[roomIndexActiveFullRoomsList].readycheck);
					
					activeFullRoomsList[roomIndexActiveFullRoomsList].readycheck.splice(0, 2);
					
					// console.log("activeFullRoomsList contains AFTER clearing readycheck: ", activeFullRoomsList[roomIndexActiveFullRoomsList].readycheck);
					
					
					//if a client answers No --- activeFullRoomsList index should be copied back over to roomList
					roomList.push(activeFullRoomsList[roomIndexActiveFullRoomsList]);
					activeFullRoomsList.splice(roomIndexActiveFullRoomsList, 1);
					socket.emit('kick client from a room', roomList);
					
					//reset the creator in the room to "simply be waiting"
					//commit creator "reset room" -- aka if they were playing, all game vars should be reset, default room mode should be shown, 
					clientList[clientToRemoveFromClientList].game.movesMade = 0;
					clientList[clientToRemoveFromClientList].lastMessageSent = 0;
					clientList[clientToRemoveFromClientList].lastMessage = "";
				}
				
			//how would i sense if the client was doing a readycheck or not hm..
			//or if playing a game and need to reset the other one -- like I did once before
			}
			//what to do if not roomActive user

			
			clientList.splice(clientToRemoveFromClientList, 1);
			
			//last thing to do, announce to all connected clients that someone DCed to update site stats
			socket.to(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
			
			if(clientList.length == 0) //only when everyone left should first room be available to spark new interval
			{
				//what happens with the interval if a client joins AFTER the interval has already begun? check this.
				firstRoomCreated = false;
				clientID = 0;
			}
		}
	});
});

http.listen(port, function() {
	console.log('listening on *:' + port + '');
});

//further "upgrade" this function to be "getArrayValueIndex(arr, needle)? or someth?
//also could move this to projectFunctions.js and use it from there, but honestly would take a lot of time to chase down everywhere this is being used in server.js, so I have deliberately chosen not to do this.
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

function getRoomIndex(selectedRoom, array) {
	var roomIndex = -1;
	for(var i = 0; i < array.length; i++)
	{
		if(array[i].name == selectedRoom)
		{
			roomIndex = i;
		}
	}
	return roomIndex;
}

function sanitizeData(toSanitize) {
	// console.log(toSanitize + " before sanitization: ", toSanitize);
		toSanitize = sanitizeHtml(toSanitize, {
		  allowedTags: [],
		  allowedAttributes: []
		});
		// console.log(toSanitize + " after sanitization: ", toSanitize);
	return toSanitize;
}