var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);
var port = process.env.PORT || 8007; //thanks lrc bth irc - this helps Heroku to run the app since they require process.env.PORT the || declares 8007 if process.env.PORT is not set (I believe)
var clientID = 0; //this is how we give ID's to ALL clients that connect - it increases everytime someone registers with a username, it never decrements
var roomList = []; //here are the rooms stored that are created but not yet full with 2 people in them
var activeFullRoomsList = []; //once 2 people enter a room, then get transfered from roomList to activeFullRoomsList (to make them disappear from roomlist so no1 else joins when they are full) - and when copied from roomList to activeFullRoomsList they are also removed from the roomList
var clientList = []; //this array will keep track of ALL the registered clients and their specific data necessary to run the application properly
var firstRoomCreated = false;
var leavingGameProcedure = false;
// var movesCounter = 0;
const DEFAULT_ROOM = "connected"; //declared our default room a constant since its reused so many times, and this helps if the name ever needs to change in future
const winCombos = {	1: [1,2,3], //the winCombos array keep track of all available win combinations of tictactoe (cell-wise) for example one win combo is cells 1,2 and 3 all marked by same player
					2: [4,5,6],
					3: [7,8,9],
					4: [1,4,7],
					5: [2,5,8],
					6: [3,6,9],
					7: [1,5,9],
					8: [3,5,7]};
var funcs = require('./js/projectFunctions'); //thank you earendel from ##javascript @ IRC - this allows us to refer to specifically exported functions within projectFunctions.js to server.js via funcs variable
var sanitizeHtml = require('sanitize-html'); //this library helps us sanitize input data, below is how the library is to be used

// Allow only a super restricted set of tags and attributes
//https://github.com/punkave/sanitize-html
/*var clean = sanitizeHtml(input, {
  allowedTags: [],
  allowedAttributes: []
});*/


//to load static resources I was required to "include" the working directory with below line of code
app.use(express.static(__dirname));

app.get('/', function(req, res) {
	res.sendFile('index.html');
});


