//$(function() { //short-hand alternative for $('document').ready etc.etc.
$(document).ready(function(){
	//my code goes here to be executed once ready has been confirmed
	"use strict";
	var socket = io();
	
	/*
	=================================================================
			Global var declaration below
	=================================================================
	*/
	
	//global const var declaration
	const LONG_FADE_TIME = 2000; //ms = 2s
	const SHORT_FADE_TIME = 500; //ms
	const TYPING_TIMER_LENGTH = 400; //ms
	const TIMER_TRIGGER_TIME = 15000; //ms = 15s
	const MIN_USERNAME_CHARS = 2;
	const MAX_USERNAME_CHARS = 25;
	const MIN_LOBBYNAME_CHARS = 2;
	const MAX_LOBBYNAME_CHARS = 20;
	
	//global RegEx patterns used throughout client.js
	const azAZ09regex = /^[a-zA-Z0-9]+$/;
	const azAZ09inclWS = /^([a-zA-Z0-9\s]+)$/; //check so this one works.
	
	//global client var declaration
	var roomToLoginTo = -1; //used to keep track of what room client is currently in
	//var reg = false; //keeps track of whether user registered username or not
	var typing = false; //keeping track of whether user is typing or not
	
	//front-end DOM elements used throughout client.js
	var usernameRegSection = $('#usernameRegSection');
	var usernameField = $('#username');
	var createRoomForm = $('#createRoomForm');
	var lobbyNameField = $('#lobbyName');
	var pwField = $('#pw');
	var joinRoomForm = $('#joinRoomForm');
	var loginPWField = $('#loginPW');
	var loginStatus = $('#loginStatus');
	var joinRoomBtn = $('#joinRoomBtn');
	var roomLogin = $('#roomLogin');
	var roomlist = $('#roomlist');
	var chat = $('#chat');
	var statusMsgContainer = $('#statusMsg');
	var canvas = $('#canvas');
	var canvasElement = document.getElementById("canvas"); //differs from the jQuery selector in what is returned when fetched and what can be done with the returned element - non-jquery returned object can give getContext("2d") e.g.
	var ctx = canvasElement.getContext("2d");
	var canvasWidth = canvasElement.getAttribute("width");
	var canvasHeight = canvasElement.getAttribute("height");
	var messages = $('#messages');
	var m = $('#m');
	
	//global game vars
	const gameColors = {	bgColor: "#1f781f",
							boardColor: "#b05e23",
							textAndBorderColor: "#000000",
							plackColor: "#e3e3e3",
							markedCellColor: "#ffffff"};

	const boardSide = 300;
	const cellSide = boardSide/3;

	const plackInfo = {	fontSize: 35,
						fontFamily: "sans-serif",
						width: 500,
						height: 50,
						marginTop: 24};
	
						
	const plackMarginLeft = canvasWidth/2 - plackInfo.width/2; //to center it
	
	const plackToTTTSpace = 45; //TTT = TicTacToe
	
	const tttBoardMarginTop = plackInfo.marginTop + plackInfo.height + plackToTTTSpace, //45 between plack and TTT board - 114 margin-top total
		tttBoardMarginLeft = canvasWidth/2 - boardSide/2;
			
	const cellPos = {	1: {x: tttBoardMarginLeft, y: tttBoardMarginTop},
					2: {x: tttBoardMarginLeft + cellSide, 	y: tttBoardMarginTop},
					3: {x: tttBoardMarginLeft + 2*cellSide, y: tttBoardMarginTop},
					4: {x: tttBoardMarginLeft, 				y: tttBoardMarginTop + cellSide},
					5: {x: tttBoardMarginLeft + cellSide, 	y: tttBoardMarginTop + cellSide},
					6: {x: tttBoardMarginLeft + 2*cellSide, y: tttBoardMarginTop + cellSide},
					7: {x: tttBoardMarginLeft, 				y: tttBoardMarginTop + 2*cellSide},
					8: {x: tttBoardMarginLeft + cellSide, 	y: tttBoardMarginTop + 2*cellSide},
					9: {x: tttBoardMarginLeft + 2*cellSide, y: tttBoardMarginTop + 2*cellSide}};
					
	var boardGrid = [0,0,0,0,0,0,0,0,0]; //1 for one player, -1 for another player, 0 if empty
	
	const winComboAmount = 8; //3 horizontal, 3 vertical, 2 diagonal = 8
	const winCombos = {	1: [1,2,3],
						2: [4,5,6],
						3: [7,8,9],
						4: [1,4,7],
						5: [2,5,8],
						6: [3,6,9],
						7: [1,5,9],
						8: [3,5,7]};
					
	//console.log("cellPos 5 = x: " + cellPos[5].x + ", y: " + cellPos[5].y);
						
	const textStrings = {	wfo: "Waiting for opponent...",
							rurdy: "Room full, are you ready?",
							ulose: "You lose.",
							uwin: "CONGRATULATIONS, YOU WON!",
							othersmove: "Opponents is making his/hers move..",
							mymove: "It's your move!",
							outoftime: "You forfeit your turn to the opponent (too slow)..",
							seemDC: "Seems your opponent disconnected, room disappears in 2 minutes."};
	

	const XOLineThickness = 3;
	
	//console.log("all vars decl");
	
	var canvasPosition = {
		x: canvas.offset().left,
		y: canvas.offset().top
	};
	
	
	/*
	=================================================================
			Client connect interface setup
	=================================================================
	*/
	
	//hide the parts of the interface not to be shown at client connect
	createRoomForm.hide();
	joinRoomForm.hide();
	roomLogin.hide();
	chat.hide();
	canvas.hide();
	
	//its a nice user friendly feature not having to manually click the field to write input into
	usernameField.focus();
	
	/*
	=================================================================
			Client triggered Events below
	=================================================================
	*/
	
	$('#usernameRegForm').submit(function() {
		console.log("inside of #usernameRegForm.submit");
		//filter the input before sending it along
		
		//it can't be empty, AND it must be more than 2 characters or less than 25
		if(usernameField.val().length >= MIN_USERNAME_CHARS && usernameField.val().length <= MAX_USERNAME_CHARS)
		{
			//secondary check - indirectly check to see if it contains spaces with regex by checking that it contains only a-z, A-Z and 0-9 - if it does also contain whitespace: inform user and have them change it to without whitespaces (personal preference)
			//if(/^[a-zA-Z0-9]+$/.test($('#username').val()))
			if(azAZ09regex.test(usernameField.val()))
			{
				socket.emit('user registration', usernameField.val()); 
				
				//.val() escapes HTML avoiding vulnerabilities according to some sources so no need for additional input sanitization?
				
				usernameField.val(''); //just in case
				
			}else {
				statusMsgContainer.text("Your nickname contained whitespaces or foreign characters. Please change it to not have whitespaces (or anything except a-z, A-Z and 0-9).").fadeIn(100).fadeOut(LONG_FADE_TIME);
			}
		}else {
			//if less than 1 character, or more than 25
			statusMsgContainer.text("Username must be > 1 character long, and less than 25 characters.").fadeOut(LONG_FADE_TIME);
		}
		
		return false; //return false stops default execution, and for .submit this means page update is stopped (which we want)
	});
	
	
	$('#createRoomForm').submit(function() {
		console.log("inside of submit func for createRoomBtn");
		//handle all the user input filtration on the server side and then also emit events from serverside based on what input was given - if sufficient or not.
		//check clientside so input is neither empty nor faulty before sending it along
		var lobbyName = lobbyNameField.val().trim();
		
		if(lobbyName.length >= MIN_LOBBYNAME_CHARS && lobbyName.length <= MAX_LOBBYNAME_CHARS)
		{
			//true if .val() holds value?
			//if(/^([a-zA-Z0-9\s]+)$/.test(lobbyName)) //regex pattern to allow for whitespaces
			if(azAZ09inclWS.test(lobbyName)) //regex pattern to allow for whitespaces
			{
				//only allow input to be a-z A-Z and 0-9 characters between length 2 and 20
				socket.emit('create room', {name: lobbyName, pw: pwField.val()});
			}else {
				statusMsgContainer.text("Your Lobbyname contained characters other than a-z, A-Z and 0-9 - try sticking with the allowed ones.").show().fadeOut(4000);
			}
			
		}else {
			statusMsgContainer.text("Your Lobbyname need to be between 2 and 20 characters long.").show().fadeOut(4000);
		}
		lobbyNameField.val('');
		
		
		return false;
	});
	
	
	$('#joinRoomForm').submit(function() {
		//socket.emit('join room', roomname); //get data from selected option in list to send to server to know what room to join for specific socket
		
		//when a socket / client / user selects room and presses "join room", they should by all accounts join the perverbial room by hiding create room, and join room sections, and show chat room - and also connecet to the specific room they selected. should be easy enough I figure :)
		
		//fade in the login section if there is a pw for the room in question attempting to be joined
		
		//send join request to server, server checks if the room has a password set, if thats the case - send back show login form event, if not - proceed with allowing the user to pass the steps required to "join" the logical room.
		console.log("inside of joinRoomForm submit");
		console.log("selected room attempting to join: ", roomlist.val());
		socket.emit('join room', roomlist.val());
		
		return false;
	});
	
	
	$('#roomLoginForm').submit(function() {
		//what should happen when PW-form is submitted...
		socket.emit('room login attempt', {roomindex: roomToLoginTo, pw: loginPWField.val()});
		//on successful login - reset roomToLoginTo?
		console.log("$('loginPW').val() = ", loginPWField.val());
		
		console.log("inside roomLoginForm.submit");
		loginPWField.val('');
		
		return false;
	});
	
	
	$('#back2mainScreen').on('click', function() {
		roomLogin.fadeOut(500);
		
		console.log("inside of back2mainScreen onclick");
		
		return false;
	});
	
	
	$('#roomlist').on('change', function() {
		$('option[value="' + this.value + '"]').attr('selected', 'selected');
		console.log("checking .val() if shows selected: " + roomlist.val());
		
		joinRoomBtn.prop('disabled', false);
	});
	
	
	//do nothing in event handler except cancel the event (drag and select)
	canvasElement.ondragstart = function(e) {
		if(e && e.preventDefault) { e.preventDefault(); }
		if(e && e.stopPropagation) { e.stopPropagation(); }
		return false;
	}
	
	canvasElement.onselectstart = function(e) {
		if(e && e.preventDefault) { e.preventDefault(); }
		if(e && e.stopPropagation) { e.stopPropagation(); }
		return false;
	}
	
	//cancelling mobile window movement
	document.body.ontouchstart = function(e) {
		if(e && e.preventDefault) { e.preventDefault(); }
		if(e && e.stopPropagation) { e.stopPropagation(); }
		return false;
	}
	
	document.body.ontouchmove = function(e) {
		if(e && e.preventDefault) { e.preventDefault(); }
		if(e && e.stopPropagation) { e.stopPropagation(); }
		return false;
	}
	
	
	$('#chatForm').submit(function() {
		console.log("inside chatForm submit");
		
		//check if first letter is a '/' <- then assume command, if not, assume chat msg
		if(m.val().substr(0,1) === "/")
		{
			socket.emit('command', m.val());
			m.val('');
			
		}else //if no command, but chat msg
		{
			socket.emit('chat message', {msg: m.val(), timestamp: (Date.now())});
		}
		
		return false; // breaks function execution
	});
	
	
	$('#m').keydown(function(e) {
		if (e.which === 13) //if ENTER
		{
			socket.emit('stopTypingEnter');
			typing = false;
			console.log("stopped typing by enter");
		}else if(e.which === 38) //arrow up
		{
			socket.emit("recreate last message");
			console.log("detected arrow up keydown");
		}
	});
	
	
	$('#m').on('input', function() {
		console.log("someone is typing now");
		if(typing === false)
		{
			//on textfield input - type out whos/that someone is typing
			socket.emit('isTyping'); //sending typing from client to server
			console.log("typing");
			typing = true;
		}
		var lastTypingTime = (new Date()).getTime();
		
		setTimeout(function() {
			var typingTimer = (new Date()).getTime();
			
			var timeDiff = typingTimer - lastTypingTime;
			console.log("setTimeout timeDiff: ", timeDiff);
			
			if(timeDiff >= TYPING_TIMER_LENGTH && typing === true)
			{
				socket.emit('stopTyping');
				typing = false;
				console.log("stopped typing by timeout");
			}
		}, TYPING_TIMER_LENGTH);
			
	});
	
	
	$('#leaveRoom').on('click', function() {
		socket.emit('leave room', roomToLoginTo);
		console.log("roomToLoginTo is of value: ", roomToLoginTo);
		//roomToLoginTo = -1;
		//when leaving room, chat will be hidden again, user shall leave the room serverside, and rejoin connected room, 
		return false;
	});
	
	
	
	/*
	=================================================================
			Dealing with server-responses below
	=================================================================
	*/
	
	
	//adjust this response handle to be more "endproduct" suited (infinite clients should be able to connect - however joining a room is a different story - only allow for 2 clients in there...
	socket.on('user registered', function(data) {
		console.log("inside of user registered.");
		
		//what should happen on the clientside if user is registered for the endproduct of the project?: Well, that a user is successfully registered needs to be kept track of... maybe?, usernameRegForm need to be hidden, createdRoomForm and joinRoomForm need to be shown, somehow user should get a interface message that registration was successful
		
		//reg = true;
		
		//hide username reg interface section
		usernameRegSection.hide();
		createRoomForm.show();
		joinRoomForm.show();
		
		
		
		
		
		
		//below parts of this code is within user registered event is more appropriate for when joining the actual individual rooms:
		/*console.log("registered clients: ", data.reggedClients);
		
		if(reg && data.reggedClients <= 2) //a room should not be allowed to have more than 2 people and user must be registered
		{	
			//lets go with it and see if I actually need to store username both here.. and serverside, I think serverside might be enough.
			socket.username = data.username;
			
			$('#usernameRegSection').hide();
			
			$('#messages').empty(); //had to clear chat history in the odd event that other chat user joined same time as first one... 
			//after user registration done, show chat controls hm..
			$('#chat').show();
			$('#m').focus(); //move focus onto chat input field automatically
			
			//
			appendDatedMsg($('#messages'), "<i>Welcome <b>" + socket.username + "</b> to socket.io chat!</i>");
			
		}else {
			$('#statusMsg').text("The chat room you tried to join, is currently full.").fadeIn().fadeOut(3000);
		}*/
		
	});
	
	/*
	=================================================================
			Create/Join room Socket.io event emit handlers
	=================================================================
	*/
	
	socket.on('show login form', function(roomIndex) {
		//show login section + form - style in css
		
		console.log("inside of show login form event clientside");
		roomLogin.fadeIn(500);
		
		roomToLoginTo = roomIndex;
		console.log("roomIndex that is attempting to be logged into: ", roomToLoginTo);
	});
	
	socket.on('created and joined room', function(roomindex) {
		roomToLoginTo = roomindex;
	});
	
	socket.on('add to roomlist', function(data) {
		console.log("inside add to roomlist");
		
		//remember to get Date.now() and compare it to room created data to list how long ago it was created - although this data should be regularily updated - say setInterval every second ? Will that get in the way of anything?
		
		var createdStr = getTimeDiffString(data.createdTime);
		
		//Unicode lock icon: &#xe033; - put in front of lobby if PW protected
		
		
		//append option to our select list with proper room info
		roomlist.append($('<option>').attr('value', data.roomname).append((data.pwSet ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + data.roomname + "</b> <i>(created " + createdStr + " ago)</i>"));
		
		//after having added game room to all other sockets (not connected to the room) I could socket.emit right here to catch on serverside to send back with socket.emit from server back to each and every non-connected socket ?
		
	});
	
	//have a every second timer - if select-option list have alternatives - trigger every second a list update --- turn into web worker in future to get this "updating sequence" out of the day of the actual application + learning web workers? trigger event "update roomList" to update every clients roomList (that is not yet connected to rooms)
	socket.on('initiate first roomlist update', function() {
		console.log("inside of initiate first roomlist update");
		
		//check if any of the alternatives are selected, if so, get its value
		var intervalID = setInterval(function() {
			var selectedValue = "";
			if(roomlist.val())
			{
				selectedValue = roomlist.val();
				console.log("select value: ", selectedValue);
			}
			console.log("selected value AFTER IF: ", selectedValue);
			console.log("inside of timeout function should be called every 15s");
			socket.emit('first update roomList', {intervalID: intervalID, selectedValue: selectedValue});
			
		}, TIMER_TRIGGER_TIME); //every 15 or so secs
		
	});
	
	
	socket.on('initiate individual roomlist update', function() {
		console.log("inside of individual roomlist update");
		
		//check if any of the alternatives are selected, if so, get its value
		var intervalID = setInterval(function() {
			var selectedValue = "";
			if($('#roomlist').val())
			{
				selectedValue = $('#roomlist').val();
				console.log("select value: ", selectedValue);
			}
			console.log("selected value AFTER IF: ", selectedValue);
			console.log("inside of timeout function should be called every 15s");
			socket.emit('individual update roomList', {intervalID: intervalID, selectedValue: selectedValue});
			
		}, TIMER_TRIGGER_TIME); //every 15 or so secs
		
	});
	
	socket.on('update selected option', function(selectedValue) {
		console.log("inside of update selected option clientside.");
		$('option[value="' + selectedValue + '"]').attr('selected', 'selected');
	});
	
	
	socket.on('room login failed', function() {
		loginStatus.text('Wrong password, try again - or return to lobbylist.').fadeIn(1000).fadeOut(2000);
		
		console.log("inside of room login failed");
	});
	
	socket.on('update roomList for all', function(rooms) { //called every minute
		//clear select-option list to repaint it with ALL rooms and their respective data from scratch to be easier?
		//loop through the roomList to recreate every single room in the list
		console.log("inside update roomlist clientside");
		
		console.log("rooms contains: ", rooms);
		
		//console.log("selectedValue in update roomlist for all: " + data.selectedValue);
		
		roomlist.empty();
		console.log("amount of rooms: ", rooms.length);
		
		var createdStr = "";
		for(var i = 0; i < rooms.length; i++)
		{
			//for every room:
			createdStr = getTimeDiffString(rooms[i].createdTime);
			
			//&#xe033 <- this lock icon unicode didnt quite work
			roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>"));
		}
		
	});
	
	socket.on('individual roomlist update', function(rooms) { //called every minute
		//clear select-option list to repaint it with ALL rooms and their respective data from scratch to be easier?
		//loop through the roomList to recreate every single room in the list
		console.log("inside individual roomlist update clientside");
		
		console.log("rooms contains: ", rooms);
		
		//console.log("selectedValue in update roomlist for all: " + data.selectedValue);
		
		roomlist.empty();
		console.log("amount of rooms: ", rooms.length);
		
		var createdStr = "";
		for(var i = 0; i < rooms.length; i++)
		{
			//for every room:
			createdStr = getTimeDiffString(rooms[i].createdTime);
			
			//&#xe033 <- this lock icon unicode didnt quite work
			roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>"));
		}
		
	});
	
	//could work for both creator AND client - does the same thing..?
	socket.on('creator joins room', function(data) {
		console.log("creator joins room");
		
		createRoomForm.hide();
		joinRoomForm.hide();
		canvas.show();
		chat.show();
		
		//append to the chat that username joined the room --- once canvas implemented etc. this is where we draw the text "awaiting opponent" I believe.
		appendDatedMsg(messages, "Welcome " + data.username + ", you have joined your created room: " + data.room);
		
	});
	
	socket.on('client joins room', function(data) {
		console.log("client joins room");
		
		roomLogin.hide();
		createRoomForm.hide();
		joinRoomForm.hide();
		chat.show();
		
		//append to the chat that username joined the room --- once canvas implemented etc. this is where we draw the text "awaiting opponent" I believe.
		appendDatedMsg(messages, "Welcome " + data.username + ", you have joined your created room: " + data.room);
	});
	
	socket.on('leaving room', function() {
		chat.fadeOut(500);
		createRoomForm.show();
		joinRoomForm.show();
		
	});
	
	socket.on('load existing rooms on connect', function(rooms) {
		console.log("inside of load existing rooms on connect and init update");
		
		//start by painting all the rooms and their timers, then initiate the update sequence.
		var createdStr = "";
		for(var i = 0; i < rooms.length; i++)
		{
			//for every room
			createdStr = getTimeDiffString(rooms[i].createdTime);
			
			//&#xe033 <- this lock icon unicode didnt quite work
			roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>"));
		}
		
	});
	
	socket.on('stop lobby update interval', function(intervalID) {
		clearInterval(intervalID);
		console.log("cleared interval of intervalID: ", intervalID);
	});
	
	
	
	/*
	=================================================================
			Game graphics with Canvas Socket.io event emit handlers
	=================================================================
	*/
	
	
	
	
	/*
	=================================================================
			Chat Socket.io event emit handlers
	=================================================================
	*/
	
	socket.on('new message', function(data) { //receives server response of that chat msg data sent out from the client so the client can do something with that
		m.val('');
		
		var date = new Date();
		
		messages.append($('<li>').text(date.toLocaleTimeString() + " | " + data.username + ": " + data.message));
		
		//have black text for the message sent by self always (will appear colored for other person in chatroom)
	});
		
	socket.on('user joined', function(data) {
		//what to happen on receiving broadcast that a user joined with the data username and clientCounter from server --- only username seem needed?
		
		appendDatedMsg(messages, "<b>" + data.username + " joined.</b>");
	});
		
	socket.on('isTyping', function(user) {
		//what to happen in the client when isTyping is triggered to server and sent back from server to all clients via broadcast
		statusMsgContainer.text(user.username + " is typing...").show();
	});
		
	socket.on('stopTyping', function(user) {
		//same here - what to happen on receiving broadcast that a user stopped typing
		console.log("clientside stopTyping");
		statusMsgContainer.fadeOut();
	});
	
	socket.on('stopTypingEnter', function() {
		statusMsgContainer.hide();
	});
	
	socket.on('userLeft', function(data) {
	
		appendDatedMsg(messages, "<b>" + data.username + " has left.</b>");
	});
	
	socket.on('not enough data', function() {
		statusMsgContainer.text("To change nickname you need to enter a nickname between 2 and 25 characters.").show().fadeOut(8000);
	});
	
	socket.on('username successfully changed', function(username) {
		m.val(''); //clear field -- doing it here because I want to keep the message in case user tried to type but did so too fast - so they dont have to rewrite entire message... (add arrow-up command to recreate last typed message for convenience? should be easy enough - if keydown arrow-up, socket.emit recreate last message, store last message on serverside for clientList data object, on serverside socket.on recreate message socket.emit recreate message clientside, on clientside catch that emit with socket.on recreate message clientside then re-populate the input field with previous message sent from the server.. should be simple enough)
		appendDatedMsg(messages, "<b>You changed your username to: " + username + ".</b>");
		
		socket.username = username;
	});
	
	socket.on('unacceptable characters', function() {
		m.val(''); //clear field
		
		appendDatedMsg(messages, "<b>The username you wanted to change to contained unacceptable characters - try using only a-z, A-Z and 0-9</b>");
	});
	
	socket.on('username change', function(data) {
	
		appendDatedMsg(messages, " <i>The user: " + data.oldNick + " changed username to: <b>" + data.newNick + "</b>.</i>");
	});
	
	socket.on('too fast typing', function() {
		//what should happen when user gets "too fast typing", well, we want user to be informed
		statusMsgContainer.text("You typed too fast, One message per 1/2 second is allowed. Try again in a little while.").show().fadeOut(4000);
		//set a timeout and then allow user to type again? show an active timer of how long they must wait? -- advanced (chose to skip this advanced additional feature and focus on whats important).
	});
	
	socket.on('recreate last message', function(lastMessage) {
		//set both the value and the actual text in the input field
		m.text(lastMessage);
		m.val(lastMessage);
	});
	
});