io.on('connection', function(socket) {
	console.log("inside of connect event serverside");
	
	// console.log("socket.rooms: ", socket.rooms);
	console.log("socket.id: ", socket.id);
	socket.userReg = false;
	
	/*
	=================================================================
			Server received emit events below
	=================================================================
	*/
	
	//first step of our interface - users should register a username
	socket.on('user registration', function(username) {
				
		username = sanitizeData(username); //use the sanitization library to sanitize the inputted username from clientside
		
		if(socket.userReg == false) //this helps us prevent clientside interface manipulation which entail already registered users manipulating interface to re-register when they already are
		{
			var clientNameExist = false;
			for(var i = 0; i < clientList.length; i++) //with this we check if the desired username already exists
			{
				if(clientList[i].username == username)
				{
					clientNameExist = true;
				}
			}
			
			//once the user is properly registered, they should join the default room
			socket.join(DEFAULT_ROOM); //join general "connected room" to ease the broadcasting more - on join a "real" room - leave this common "connected" room. To only receive the relevant messages
			
			socket.cid = clientID; // save clientID to the socket
			
			console.log("socket.cid = " + socket.cid);
			
			if(clientID === 0 || !clientNameExist) //if its the very first connected client, or if the username did not exist, then the desired username is allowed for the client
			{
				socket.username = username;
				console.log("inside of clientID === 0 || !clientNameExist when registering user.");
			}else {
				//else if username DID exist -- (this saves us from having them retry other usernames) - simply add the clientID to the desired username to make it "unique"
				socket.username = username + clientID;
				
			}
			
			//here we populate the clientList with this connected clients client data necessary for the application functions
			clientList.push({	username: socket.username, 
								//userChatColor: "", //(oneRegisteredUser == false ? "#0000ff" : "#ff0000"),
								createdRoom: {name: "", pw: "", createdTime: 0}, 
								clientID: clientID,
								roomActive: false,
								//intervalSet: {set: false, intervalID: null},
								lastMessageSent: 0,
								lastMessage: "",
								game: {currentMoveMaker: false},
								gameStats: {wonGames: 0, totalGames: 0, avgGameTime: 0},
								gameTimes: []});
								
			var clientIndex = getClientIndex(socket.cid); //since we use array.push we get clientIndex with this function that can be found at the end of server.js
			console.log("clientList[" + clientIndex + "]: ", clientList[clientIndex]);
			
			io.in(DEFAULT_ROOM).emit('update siteStatsArea', clientList); //every time a new client connects, we broadcast to ALL incl. this client in the default room to update how many users are connected and registered as well as inside of a game room
			
			clientID += 1; //increment for every user ever created - but never remove on disconnects so the counter always is unique
				
			console.log("clientList: ", clientList);
			
			socket.emit('user registered', socket.username); //when we gotten this far, the client can properly be considered registered, so server lets the client know this so interface can move on to the next stage
			
			console.log("user: " + socket.username + " is registered.");
			
			socket.userReg = true; //this is important to prevent clientside interface manipulations (once a user is registered, dont allow them to re-register)
			
			//if user reg is completed, check to see if roomList.length have any rooms
			//if there is - trigger a roomlist update for the client to see available rooms
			if(roomList.length > 0)
			{
				socket.emit('load roomlist', roomList);
			}
		}else { //if someone manipulated the clientside interface and they already are registered but try to re-register... big nono, not allowed.
			socket.emit('ajabaja', "userreg");
		}
	});
	
	
	socket.on('start roomlist update', function() {
		if(leavingGameProcedure == true) //doing this here because when ending game procedure is triggered later serverside need a way to keep track of ending game countdown procedure clock so leave room button doesn't interfere, and 'start roomlist update' event is triggered after clients have been interface-wise kicked from the room and no harm can come from the button anymore
		{
			leavingGameProcedure = false;
		}
		
		socket.emit('initiate roomlist update');
	});
	
	/*
	=================================================================
			Create room received emit events below
	=================================================================
	*/
	
	//when a user clicks to create a room clientside, this is where we deal with it serverside
	socket.on('create room', function(data) {
		console.log("inside of create room serverside"); //helps us keep track of whats happening in the interface serverside
		
		var clientIndex = getClientIndex(socket.cid);
		
		if(clientIndex != -1) //very important - basically getClientIndex function returns -1 is user does not exist, so this means that user did exist (prevents non-registered users from again manipulating interface clientside to create rooms without a username or clientList data profile to store the info in)
		{
			if(socket.userReg == true && clientList[clientIndex].createdRoom.name == "") //this makes sure that the user is registered and does NOT have an already created room (would mean clientside interface manipulation if user has already created room)
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
				
				//only stringify if not empty (buggy if stringify an empty pw - I tried, it gave me something like '""'
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
				
				socket.emit('stop lobby update interval'); //this stops roomlists "created ago 15s update" from running when client is about to join his created room - we don't need it to update roomlist if we are already in a game room (and can't see the roomlist anyways)
				
				//here we populate the createdRoom object for the registered client
				clientList[clientIndex].createdRoom.name = lobbyname;
				clientList[clientIndex].createdRoom.pw = (pwSet ? pw : "none");
				clientList[clientIndex].createdRoom.createdTime = Date.now();
				
				console.log("clientList[" + clientIndex + "] after room creation: ", clientList[clientIndex]);
				
				//then we populate our roomList array via .push to hold data for the created room 
				roomList.push({name: lobbyname, //sanitized lobbyname for the game room created stored here
								pw: (pwSet ? pw : "none"), //previously declared pwSet for whether pw was empty or not helps determine if a pw should be stored or not
								firstUserJoined: true,  //creator joins auto on room creation
								activeUserNmbr: 1, //creator joins automatically on room creation - hence the 1 active user counter number
								createdTime: clientList[clientIndex].createdRoom.createdTime, 
								readycheck: [],
								startingPlayerCID: -1, //not defined until readycheck completed aka -1
								boardGrid: [0,0,0,0,0,0,0,0,0], //will keep track of both players every moves made for this game room's tic tac toe
								movesMade: 0});
								
				console.log("roomList: ", roomList);
				
				//this tells clients interface that his creation of room was completed and client is ready to proceed to next stage in the interface for when created a room
				socket.emit('created and joined room', roomList.length-1); //-1 needed for index and since using "push" method - put last in array
				
				//when room has been created, user should leave default room to no longer receive broadcasts that are done for people in that room and in that part of the interface
				socket.leave(DEFAULT_ROOM);
				
				//whilst user should join a virtual room for the specific room he/she created to receive broadcast emits and roomspecific emits to that room in particular
				socket.join(lobbyname);
				
				//when a socket joins a room, just as well to keep track of it via socket for convenience for later roomname references etc.
				socket.room = lobbyname;
				console.log("client: " + clientIndex + " left connected room and joined: " + lobbyname);
				
				//these are also used for actions later
				socket.roomActive = true;
				clientList[clientIndex].roomActive = true;
				
				//this allows creator of a room to "bypass" pw-requirement whilst other users looking to join will be required to input pw (if there is any for the room)
				socket.emit('creator joins room', {username: clientList[clientIndex].username, room: socket.room}); 
				
				console.log("firstRoomCreated: ", firstRoomCreated);
				
				//this is for when multiple sockets are connected, and first room is created - then roomlist should be "updated" for ALL connected and registered sockets within default room
				if(firstRoomCreated == false)
				{
					socket.to(DEFAULT_ROOM).emit('load roomlist', roomList);
					firstRoomCreated = true;
				}
				
				//also update siteStatsArea in the interface with how many clients are connected AND* how many are NOT in a room (since creator auto joins room, he/she will be in a room, and thereby not NOT in a room - hence need for update :)
				socket.to(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
				
			}else { //for example if user already have a room, or is not registered and attempts to create a new room, big nono, not allowed.
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
		
		//noticed even this HTML attribute value had a risk of being manipulated so I sanitize it as well - it's transfered serverside in case the roomlist update has a selected value that should be selected even after the update (its hella annoying to have selected list option be un-selected each time roomlist updates for the "created time ago" feature)
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
	
	//if a user selected a room option and pressed "join room", this is where we handle it serverside
	socket.on('join room', function(selectedRoom) {
		console.log("inside of join room serverside");
		
		//make sure that the room actually sent along on the join room submit was a room that actually exist in our list
		//loop through our roomlist, check if the selected room exists, check if user is registered (also a must), check if any rooms have been created - aka if selected room exists
		
		selectedRoom = sanitizeData(selectedRoom);

		//when this is triggered, assume room is full, since this is client joining the room, and room only have capacity of 2 - and creator joined upon room creation
		
		
		//data will be .val() of selected select-option list - which in our case is the room name to be joined for socket.
		//so when a user attempts to join a specific room - first thing to do is identify the room and check whether or not it is PW protected.
		
		//check if the room has password set
		
		
		//getRoomIndex is similar to getClientIndex and also returns -1 if room did not exist within list searched
		var roomIndex = getRoomIndex(selectedRoom, roomList); 
		
		//user need to be successfully registered and room needs to exist to have socket be able to join the room
		if(socket.userReg == true && roomIndex != -1)
		{
			if(roomList[roomIndex].pw !== "none") //if there is a PW to gain access to room
			{
				socket.emit('show login form', roomIndex);
				
			}else {
				//if no pw - join room instantly
				//if successful send successful login and do all the necessary serverside actions to login user to room
				if(roomList[roomIndex].activeUserNmbr < 2) //if a room already is full (might happen somehow), socket should not be able to join the already full room
				{
					socket.leave(DEFAULT_ROOM); //to join room, actions taken is similar to when creator joined the room, leave the default room to avoid receiving broadcasted emits to that room with purpose of updating the roomlist interface, since a socket inside a room have no need for that
				
					//then join the virtually and logically created room specific for this room
					socket.join(roomList[roomIndex].name);
					
					var clientIndex = getClientIndex(socket.cid);
					
					console.log("stopping interval on joining room");
					socket.emit('stop lobby update interval'); // - again if socket joins a room and enters a room interface-wise, we don't want to keep updating roomlist interface
					
					roomList[roomIndex].activeUserNmbr += 1; //should bring it up to 2 in this event aka full room
					
					//when full room aka 2 people having joined (creator + client) should trigger readycheck. And on second user joining room - every client in that room should get the readycheck AND notify in chat that a user joined the room
					
					//same as for creator for convenience later - store rooms name in socket variable easily accessible
					socket.room = roomList[roomIndex].name;
					console.log("client: " + clientIndex + " left connected room and joined: " + roomList[roomIndex].name);
					
					//switch these two boolean vars to true since this socket now as well is active in a room - used for actions later
					socket.roomActive = true;
					clientList[clientIndex].roomActive = true; //check when these two are used, and why I necessarily need both of them?
					
					//when a client joins a room and brings it to a full room, push over a copy of all the room data over to the activeFullRoomsList while removing it from lobbylist by removing from roomList array
					activeFullRoomsList.push(roomList[roomIndex]);
					
					var newRoomIndex = -1;
					for(var i = 0; i < activeFullRoomsList.length; i++)
					{
						if(activeFullRoomsList[i].name == socket.room)
						{
							newRoomIndex = i;
						}
					}
					//but what is it used for really?
					io.in(socket.room).emit('update roomToLoginTo index', newRoomIndex); //when both joins we need to update this since room changed storage-array and thereby also got new index
					
					console.log("activeFullRoomsList after push-copy now contains: ", activeFullRoomsList);
					
					//once the room have been successfully transfered as a copy to activeFullRoomsList, its safe to remove it from roomList
					roomList.splice(roomIndex, 1); //remove from roomList
					
					console.log("roomList after spliced away the joined room consist of: ", roomList);
					
					//after the room has been removed from roomList, an (instant) update for ALL connected and registered users of the roomlist is required, since the full room hereby will be removed from the list so no1 else can join (the purpose of moving from roomList to activeFullRoomsList)
					socket.to(DEFAULT_ROOM).emit('load roomlist', roomList);
					
					//notify clientside that server has successfully taken necessary actions to have client join the room desired serverside and interface should thereby change to the next appropriate stage
					socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room}); 
					
					//this emit method sends to all in room EXCEPT sender himself. - Means to notify those already in the room (aka creator) that the user joined the room.
					socket.to(socket.room).emit('client joined room', clientList[clientIndex].username);
					
					//which means every time a client/user joins a room that is not the creator - readycheck should commence and broadcast that a user joined the room to all in that room should be done, every time.
					
					//and since another client joined a room, update the siteStatsArea keeping track of how many connected clients are in the room
					socket.to(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
				}
			}
		}else { //if room doesn't exist or user is not registered, big nono - not allowed
			socket.emit('ajabaja', "joinroom");
		}		
	});
	
	//if a room was pw protected, and a user attempts to join it, by entering pw and pressing login, this is where we handle it serverside
	socket.on('room login attempt', function(data) {
		console.log("inside of room login attempt serverside");
		
		data.roomindex = sanitizeData(data.roomindex);
		
		console.log("pw transfer before stringify: ", data.pw);
		data.pw = JSON.stringify(data.pw);
		console.log("pw transfer after stringify: ", data.pw);
		
		//user must be registered, and the room must exist
		if(socket.userReg == true && data.roomindex != -1)
		{
			//room musn't be full either
			if(roomList[data.roomindex].activeUserNmbr < 2)
			{
				console.log("data contains (on login attempt): ", data);
				console.log("roomList[" + data.roomindex + "] contains: ", roomList[data.roomindex]);
				
				//check if the room with roomindex's pw matches data.pw
				if(roomList[data.roomindex].pw == data.pw)
				{
					console.log("pws matched, joining room");
					
					//if the pw's matched, and client is about to join room, more or less same action as for when creator joins room, or client joins pw-lacking room should be taken here
					//we start by leaving the default room to not receive those interface related broadcasts and emit events since we are not going to need it when we are inside a room
					socket.leave(DEFAULT_ROOM);
					
					//we also join the virtual/logical room specific to the room we logged into
					socket.join(roomList[data.roomindex].name);
					
					var clientIndex = getClientIndex(socket.cid);
					
					//we stop the roomlist update from continuously running, since we won't be seeing it anyways
					socket.emit('stop lobby update interval');
					
					//we store the room name for convenience in socket variable
					socket.room = roomList[data.roomindex].name;
					console.log("client: " + clientIndex + " left connected room and joined: " + roomList[data.roomindex].name);
					
					//we switch these booleans to true for later actions
					socket.roomActive = true;
					clientList[clientIndex].roomActive = true;
					
					//we increment the activeUserNmbr counter for the room so the application knows its full
					roomList[data.roomindex].activeUserNmbr += 1;
					
					//since room now (should be) full we copy it over to activeFullRoomsList array to store it there
					activeFullRoomsList.push(roomList[data.roomindex]);
					
					//and then we remove it from the roomList to have it "disappear" from our roomlist so no1 else can join the now full room
					roomList.splice(data.roomindex, 1); //remove from roomList
					
					//and we notify clientside to change this clients interface to join the room since the login process was successful
					socket.emit('client joins room', {username: clientList[clientIndex].username, room: socket.room});
					
				}else {
					//if failed pw -- notify user
					socket.emit('room login failed');
					console.log("pw failed");
				}
			}else {
				console.log("unintended usage detected, or bug, javascript manipulation clientside possibility.");
				//if more than 2 already in room due to js manipulation
				socket.emit('too many in room');
			}
		}else { //if room does not exist or user is not registered
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
		
		//should probably make sure so the actual roomname exist in the roomlist here (to avoid js manipulation)
		var exists = false;
		for(var i = 0; i < activeFullRoomsList.length; i++)
		{
			if(activeFullRoomsList[i].name == roomname)
			{
				exists = true;
				break; //if/when room was found to exist, break out of the for loop to continue the trigger readycheck broadcast for room code
			}
		}
		
		if(exists)
		{
			io.in(roomname).emit('readycheck'); //shows readycheck form clientside to ALL connected in that specific room
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
			
			
			var clientIndex = getClientIndex(socket.cid);
			
			console.log("clientIndex turns out as (in readycheck): ", clientIndex);
			
			var roomIndex = getRoomIndex(socket.room, activeFullRoomsList);
			
			console.log("roomIndex turns out as (in readycheck): ", roomIndex);
			
			console.log("readycheck data contains: ", data);
			
			console.log("READYCHECK DATA: activeFullRoomsList[roomIndex].activeUserNmbr contains: ", activeFullRoomsList[roomIndex].activeUserNmbr);
			
			console.log("READYCHECK DATA: socket.room contains: ", socket.room);
			console.log("READYCHECK DATA: socket.userReg: ", socket.userReg);
			
			//make sure user is connected and successfully registered, and that socket have joined a room and that the room socket is in is full (2 people in it)
			if(socket.userReg == true && activeFullRoomsList[roomIndex].activeUserNmbr == 2)
			{
				//pushing the response directly into the readycheck array for the room first thing we do
				activeFullRoomsList[roomIndex].readycheck.push({user: clientList[clientIndex].username, response: data});
				
				console.log("--------------------------------------------------------------");
				
				if(activeFullRoomsList[roomIndex].readycheck.length == 1)
				{
					//if its the first response received serverside
					console.log("pushed readycheck responses = 1");
					console.log("activeFullRoomsList[" + roomIndex + "] data : ", activeFullRoomsList[roomIndex]);
					console.log("activeFullRoomsList[" + roomIndex + "].readycheck data: ", activeFullRoomsList[roomIndex].readycheck);
					
					//find out if response was sent from creator or client
					if(clientList[clientIndex].createdRoom.name == socket.room) //if this clients createdRoom.name matches sockets joined room -- then its the creator
					{
						console.log("first readycheck response received from creator of the room");
						//so we now know, its the very first response received serverside
						//its the creator that sent the response
						//we have what type of response
						//if a yes: stop all readycheck chinanigans and hide readycheck and load waiting for opponent interface
						if(data == true)
						{
							console.log("first readycheck response from creator was Yes");
							socket.emit('stop all readycheck chinanigans');
						
						}else {
							console.log("first readycheck response from creator was No");
							//if a no: ALL readycheck activity should seize for ALL clients in the room, readycheck should be clientside hidden, client should be kicked out of the room and scrubbed of room data, and so should the creator -- Buuut, room should also be deleted completely from our activeFullRoomsList
							
							io.in(activeFullRoomsList[roomIndex].name).emit('stop all readycheck chinanigans');
							
							//kick ALL clients in the room interface-wise out of the room (and load roomList anew - since thats the interface part clients will be kicked to)
							io.in(activeFullRoomsList[roomIndex].name).emit('kick client from a room', roomList);
							
							//if the roomlist is empty, we don't need to keep updating roomlist, since there is nothing to update, so we clear all possible update intervals for BOTH clients
							if(roomList.length == 0)
							{
								console.log("send out a beacon to clear all intervals on room leave");
								io.in(activeFullRoomsList[roomIndex].name).emit('clear intervals');
							}
							
							//scrub room data - need to be done for both client and creator
							//since this socket only knows this sockets data, I cannot do this for both creator and client, so I first need to send to all clients who are still logically inside the room (just not interface wise), and have both creator and client send emits back to server about having room data scrubbed
							
							//since this was the room creator readycheck response we can clear room creator related data here because we have access to it
							clientList[clientIndex].createdRoom.name = ""; 
							clientList[clientIndex].createdRoom.pw = "";
							clientList[clientIndex].createdRoom.createdTime = 0;
							
							
							io.in(activeFullRoomsList[roomIndex].name).emit('roomleaving data scrubbing');
							console.log("sending roomleaving data scrubbing to the remaining party in the room (the client)");
							
							//removing the actual room and all of its related data from activeFullRoomsList
							activeFullRoomsList.splice(roomIndex, 1);
							
							//if the roomList contains no created rooms, we can reset "firstRoomCreated" variable
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
														
						}else {
							console.log("first readycheck response received from client was a No");
							//if a no was sent:
							//stop all readycheck chinanigans and hide readycheck, then kick the client out of the room and scrub all room data (dont forget to decrement activeUserNmbr for the room As well as inform the creator)
							
							//reset room-related data vars for client
							clientList[clientIndex].roomActive = false;
							
							socket.room = DEFAULT_ROOM;
							socket.roomActive = false;
							
							//decrement activeUserNmbr counter since client answered no and is about to leave by getting kicked out of the room and back to roomlist interface stage
							activeFullRoomsList[roomIndex].activeUserNmbr -= 1;
							
							//have client virtually/logically leave room and join back with the default room
							socket.leave(activeFullRoomsList[roomIndex].name);
							socket.join(DEFAULT_ROOM);
							
							socket.emit('stop all readycheck chinanigans');
							
							//message sent to creator informing that client (with username) declined readycheck and thereby left room
							socket.to(activeFullRoomsList[roomIndex].name).emit('a user left the room', clientList[clientIndex].username);
							
							//clear readycheck responses so that this eventdriven feature works the next time a single clinet leaves and then wants to rejoin
							activeFullRoomsList[roomIndex].readycheck.splice(0,2);
							console.log("activeFullRoomsList[roomIndex].readycheck after clearing", activeFullRoomsList[roomIndex].readycheck);
							
							socket.to(activeFullRoomsList[roomIndex].name).emit("stop all readycheck chinanigans"); //sent to creator of the room (since this socket already virtually/logically left the room) to interrupt readycheck if client left during readycheck
							
							//since room no longer full (because of client kicked from room due to no readycheck response), move room back into the roomList to give other clients option to join it since no longer full
							roomList.push(activeFullRoomsList[roomIndex]);
							activeFullRoomsList.splice(roomIndex, 1); //once successfully copied back to roomList, remove from activeFullRoomsList
							
							//interface-wise kick client from room
							socket.emit('kick client from a room', roomList);				
						}
					}
				}else if(activeFullRoomsList[roomIndex].readycheck.length == 2)
				{
					console.log("second readycheck response received");
					console.log("activeFullRoomsList[" + roomIndex + "] data : ", activeFullRoomsList[roomIndex]);
					console.log("activeFullRoomsList[" + roomIndex + "].readycheck data: ", activeFullRoomsList[roomIndex].readycheck);
					//if second response server receives from readycheck
					
					//if yes from creator -> client reaches this part, if yes from client -> creator reaches this part
					
					//find out if response was sent from creator or client
					if(clientList[clientIndex].createdRoom.name == socket.room) //when sockets createdRoom.name matches the sockets joined room - that means we have creator of the room
					{
						console.log("second readycheck response was from creator");
						//its the second response received serverside
						//its the creator that sent the response
						//we have what type of response
						//if a yes: stop all readycheck chinanigans and hide readycheck and start randomization of starting player to commence game
						if(data == true)
						{
							console.log("second readycheck response from creator was Yes");
							socket.emit('stop all readycheck chinanigans');
							
							//determine who should start here already
							//RNG between 0 & 1 -> index for player response that holds player names
							//if for example response 0 got to start, then I can broadcast to all in room EXCEPT this socket, if response 1 got to start - broadcast to this socket to get to start simple
							var startingPlayer = funcs.randomize(0,1); //calling on randomize function exported from projectFunctions.js via funcs
							console.log("startingPlayer is response: ", startingPlayer);
							
							var startingPlayerUsername = activeFullRoomsList[roomIndex].readycheck[startingPlayer].user;
							console.log("starting player username is: " + startingPlayerUsername);
							
							var startingPlayerCID = -1; //used to track starting player client ID to easily later be fetched if needed
							
							for(var i = 0; i < clientList.length; i++)
							{
								if(clientList[i].username == startingPlayerUsername)
								{
									startingPlayerCID = i;
								}
							}
							console.log("starting player CID = " + startingPlayerCID);
							
							activeFullRoomsList[roomIndex].startingPlayerCID = startingPlayerCID;
							
							if(startingPlayer == 0)
							{
								console.log("starting player is first readycheck responder"); //and since this is creator on second response that means client
								//if first response gets to start, broadcast to all except this socket in the room (a.k.a: the client)
								socket.to(socket.room).emit('set board piece client value', 5); //starting player always have 5 pieces to move in tic tac toe, checked it myself
								socket.emit('set board piece client value', 4);
								
								io.in(socket.room).emit('prep for start of game'); //for both users in the room
								
								io.in(socket.room).emit('boardPieces paintout');
								
								socket.to(socket.room).emit('your turn in game'); //instruct startingplayer clientside its his turn in the game (to start)
								socket.emit('opponents turn in game'); //and viceversa for not-starting player instruct to wait turn
								
							}else if(startingPlayer == 1)
							{
								console.log("starting player is second readycheck responder");
								
								socket.emit('set board piece client value', 5);
								socket.to(socket.room).emit('set board piece client value', 4);
								
								io.in(socket.room).emit('prep for start of game');
								
								io.in(socket.room).emit('boardPieces paintout');
								
								socket.emit('your turn in game');
								socket.to(socket.room).emit('opponents turn in game');
							}
						}else {
							console.log("second readycheck response from creator was a No");
							
							//if a creator no: ALL readycheck activity should seize for ALL clients in the room, readycheck should be clientside hidden, client should be kicked out of the room and scrubbed of room data, and so should the creator -- Buuut, room should also be deleted completely from our roomList or activeFullRoomsList
							io.in(activeFullRoomsList[roomIndex].name).emit('stop all readycheck chinanigans');
							
							io.in(activeFullRoomsList[roomIndex].name).emit('kick client from a room', roomList);
							
							//since kicking client from room event initiates a room update -- clear room update intervals in case there are no room created
							if(roomList.length == 0)
							{
								console.log("send out a beacon to clear all intervals on room leave");
								io.in(activeFullRoomsList[roomIndex].name).emit('clear intervals');
							}
							//scrub room data - need to be done for both client and creator
							
							//since this response was from creator, I can here clear the creator-related game room data
							clientList[clientIndex].createdRoom.name = "";
							clientList[clientIndex].createdRoom.pw = "";
							clientList[clientIndex].createdRoom.createdTime = 0;
							
							//scrubs room data and leaves room logically for both creator and client
							io.in(activeFullRoomsList[roomIndex].name).emit('roomleaving data scrubbing');
							
							//removing the actual room and all of its related data
							activeFullRoomsList.splice(roomIndex, 1);
							
							//and again - if no rooms created reset the firstRoomCreated var
							if(roomList.length == 0)
							{
								firstRoomCreated = false;
							}
						}
					}else
					{
						console.log("second readycheck response was from client");
						//else if client.. and second response
						//if client sent second response received serverside as a yes:
						//stop all readycheck timers and chinanigans, hide readycheck and load canvas interface in wait for other - the creator
						if(data == true)
						{
							console.log("second readycheck response from client was Yes");
							socket.emit('stop all readycheck chinanigans');
							
							//if client responded true:
							//stop all readycheck stuff, and, broadcast start game to both clients
							//determine who should start here already
							//RNG between 0 & 1 -> index for player response that holds player names
							//if for example response 0 got to start, then I can broadcast to all in room EXCEPT this socket, if response 1 got to start - broadcast to this socket to get to start simple
							var startingPlayer = funcs.randomize(0,1); //randomizing between 0 and 1 (responses)
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
								
							}else if(startingPlayer == 1)
							{
								console.log("starting player is second readycheck responder");
								
								socket.emit('set board piece client value', 5);
								socket.to(socket.room).emit('set board piece client value', 4);
								
								io.in(socket.room).emit('prep for start of game');
								
								io.in(socket.room).emit('boardPieces paintout');
								
								socket.emit('your turn in game');
								socket.to(socket.room).emit('opponents turn in game');
							}					
						}else {
							console.log("second readycheck response received from client was a No");
							//if a no was sent:
							//stop all readycheck chinanigans and hide readycheck, then kick the client out of the room and scrub all room data (dont forget to decrement activeUserNmbr for the room As well as inform the creator
							socket.emit('stop all readycheck chinanigans');
							
							clientList[clientIndex].roomActive = false;
							
							socket.room = DEFAULT_ROOM;
							socket.roomActive = false;
							
							activeFullRoomsList[roomIndex].activeUserNmbr -= 1;
							
							console.log("activeFullRoomsList AFTER -1 on activeUserNmbr: ", activeFullRoomsList[roomIndex]);
							
							socket.leave(activeFullRoomsList[roomIndex].name);
							socket.join(DEFAULT_ROOM);
							
							socket.to(activeFullRoomsList[roomIndex].name).emit('a user left the room', clientList[clientIndex].username); //informs creator that client responded no to readycheck and thereby left room
							
							//clear readycheck responses so that this eventdriven feature works the next time a single clinet leaves and then wants to rejoin
							console.log("activeFullRoomsList contains: ", activeFullRoomsList[roomIndex].readycheck);
							
							activeFullRoomsList[roomIndex].readycheck.splice(0, 2);
							
							console.log("activeFullRoomsList contains AFTER clearing readycheck: ", activeFullRoomsList[roomIndex].readycheck);
							
							//if a client answers No --- activeFullRoomsList index should be copied back over to roomList and then removed from activeFullRoomsList since not full anymore
							roomList.push(activeFullRoomsList[roomIndex]);
							activeFullRoomsList.splice(roomIndex, 1);
							
							socket.emit('kick client from a room', roomList); //kicks client interface wise from room back to "main screen"
						}
					}
				}
			}else { //if user is not registered or room is not full - big nono - not allowed
				socket.emit('ajabaja', "readycheck");
			}
		}
	});
	
	//nifty handler to clear common game room related data for clients on room leave
	socket.on('roomleave data scrub', function() {
		var clientIndex = getClientIndex(socket.cid);
		
		if(socket.room != DEFAULT_ROOM)
		{
			socket.leave(socket.room);
			socket.join(DEFAULT_ROOM);
		}
		
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
	
	//once one of the canvas tic tac toe board cells are clicked, this handler is triggered to register a tic tac toe move
	socket.on('register tictactoe move', function(cellHit) {
		console.log("inside of register tictactoe move");
		
		var clientIndex = getClientIndex(socket.cid);
		
		console.log("activeFullRoomsList contains: ", activeFullRoomsList);
		
		var roomIndex = -1;
		for(var i = 0; i < activeFullRoomsList.length; i++) //for loop to prepare for more than 1 activeFullRoom in that list..
		{
			if(activeFullRoomsList[i].name == socket.room)
			{
				roomIndex = i;
			}
		}
		
		console.log("roomIndex = " + roomIndex);
		
		console.log("boardGrid with pieces placed: ", activeFullRoomsList[roomIndex].boardGrid);
		
		var gameOver = false;
		
		if(cellHit != -1) //ok it was confirmed a hit for one of the cells, up to server to check if that cell was not yet occupied...
		{
			console.log("cellHit was not -1 - aka it was an actual hit!");
			
			socket.emit('clear game timers'); //stops the game turn timer for the client that just made a tic tac toe move
			
			//if our cell that was hit contained a 0 in boardGrid (aka not yet a hit), then mark it as hit.
			activeFullRoomsList[roomIndex].boardGrid[cellHit-1] = (activeFullRoomsList[roomIndex].startingPlayerCID == socket.cid ? 1 : -1); //starting player marked with 1, other -1 to keep them separate
			
			if(activeFullRoomsList[roomIndex].startingPlayerCID == socket.cid)
			{
				io.in(socket.room).emit('boardPieces update', 1); //if startingPlayerCID matches the sockets Client ID -- that means the one that made the move was starting player
			}else
			{
				io.in(socket.room).emit('boardPieces update', -1); //else if starting player client ID does not match sockets client id -- means move was NOT made by starting player
			}
			
			
			//check win here
			var winstats = funcs.checkWin(activeFullRoomsList[roomIndex].boardGrid);
			
			//loop it through and manually count every 0 there is in it (used to check later if a draw or not)
			var zeroCounter = 0;
			for(var i = 0; i < activeFullRoomsList[roomIndex].boardGrid.length; i++)
			{
				if(activeFullRoomsList[roomIndex].boardGrid[i] == 0)
				{
					zeroCounter += 1;
				}
			}
			
			if(winstats[0].player != 0) //if a winner actually exists
			{
				//calculate all winpieces cellnmbrs - ONLY if more than 1 win
				
				var uniqueWinCells = null; //store the unique ones that will need repainting (if 2 rows complete at win = 1 common cell)
				if(winstats.length > 1) //if more than 1 completed row at win
				{
					var winCellNmbrs = [];
					for(var i = 0; i < winstats.length; i++) //for every winrow
					{
						winCellNmbrs[i] = winCombos[winstats[i].wincombo]; //fetch wincells per row
					}
					
					//once we got all the cellNmbrs in 2 arrays within winCellNmbrs, merge and delete duplicates
					//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
					var winCellNmbrsConcat =  null;
					
					if(winstats.length == 2) //if two-row-win
					{
						winCellNmbrsConcat = winCellNmbrs[0].concat(winCellNmbrs[1]); //merge these two win rows
					}else if(winstats.length == 3) //if three-row-win
					{
						winCellNmbrsConcat = winCellNmbrs[0].concat(winCellNmbrs[1], winCellNmbrs[2]); //merge these two win rows
					}
					
					uniqueWinCells = funcs.removeDuplicatesFromArray(winCellNmbrsConcat); //remove duplicate (common) cells from win rows
					
				}else { //if one-row-win
					uniqueWinCells = winCombos[winstats[0].wincombo]; //fetch wincells per row
				}
				
				//communicate the win to the clientside properly so losing client can have its clientside paint a loss and winning client paint a win on canvas
				socket.emit('draw win', {winCells: uniqueWinCells, boardGrid: activeFullRoomsList[roomIndex].boardGrid}); //on a won game, increment wingame counter, and total game counter
				socket.to(socket.room).emit('draw lose', {winCells: uniqueWinCells, boardGrid: activeFullRoomsList[roomIndex].boardGrid}); //on a lost game, increment total game counter
				
				gameOver = true;
				
				//what to do once a win registered serverside:
				//add player winstats here to other connected client and update both total games
				socket.emit('update wins'); //for the winner
				io.in(socket.room).emit('update total games'); //for both clients
				
				//for the Avg time I need a Date object to compare it to
				var winTimestamp = Date.now();
				var gameTime = winTimestamp - activeFullRoomsList[roomIndex].createdTime; //NOTE: in retrospect I realize that this is not entirely accruate since it gives time since room was created, and not since game was initiated (aka after readycheck) to make it proper - I would need to store timestamp from after readycheck completion - something to fix for the future, 
				
				io.in(socket.room).emit('update avg game time', gameTime); //add all times to clientList.games.time array and divide by the length
				
				//after drawn the win stuff, fixed the logics, we wanna return player to main screen
				//win basically means destroy the room and go back to main page, now we would love to have timer show up for 10 seconds, with realtime countdown and everything, letting them know they will be returned to main screen within that time - reason for this feature is because the purpose of the app is NOT to have people enter game rooms to chat with one another, the chat is simply there as a nifty feature to communicate with whomever you're playing with during the game time, so people who want to stay to chat after game is done, I'm sorry, this app is not for that.
				
				//our ending game procedure will trigger 10s countdown to leave game room and be returned to "main screen", it will also inform user of this interface-wise and trigger "now we leave game" event to serverside
				io.in(socket.room).emit('ending game procedure');
				
				//we deactivate button by adding disabled attribute to it, tried adding jQuery .off('click') but was kind of hard to turn it back on after, so disable attribute will have to do - I am however aware that there is a risk of user js manipulation to make this button clickable despite my efforts.. I'll simply have to deal with it serverside when time comes for that.
				io.in(socket.room).emit('deactivate leave room btn');
				
				//the only thing that separates draw win and draw lose really is the plack text... other than that, same logics should occur
			}else if(winstats[0].player == 0 && zeroCounter == 0) { //else if no boardPieces left and no winner, paint a draw FOR BOTH
				io.in(socket.room).emit('draw draw', activeFullRoomsList[roomIndex].boardGrid); //paint as always but change placktext again..
				
				gameOver = true;
				
				io.in(socket.room).emit('update total games');
				
				var gameTimestamp = Date.now();
				var gameTime = gameTimestamp - activeFullRoomsList[roomIndex].createdTime; //- again - not as accurate as it could be with some modifications
				
				io.in(socket.room).emit('update avg game time', gameTime);
				
				io.in(socket.room).emit('ending game procedure');
				io.in(socket.room).emit('deactivate leave room btn');
				
				//if draw total games should still increment for both clients
				
			} else {
				//if no win, no lose, no draw:
				io.in(socket.room).emit('paint moves', activeFullRoomsList[roomIndex].boardGrid);
			}
			
		}else {
			//if it was -1 -- aka forfeit of turn -- decrement this sockets moves, while incrementing opponents
			var clientIndex = getClientIndex(socket.cid);
			socket.emit('clear game timers');
			
			socket.emit('decrement boardPieces');
			
			socket.to(socket.room).emit('increment boardPieces');
			
			io.in(socket.room).emit('boardPieces update', 0); //0 symbolizes forfeit to "catch" that clientside to know what to do interface-wise
		}
		
		if(gameOver == false) //when game is running
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
	
	socket.on('updating wins', function() {
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].gameStats.wonGames += 1;
	});
	
	socket.on('updating total games', function() {
		var clientIndex = getClientIndex(socket.cid);
		
		clientList[clientIndex].gameStats.totalGames += 1;
	});
	
	socket.on('updating avg game time', function(gameTime) {
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
		//after drawn the win/draw/lose stuff, fixed the logics, we wanna return player to main screen
		//win/draw/lose basically means destroy the room and go back to main page for both clients
		
		//every socket will reach this point
		
		leavingGameProcedure = true; //will be useful to determine serverside if the countdown for ending game procedure is active and running (when it is - leave room button should not work despite clientside js manipulation -- should be set to false again once players have been kicked from room)
		
		io.in(socket.room).emit('clear game timers'); //stop game turn timers for both users in room
		
		var clientIndex = getClientIndex(socket.cid);
		
		//get activeFullRoomsList specific roomIndex
		var roomIndex = getRoomIndex(socket.room, activeFullRoomsList);
		
		//if creator of the room, clear created room data activeFullRoomsList[roomIndex]
		if(clientList[clientIndex].createdRoom.name == activeFullRoomsList[roomIndex].name)
		{
			clientList[clientIndex].createdRoom.name = "";
			clientList[clientIndex].createdRoom.pw = "";
			clientList[clientIndex].createdRoom.createdTime = 0;
			clientList[clientIndex].createdRoom.roomActive = false;
		}
		
		socket.emit('kick client from a room', roomList);
		
		if(roomList.length == 0) //again - if no rooms created, no use in having roomlist update interval running - also reset firstRoomCreated
		{
			io.in(socket.room).emit('clear intervals');
			firstRoomCreated = false;
		}
		
		//logically leave the room
		socket.emit('roomleaving data scrubbing');
		
		//clear the leave room 10s countdown timer on room leave
		socket.emit('clear leave room timers');
		
	});
	
	/*
	=================================================================
			Leave room emit events below
	=================================================================
	*/
	
	//event when leave room button is clicked clientside
	socket.on('leave room', function(roomindex) {
		
		var clientIndex = getClientIndex(socket.cid);
		
		roomindex = sanitizeData(roomindex);
		
		//to leave a room the user must be registered first of all, AND in a room
		if(clientIndex != -1)
		{
			if(socket.userReg == true && clientList[clientIndex].roomActive == true && leavingGameProcedure == false) //and leavingGameProcedure must be false aka no leave room button action whilst leave game room countdown timer is running
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
				
				if(roomindex1 == -1) //means room does not lie within roomList but in activeFullRoomsList, aka 2 people in room, ergo below assumptions safe to make..
				{
					//if creator:
					if(clientList[clientIndex].createdRoom.name == activeFullRoomsList[roomIndex].name)
					{
						//interface-wise kick everyone from the game room if leave room button pressed by creator when 2 people in room
						io.in(activeFullRoomsList[roomIndex].name).emit('kick client from a room', roomList);
						
						//after clients kicked from room, make sure not to update roomlist if no rooms created and exist
						if(roomList.length == 0)
						{
							io.in(activeFullRoomsList[roomIndex].name).emit('clear intervals');
							firstRoomCreated = false;
						}
						
						clientList[clientIndex].createdRoom.name = "";
						clientList[clientIndex].createdRoom.pw = "";
						clientList[clientIndex].createdRoom.createdTime = 0;
						
						//logically and virtually leave game room for everyone in the room
						io.in(activeFullRoomsList[roomIndex].name).emit('roomleaving data scrubbing');
						
						//delete the room and all of its related room data
						activeFullRoomsList.splice(roomIndex, 1);
						
					}else {
						//client leaving room ..
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
						activeFullRoomsList[roomIndex].readycheck.splice(0, 2);
						
						//if a client answers No --- activeFullRoomsList index should be copied back over to roomList
						roomList.push(activeFullRoomsList[roomIndex]);
						activeFullRoomsList.splice(roomIndex, 1);
						socket.emit('kick client from a room', roomList);
						
						//reset the creator in the room to "simply be waiting"
						//commit creator "reset room" -- aka if they were playing, all game vars should be reset, default room mode should be shown, 
						clientList[clientIndex].lastMessageSent = 0;
						clientList[clientIndex].lastMessage = "";
						
						io.in(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
						
					}
				}else if(roomindex2 == -1)
				{
					//if creator wants to leave room before a client joined - do that here..
					socket.emit('kick client from a room', roomList);
					
					if(roomList.length == 0)
					{
						socket.emit('clear intervals');
						firstRoomCreated = false;
					}
					
					clientList[clientIndex].createdRoom.name = "";
					clientList[clientIndex].createdRoom.pw = "";
					clientList[clientIndex].createdRoom.createdTime = 0;
					
					socket.emit('roomleaving data scrubbing');
					
					roomList.splice(roomIndex, 1);
					
					io.in(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
					
					//send immediate update of roomlist for the people in "connected" so they dont have any risk of joining a room that doesnt exist..
					io.in(DEFAULT_ROOM).emit('load roomlist', roomList);
					
				}
			}else { //if user is not properly registered, not in a room, or inside of ending game procedure - big nono - not allowed.
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
		
		clientList[clientIndex].lastMessageSent = 0;
		clientList[clientIndex].lastMessage = "";
	});
	
	/*
	=================================================================
			Chat received emit events below
	=================================================================
	*/
	
	//if a command was typed in game room chat clientside, handle it here serverside
	socket.on('command', function(command) {
		
		var clientIndex = getClientIndex(socket.cid);
		
		command = sanitizeData(command);
		
		if(clientIndex != -1) //check that socket is actually registered
		{
			if(socket.userReg == true && clientList[clientIndex].roomActive == true) //double check user registration and that active in a room
			{
				if(command.length > 14) // /changenick + 1 whitespace == 12 characters, minimum chars for nick is 2 => 14
				{
					//store command as last message here
					clientList[clientIndex].lastMessage = command;
					
					var theCommand = command.substr(1,10);
					
					if(theCommand == "changenick") //make sure its the right command
					{
						var newnick = command.substr(12); //extract the new nick to change nickname to
						
						if(newnick.length > 1 && newnick.length <= 25) //make sure its more than 1 char and less than or equal to 25 chars length
						{
							if(/^[a-zA-Z0-9\u00C4\u00C5\u00D6\u00E4\u00E5\u00F6]+$/.test(newnick)) //regex test it to match a-zA-Z0-9+swe chars (no whitespace allowed)
							{
								var clientNameExist = false;
															
								for(var i = 0; i < clientList.length; i++)
								{
									if(newnick == clientList[i].username)
									{
										clientNameExist = true;
									}
								}
								
								var oldNick = socket.username; //store old nick to inform the other client in the room about the nickname change of this client
								
								if(clientID === 0 || !clientNameExist)
								{
									socket.username = newnick;
									clientList[clientIndex].username = newnick;
									
								}else {
									//if new username does already exist: add clientID to make it unique as always done in this app
									socket.username = newnick + clientList[clientIndex].clientID;
									
									clientList[clientIndex].username = newnick + socket.cid;
								}
								socket.emit('username successfully changed', socket.username);
								
								socket.to(socket.room).emit('username change', {oldNick: oldNick, newNick: socket.username}); //inform other socket in the room
								
							}else {
								socket.emit('unacceptable characters');
							}
						}
					}
				}else {
					//if it was a command, but not with sufficient data send back and inform user
						socket.emit('not enough data');
				}
			}else { //if user not registered or not in room
				socket.emit('ajabaja', 'typing');
			}
		}
	});
	
	//serverside handle if users are typing chat messages in game room
	socket.on('chat message', function(data) {
		
		data.msg = sanitizeData(data.msg);
		
		data.timestamp = sanitizeData(data.timestamp);
		
		var clientIndex = getClientIndex(socket.cid);
		
		if(clientIndex != -1)
		{
			//to type successfully user must be part of a room
			if(socket.userReg == true && clientList[clientIndex].roomActive == true)
			{
				clientList[clientIndex].lastMessage = data.msg;
				
				var textColor = clientList[clientIndex].userColor;
				var timeDiff = Date.now() - clientList[clientIndex].lastMessageSent;
				if(timeDiff >= 500) //500ms minimum time inbetween messages, faster than that not allowed
				{
					clientList[clientIndex].lastMessageSent = data.timestamp;
					
					socket.emit('new message', {
						username: socket.username,
						textColor: "#000000",
						message: data.msg
					});
					
					socket.to(socket.room).emit('new message', {
						username: socket.username, 
						textColor: "#5BAEC9", //bluish color
						message: data.msg
					});
				}else
				{
					//if messages was sent too close onto each other --- inform the user
					socket.emit('too fast typing');
				}
			}else { //if not registered or not part of a room
				socket.emit('ajabaja', "typing");
			}
		}
	});
	
	//when the client emits 'isTyping', we broadcast that to other clients
	socket.on('isTyping', function() {
		socket.to(socket.room).emit('isTyping', {
			username: socket.username
		});
	});
	
	//when client emits stopTyping, we broadcast that to other clients as well
	socket.on('stopTyping', function() {
		socket.to(socket.room).emit('stopTyping');
	});
	
	//Hitting enter should also inform other user that this client stopped typing
	socket.on('stopTypingEnter', function() {
		socket.to(socket.room).emit('stopTypingEnter');
	});
	
	//serverside handle for recreating last typed message via ARROW_UP command
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
	
	//serverside handler for when a client disconnects
	socket.on('disconnect', function() {
		
		var clientToRemoveFromClientList = getClientIndex(socket.cid);
		
		socket.emit('clear intervals'); //first of all we do not wish to have ANY intervals running when a client disconnects
		
		if(clientToRemoveFromClientList > -1) //disconnecting client should be registered for the actions about to be taken below
		{
			//here we know we got an actual user to disconnect
			//lets start with checking if our client to remove have created a room or not (if client have - check if more than just creator in it , if so - kick them)
			if(socket.roomActive)
			{
				//check socket.room 
				var roomIndexRoomList = getRoomIndex(socket.room, roomList);
					
				var roomIndexActiveFullRoomsList = getRoomIndex(socket.room, activeFullRoomsList);
				
				var roomArray = (roomIndexActiveFullRoomsList != -1 ? activeFullRoomsList : roomList);
				
				//as far as I can tell - there will be 2 creator scenarios, and only 1 client scenario -- creator scenarios: creator + 1, creator alone
				
				//in case creator of room, and alone in the room (no client)
				if(clientList[clientToRemoveFromClientList].createdRoom.name != "" && roomIndexRoomList != -1)
				{
					//if a room has been created by our client, and only creator in the room
					
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
					//if its the creator, and 2 ppl in room
					
					io.in(socket.room).emit('disable readycheck'); //if there is a readycheck running while disconnecting, disable the readycheck
					
					io.in(socket.room).emit('clear game timers'); //clear any and all game timers for clients in the room if one disconnects
					
					io.in(socket.room).emit('kick client from a room', roomList); //if full room and this is creator, kick all interface-wise from room
					
					//reset game room creator related vars and data
					clientList[clientToRemoveFromClientList].createdRoom.name = "";
					clientList[clientToRemoveFromClientList].createdRoom.pw = "";
					clientList[clientToRemoveFromClientList].createdRoom.createdTime = 0;
					
					io.in(socket.room).emit('roomleaving data scrubbing');
					
					activeFullRoomsList.splice(roomIndexActiveFullRoomsList, 1);
					
					//right after this has been removed, load roomList for all clients CONNECTED so that they immediately get updated roomList
					
					if(roomList.length == 0)
					{
						io.in(DEFAULT_ROOM).emit('clear intervals');
						firstRoomCreated = false;
					}
					
				}else if(clientList[clientToRemoveFromClientList].createdRoom.name == "" && roomIndexActiveFullRoomsList != -1) 
				{
					//its the client and 2 people in room
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
					activeFullRoomsList[roomIndexActiveFullRoomsList].readycheck.splice(0, 2);
					
					//if a client answers No --- activeFullRoomsList index should be copied back over to roomList
					roomList.push(activeFullRoomsList[roomIndexActiveFullRoomsList]);
					activeFullRoomsList.splice(roomIndexActiveFullRoomsList, 1);
					
					socket.emit('kick client from a room', roomList); //not sure if this really is necessary?
					
					//reset the creator in the room to "simply be waiting"
					//commit creator "reset room" -- aka if they were playing, all game vars should be reset, default room mode should be shown, 
					clientList[clientToRemoveFromClientList].lastMessageSent = 0;
					clientList[clientToRemoveFromClientList].lastMessage = "";
				}
			//or if playing a game and need to reset the other one -- like I did once before
			}
			
			//remove the client from the clientList
			clientList.splice(clientToRemoveFromClientList, 1);
			
			//last thing to do, announce to all connected clients that someone DCed to update site stats
			socket.to(DEFAULT_ROOM).emit('update siteStatsArea', clientList);
			
			if(clientList.length == 0)
			{
				firstRoomCreated = false;
				clientID = 0; //if no connected clients, server can reset clientID as well
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
		toSanitize = sanitizeHtml(toSanitize, {
		  allowedTags: [],
		  allowedAttributes: []
		});
	return toSanitize;
}