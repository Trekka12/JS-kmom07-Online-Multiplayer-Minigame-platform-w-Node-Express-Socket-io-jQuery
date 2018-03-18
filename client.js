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
	const GAME_TURN_TIME = 15000;
	const READYCHECK_TIME = 30000;
	const SECOND = 1000;
	
	
	const MIN_USERNAME_CHARS = 2;
	const MAX_USERNAME_CHARS = 25;
	const MIN_LOBBYNAME_CHARS = 2;
	const MAX_LOBBYNAME_CHARS = 20;
	
	//global RegEx patterns used throughout client.js
	//swedish unicode chars to use for regex to use swedish chars for roomname and username:
	//\u00C4\u00C5\u00D6\u00E4\u00E5\u00F6
	
	//const azAZ09regex = /^[a-zA-Z0-9]+$/;
	//const azAZ09inclWS = /^([a-zA-Z0-9\s]+)$/; //check so this one works.
	const azAZ09regex = /^[a-zA-Z0-9\u00C4\u00C5\u00D6\u00E4\u00E5\u00F6]+$/;
	const azAZ09inclWS = /^([a-zA-Z0-9\s\u00C4\u00C5\u00D6\u00E4\u00E5\u00F6]+)$/; //check so this one works.
	
	//global client var declaration
	var roomToLoginTo = -1; //used to keep track of what room client is currently in
	//var reg = false; //keeps track of whether user registered username or not
	var typing = false; //keeping track of whether user is typing or not
	
	//front-end DOM elements used throughout client.js
	var usernameRegSection = $('#usernameRegSection');
	var usernameField = $('#username');
	var nickRegStatusMsg = $('#nickRegStatusMsg');
	var titleText = $('#title');
	var createRoomForm = $('#createRoomForm');
	var lobbyNameField = $('#lobbyName');
	var pwField = $('#pw');
	var wonGames = $('#winGames');
	var avgGameTime = $('#avgGameTimeNmbr');
	var siteStatsArea = $('#siteStatsArea');
	var totalConnectedUsers = $('#totalConnected');
	var notYetInRoomUsers = $('#notYetInRoom');
	var joinRoomForm = $('#joinRoomForm');
	var loginPWField = $('#loginPW');
	var loginStatus = $('#loginStatus');
	var joinRoomBtn = $('#joinRoomBtn');
	var roomLogin = $('#roomLogin');
	var roomlist = $('#roomlist');
	var chat = $('#chat');
	var statusMsgContainer = $('#statusMsg');
	var readyCheck = $('#readycheck');
	var readyCheckForm = $('#readyCheckForm');
	var yesBtn = $('#yesBtn');
	var noBtn = $('#noBtn');
	var rCheckProgressBar = $('#rCheckProgressBar');
	var canvas = $('#canvas');
	var canvasElement = document.getElementById("canvas"); //differs from the jQuery selector in what is returned when fetched and what can be done with the returned element - non-jquery returned object can give getContext("2d") e.g.
	var ctx = canvasElement.getContext("2d");
	var canvasWidth = canvasElement.getAttribute("width");
	var canvasHeight = canvasElement.getAttribute("height");
	var messages = $('#messages');
	var m = $('#m');
	var boardPieces = $('#boardPieces');
	var myPieces = $('#myPieces');
	var opponentPieces = $('#opponentPieces');
	var gameClockElem = $('#gameClockElem');
	
	//timer ids
	var secondClockActionIValID = null;
	var t2 = null;
	//var roomListUpdateIValID = null;
	var intervalID = null;
	
	var gameTurnTimer = null;
	var gameClock = null;
	
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
						width: 600,
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
					
	//var boardGrid = [0,0,0,0,0,0,0,0,0]; //1 for one player, -1 for another player, 0 if empty
	
	const winComboAmount = 8; //3 horizontal, 3 vertical, 2 diagonal = 8
	/*const winCombos = {	1: [1,2,3],
						2: [4,5,6],
						3: [7,8,9],
						4: [1,4,7],
						5: [2,5,8],
						6: [3,6,9],
						7: [1,5,9],
						8: [3,5,7]};*/
					
	//console.log("cellPos 5 = x: " + cellPos[5].x + ", y: " + cellPos[5].y);
						
	const textStrings = {	wfo: "Waiting for opponent...",
							rurdy: "Room full, are you ready?",
							ulose: "You lose.",
							uwin: "CONGRATULATIONS, YOU WON!",
							adraw: "It's a draw!",
							othersmove: "Opponents is making his/hers move..",
							mymove: "It's your move!",
							outoftime: "You forfeit your turn to the opponent (too slow)..",
							seemDC: "Seems your opponent disconnected, room disappears in 2 minutes."};
	

	const XOLineThickness = 3;
	
	//console.log("all vars decl");
	
	
	
	//var socketCID = -1;
	
	var yourBoardPiecesStartingValue = 4;
	var opponentBoardPiecesStartingValue = 4;
	
	var yourBoardPiecesLeft = null;
	var opponentBoardPiecesLeft = null;
	
	//socket.on('register clientID clientside', function(clientID) {
	//	console.log("inside of registering clientID clientside");
	//	socketCID = clientID;
	//});
	
	/*
	=================================================================
			Client connect interface setup
	=================================================================
	*/
	
	//hide the parts of the interface not to be shown at client connect
	createRoomForm.hide();
	joinRoomForm.hide();
	roomLogin.hide();
	
	readyCheck.hide();
	
	//save 3 lines of chode here by simply hiding chat instead?
	canvas.hide();
	chat.hide();
	boardPieces.hide();
	
	
	
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
				nickRegStatusMsg.text("Your nickname contained whitespaces or foreign characters. Please change it to not have whitespaces (or anything except a-z, A-Z and 0-9).").fadeIn(100).fadeOut(LONG_FADE_TIME);
			}
		}else {
			//if less than 1 character, or more than 25
			nickRegStatusMsg.text("Username must be > 1 character long, and less than 25 characters.").show().fadeOut(LONG_FADE_TIME);
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
				
				
				//now if any intervals was set upon room creation --- interrupt them... BUT wtf... there shouldnt be any timers here wtf?!?!?!?!
			}else {
				statusMsgContainer.text("Your Lobbyname contained characters other than a-z, A-Z and 0-9 - try sticking with the allowed ones.").show().fadeOut(4000);
			}
			
		}else {
			statusMsgContainer.text("Your Lobbyname need to be between 2 and 20 characters long.").show().fadeOut(4000);
		}
		lobbyNameField.val('');
		pwField.val('');
		
		
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
	
	$('#yesBtn').on('click', function() {
		//hide readycheck --do that on other receiving of event emitted from server
		//readyCheck.hide();
		console.log("registering yesBtn click");
		
		
		//if I want to keep this "clearInterval action" -- if I need to keep it -- then simply pass it along with the emit events!
		socket.emit('readycheck response', true);
		
		
		
		//update clientside interface after having received "readycheck completed" or something from server
		
		return false;
	});

	$('#noBtn').on('click', function() {
		
		console.log("registering noBtn click");
		
		socket.emit('readycheck response', false);
		
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
	/*canvasElement.ondragstart = function(e) {
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
	}*/
	
	
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
	socket.on('user registered', function(username) {
		console.log("inside of user registered.");
		
		//what should happen on the clientside if user is registered for the endproduct of the project?: Well, that a user is successfully registered needs to be kept track of... maybe?, usernameRegForm need to be hidden, createdRoomForm and joinRoomForm need to be shown, somehow user should get a interface message that registration was successful
		
		//reg = true;
		
		//hide username reg interface section
		usernameRegSection.hide();
		createRoomForm.show();
		joinRoomForm.show();
		lobbyNameField.focus();
		//wonGames.text('');
		//avgGameTime.text('');
		
		titleText.append("Welcome to TicTacToe online Multiplayer gaming portal <span id='usernameColor'>" + username + "</span>");
		
	});
	
	socket.on('update siteStatsArea', function(clients) {
		//totalConnectedUsers
		//notYetInRoomUsers
		totalConnectedUsers.text(clients.length);
		
		var notInRoomCounter = 0;
		for(var i = 0; i < clients.length; i++)
		{
			if(clients[i].roomActive == false)
			{
				notInRoomCounter += 1;
			}
		}
		
		//notYetInRoomUsers = $('#notYetInRoom');
		notYetInRoomUsers.text(notInRoomCounter);
		
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
	
	socket.on('load roomlist', function(rooms) {
		console.log("inside load roomlist");
		
		console.log("rooms contains: ", rooms);
		
		//console.log("selectedValue in update roomlist for all: " + data.selectedValue);
		
		roomlist.empty();
		console.log("amount of rooms: ", rooms.length);
		if(rooms.length > 0)
		{
			console.log("heja heja");
			var createdStr = "";
			for(var i = 0; i < rooms.length; i++)
			{
				//for every room:
				createdStr = getTimeDiffString(rooms[i].createdTime);
				
				//&#xe033 <- this lock icon unicode didnt quite work
				roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>"));
			}
			//once all rooms loaded --- then initiate update sequence
			
			if(intervalID == null) //otherwise assume its already running?
			{
				console.log("start roomlist update emitted from client here");
				socket.emit('start roomlist update');
			}
		}
	});
	
	socket.on('clear intervals', function() {
		
		if(intervalID != null)
		{
			clearInterval(intervalID);
			intervalID = null;
		}
	});
	
	
	socket.on('initiate roomlist update', function() {
		console.log("inside of individual roomlist update");
		
		//check if any of the alternatives are selected, if so, get its value
		intervalID = setInterval(function() { //roomListUpdateIValID
			var selectedValue = "";
			if($('#roomlist').val())
			{
				selectedValue = $('#roomlist').val();
				console.log("select value: ", selectedValue);
			}
			console.log("selected value : ", selectedValue);
			console.log("inside of timeout function should be called every 15s");
			socket.emit('update roomList', selectedValue); //{intervalID: intervalID, selectedValue: selectedValue});
			
		}, TIMER_TRIGGER_TIME); //every 15 or so secs
		
	});
	
	socket.on('update gameStatsArea', function(gameStats) {
		/*
			var wonGames = $('#winGames');
			var avgGameTime = $('#avgGameTimeNmbr');
		*/
		
		wonGames.text(gameStats.wonGames + "/" + gameStats.totalGames);
		avgGameTime.text(gameStats.avgGameTime + "s");
		
	});
	
	socket.on('update selected option', function(selectedValue) {
		console.log("inside of update selected option clientside.");
		$('option[value="' + selectedValue + '"]').attr('selected', 'selected');
	});
	
	
	socket.on('room login failed', function() {
		loginStatus.text('Wrong password, try again - or return to lobbylist.').fadeIn(1000).fadeOut(2000);
		
		console.log("inside of room login failed");
	});
	
	//could work for both creator AND client - does the same thing..?
	socket.on('creator joins room', function(data) {
		console.log("creator joins room");
		
		createRoomForm.hide();
		joinRoomForm.hide();
		titleText.hide();
		canvas.show();
		boardPieces.hide();
		messages.empty();
		chat.show();
		m.focus();
		
		//append to the chat that username joined the room --- once canvas implemented etc. this is where we draw the text "awaiting opponent" I believe.
		appendDatedMsg(messages, "Welcome <b>" + data.username + "</b>, you have joined your created room: <i>" + data.room + "</i>");
		
		//also paint the graphics necessary for when creator have joined his created room:
		drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
		//to make it easy, 300x300 tic-tac-toe board size
		//var TILE_BOARD_SIDE = 300;
		
		//paintGameInfoPlack();
		paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo);
		
		
		drawPlackText(ctx, textStrings.wfo, plackMarginLeft, plackInfo, gameColors);
		//drawPlackText(textStrings.wfo, plackInfo.fontSize);
		
		drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		//drawTTTBoard();
		
	});
	
	socket.on('client joins room', function(data) {
		console.log("client joins room");
		
		roomLogin.hide();
		createRoomForm.hide();
		joinRoomForm.hide();
		titleText.hide();
		canvas.show();
		boardPieces.hide();
		messages.empty();
		chat.show();
		m.focus();
		
		 //in case this user was in the room previously we don't want to have them keep the chat history.
		
		//paint interface on canvas
		
		//best to paint readycheck in canvas or out of canvas?
		
		//append to the chat that username joined the room --- once canvas implemented etc. this is where we draw the text "awaiting opponent" I believe.
		appendDatedMsg(messages, "Welcome <b>" + data.username + "</b>, you have joined your created room: <i>" + data.room + "</i>");
		
		//also paint the graphics necessary for when creator have joined his created room:
		drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
		//to make it easy, 300x300 tic-tac-toe board size
		//var TILE_BOARD_SIDE = 300;
		
		//paintGameInfoPlack();
		paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo);
		
		
		drawPlackText(ctx, textStrings.wfo, plackMarginLeft, plackInfo, gameColors);
		//drawPlackText(textStrings.wfo, plackInfo.fontSize);
		
		drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		socket.emit('trigger readycheck broadcast for room', data.room);
	});
	
	socket.on('client joined room', function(username) {
		//when a client joins the room --- creator should be notified by appending message to messages:
		appendDatedMsg(messages, "User: <b>" + username + "</b> have joined the room.");
	});
	
	socket.on('readycheck', function() {
		//show the readycheck HTML stuff
		readyCheck.show();
		
		if(t2 && secondClockActionIValID)
		{
			clearInterval(secondClockActionIValID);
			clearTimeout(t2);
		}
		
		//show a HTML progressbar for time a user got to respond
		//store readycheck issued time serverside
		//set a timer and if no response in that time from client -- assume its a no - send the no-event to server
		rCheckProgressBar.attr('value', 0); //reset
		
		var progressBarValue = 0;
		secondClockActionIValID = setInterval(function() {
			
			rCheckProgressBar.attr('value', progressBarValue);
			progressBarValue += 1;
			console.log("inside progressbar tick each sec");
			
			//socket.emit('individual update roomList', {intervalID: intervalID, selectedValue: selectedValue});
			
		}, SECOND); //every second it should update the "ticker" and progressbar
		
		//somehow set t2 to null if creator or client leaves?
		
		t2 = setTimeout(function() {
			clearInterval(secondClockActionIValID);
			secondClockActionIValID = null;
			console.log("clearing progressbar tick interval");
			socket.emit('readycheck response', false); //if it runs out -- Give out No replies.
			//socket.emit No Response
			//after 1 second assume response is "No"
		}, READYCHECK_TIME + 2000); //+2000 because takes 2s to get started give or take
		
	});
	
	socket.on('a user left the room', function(username) {
		appendDatedMsg(messages, "User: <b>" + username + "</b> have declined the readycheck and was thereby kicked out of this room.");
	});
	
	socket.on('stop all readycheck chinanigans', function() {
		if(secondClockActionIValID && t2)
		{
			clearInterval(secondClockActionIValID);
			secondClockActionIValID = null;
			clearTimeout(t2);
			t2 = null;
		}
		readyCheck.hide();
		
		//paint canvas interface for a yesser (?)
		
	});
	
	socket.on('kick client from a room', function(rooms) {
		console.log("inside of kick client from a room");
		chat.hide();
		createRoomForm.show();
		joinRoomForm.show();
		roomlist.empty();
		console.log("amount of rooms: ", rooms.length);
		
		statusMsgContainer.text("Either you or opponent declined readycheck or chose to leave the room or the game was won - if creator of room decline readycheck, then room got deleted and all in it kicked - same goes for finishing a game, if client that joined room declined readycheck, then simply that client kicked from room.").show().delay(10000).fadeOut(500);
		
		//load roomlist instantaneously, and then initiate update .. hmm.
		if(rooms.length > 0) //only if there are rooms in roomList, if none, room update should occur naturally from creating the room anyways.
		{
			console.log("inside of if rooms.length > 0");
			
			var createdStr = "";
			for(var i = 0; i < rooms.length; i++)
			{
				//for every room:
				createdStr = getTimeDiffString(rooms[i].createdTime);
				
				//&#xe033 <- this lock icon unicode didnt quite work
				roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>"));
			}
			
			socket.emit('start roomlist update');
		}
		
	});
	
	socket.on('roomleaving data scrubbing', function() {
		socket.emit('roomleave data scrub');
	});
	
	socket.on('prep for start of game', function() {
		console.log("prep for start of game");
		boardPieces.show();
		//paint boardPieces
		//proper canvas message etc.
		//statusMsgContainer.text("prepping for start of game").show();
		
		//paint boardPieces // populate with ALL pieces - or simply show pre-programmed... either wa works...
		
		
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
		
	});
	
	socket.on('your turn in game', function() {
		console.log("inside of your turn in game");
		//statusMsgContainer.text("my turn in game.").show();
		//gameClockElem.show();
		gameClockElem.css('visibility', 'visible');
		
		//clear canvas
		//paint plack
		//tttboard
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		//paint placktext
		drawPlackText(ctx, textStrings.mymove, plackMarginLeft, plackInfo, gameColors);
		
		
		
		var eventName = Modernizr.touch ? 'touchstart' : 'click';
		console.log("eventName: ", eventName);
		
		canvas.on(eventName, function(e) {
			e.preventDefault();
			
			console.log("inside of canvas click");
			
			//I'm thinking something like this:
			//a click on canvas occurs - that click needs to be sent to our server to be stored and dealt with logicwise, then turn should switch
			//so basically all we wanna do here, is register the click, send it to the server, store it and deal with it there per client
			//the drawing of shit etc is clientside sure, but the dealing with the game logics, is serverside for sure.
			
			
			//using pageX and pageY to get mouse pos relative to browser window
			/*var mouse = {
				x: e.pageX - canvasPosition.x,
				y: e.pageY - canvasPosition,y
			};*/
			var canvasPosition = {
				x: canvas.offset().left,
				y: canvas.offset().top
			};
			
			console.log("canvasPosition.x (canvas.offset().left): ", canvasPosition.x);
			console.log("canvasPosition.y (canvas.offset().top): ", canvasPosition.y);
			
			var position = getPosition(e, canvasPosition);
			//this gives us local coordiantes which consider (0,0) origin at to-left of canvas element
			
			console.log("canvas click/touch detected at pos: ", position);
			
			/*var mx = 0, my = 0;
			mx = e.clientX - canvas.offsetLeft;
			my = e.clientY - canvas.offsetTop;*/
				
			var cellHit = hitZoneDetection(position.x, position.y, boardSide, cellPos, tttBoardMarginLeft, tttBoardMarginTop, cellSide);
			
			console.log("cellHit = " + cellHit);
			
			//after we found out what cell got hit, we should let the server know..
			//see action taken below -- looping through boardGrid, which is exactly what should be done serverside to store within roomlists boardGrid
			
			if(cellHit != -1)
			{
				console.log("registering tictactoe move");
				socket.emit('register tictactoe move', cellHit);
				canvas.off(eventName); //detach event listener if hit was made (see if this works)
			}
			
			//gameClockElem.hide();
			gameClockElem.css('visibility', 'hidden');
			
			return false;
		});
		
		var countdownTime = GAME_TURN_TIME/1000 -1; //-1 because it first triggers after 1 second 14 +1 = 15 = 15s turn
		gameClockElem.text("Time left on turn: 15");
		gameClock = setInterval(function() {
			//every second our "gameClock should be updated
			console.log("inside of gameClock ticking every second");
			gameClockElem.text("Time left on turn: " + countdownTime);
			countdownTime -= 1;
		}, SECOND);
		
		gameTurnTimer = setTimeout(function() {
			//what should happen after 15s?
			//clear gameClock interval
			//clearInterval(gameClock);
			//gameClock = null;
			//socket.emit switch turn -- hmm...
			//gameClockElem.hide();
			gameClockElem.css('visibility', 'hidden');
			socket.emit('register tictactoe move', -1); //either on 15s but then I want to send move data to serv.. fml...
			canvas.off(eventName); //detach event listener if timer runs out
			
		}, GAME_TURN_TIME);
		
	});
	
	socket.on('opponents turn in game', function() {
		//statusMsgContainer.text("opponents turn in game.").show();
		console.log("opponents turn in game");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		//paint placktext
		drawPlackText(ctx, textStrings.othersmove, plackMarginLeft, plackInfo, gameColors);
		
		//and rest is just to wait until "your turn" I suppose
		
	});
	
	socket.on('set starting player', function() {
		console.log("set starting player");
		socket.emit('register starting player');
	});
	
	socket.on('paint moves', function(movesArray) {
		console.log("inside of paint moves");
		console.log("movesArray.length: ", movesArray.length);
		
		//"scroll through each movesArray index, check if 1, -1, or 0 and paint accordingly
		//that seemed easy enough.. we'll see how it turns out..
		for(var i = 1; i <= movesArray.length; i++)
		{
			//cellHit will be i
			if(movesArray[i-1] == 1)
			{
				//paint O
				paintXO(ctx, "o", i, XOLineThickness, gameColors, cellPos, cellSide);
				
			}else if(movesArray[i-1] == -1)
			{
				//paint X
				paintXO(ctx, "x", i, XOLineThickness, gameColors, cellPos, cellSide);
				
			}//nothing should happen on 0
		}
	});
	
	
	socket.on('setYourBoardPiecesValue', function() {
		console.log("inside of setYourBoardPiecesValue");
		yourBoardPiecesStartingValue = 5; //starting player always have 1 more piece than other player
		yourBoardPiecesLeft = yourBoardPiecesStartingValue;
		opponentBoardPiecesLeft = 4;
	});
	
	socket.on('setOpponentBoardPieceValue', function() {
		console.log("inside of setOpponentBoardPieceValue");
		opponentBoardPiecesStartingValue = 5;
		opponentBoardPiecesLeft = opponentBoardPiecesStartingValue;
		yourBoardPiecesLeft = 4;
	});
	
	
	socket.on('boardPieces paintout', function() {
		var textString = '';		
		
		textString += '<b>Your board pieces:</b> [';
		if(yourBoardPiecesStartingValue == 5)
		{
			for(var i = 0; i < yourBoardPiecesLeft; i++)
			{
				if(i < yourBoardPiecesLeft-1) //< or !=
				{
					textString += 'O, ';
				}else {
					textString += 'O';
				}
			}
		}else {
			for(var i = 0; i < yourBoardPiecesLeft; i++)
			{
				if(i < yourBoardPiecesLeft-1) //< or !=
				{
					textString += 'X, ';
				}else {
					textString += 'X';
				}
			}
		}
		textString += ']';
		//and append hereafter
		myPieces.text('');
		myPieces.append(textString);
		
		//this also means that opponent is X so we can paint their values too
		textString = '<b>Opponent board pieces:</b> [';
		if(opponentBoardPiecesStartingValue == 5)
		{
			for(var i = 0; i < opponentBoardPiecesLeft; i++)
			{
				if(i < opponentBoardPiecesLeft-1)
				{
					textString += 'O, ';
				}else {
					textString += 'O';
				}
			}
		}else {
			for(var i = 0; i < opponentBoardPiecesLeft; i++)
			{
				if(i < opponentBoardPiecesLeft-1)
				{
					textString += 'X, ';
				}else {
					textString += 'X';
				}
			}
		}
		textString += ']';
		opponentPieces.text('');
		opponentPieces.append(textString);
	});
	
	socket.on('boardPieces update', function(player) {
		console.log("this clients yourBoardPiecesStartingValue holds: " + yourBoardPiecesStartingValue + ", and opponentBoardPiecesStartingValue holds: " + opponentBoardPiecesStartingValue);
		
		var textString = '';
		
		if((yourBoardPiecesStartingValue == 5 && player == 1) || 
			(yourBoardPiecesStartingValue == 4 && player == -1))
		{
			yourBoardPiecesLeft -= 1;
		}else if((opponentBoardPiecesStartingValue == 5 && player == 1) ||
				(opponentBoardPiecesStartingValue == 4 && player == -1)) 
		{
			opponentBoardPiecesLeft -= 1;
		}
		
		textString += '<b>Your board pieces:</b> [';
		if(yourBoardPiecesLeft != 0)
		{
			if(yourBoardPiecesStartingValue == 5)
			{
				for(var i = 0; i < yourBoardPiecesLeft; i++)
				{
					if(i < yourBoardPiecesLeft-1) //< or !=
					{
						textString += 'O, ';
					}else {
						textString += 'O';
					}
				}
			}else
			{
				for(var i = 0; i < yourBoardPiecesLeft; i++)
				{
					if(i < yourBoardPiecesLeft-1) //< or !=
					{
						textString += 'X, ';
					}else {
						textString += 'X';
					}
				}
			}
		}else if(yourBoardPiecesLeft == 0)
		{
			textString += '-';
		}
		textString += ']';
		//and append hereafter
		myPieces.text('');
		myPieces.append(textString);
		
		//this also means that opponent is X so we can paint their values too
		textString = '<b>Opponent board pieces:</b> [';
		if(opponentBoardPiecesLeft != 0)
		{
			if(opponentBoardPiecesStartingValue == 5)
			{
				for(var i = 0; i < opponentBoardPiecesLeft; i++)
				{
					if(i < opponentBoardPiecesLeft-1)
					{
						textString += 'O, ';
					}else {
						textString += 'O';
					}
				}
			}else {
				for(var i = 0; i < opponentBoardPiecesLeft; i++)
				{
					if(i < opponentBoardPiecesLeft-1)
					{
						textString += 'X, ';
					}else {
						textString += 'X';
					}
				}
			}
		}else if(opponentBoardPiecesLeft == 0) {
			textString += '-';
		}
		textString += ']';
		opponentPieces.text('');
		opponentPieces.append(textString);
		
	});
	
	socket.on('draw lose', function(data) {
		console.log("inside of draw lose");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		//paint placktext
		drawPlackText(ctx, textStrings.ulose, plackMarginLeft, plackInfo, gameColors);
		
		//remember on lose screen the winner pieces should also be marked painted!!! and board restored to winstate
		
		drawPiecesExceptWinPieces(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
		drawMultipleCells(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
	});
	
	socket.on('draw win', function(data) {
		console.log("inside of draw win");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		//paint placktext
		drawPlackText(ctx, textStrings.uwin, plackMarginLeft, plackInfo, gameColors);
		
		
		drawPiecesExceptWinPieces(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
		drawMultipleCells(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
	});
	
	socket.on('draw draw', function(movesArray) {
		console.log("inside of draw draw");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		//paint placktext
		drawPlackText(ctx, textStrings.adraw, plackMarginLeft, plackInfo, gameColors);
		
		for(var i = 1; i <= movesArray.length; i++)
		{
			//cellHit will be i
			if(movesArray[i-1] == 1)
			{
				//paint O
				paintXO(ctx, "o", i, XOLineThickness, gameColors, cellPos, cellSide);
				
			}else if(movesArray[i-1] == -1)
			{
				//paint X
				paintXO(ctx, "x", i, XOLineThickness, gameColors, cellPos, cellSide);
				
			}//nothing should happen on 0
		}
	});
	
	socket.on('clear game timers', function() {
		console.log("inside of clear game timers");
		if(gameClock)
		{
			clearInterval(gameClock);
			gameClock = null;
		}
		
		if(gameTurnTimer)
		{
			clearTimeout(gameTurnTimer);
			gameTurnTimer = null;
		}
	});
	
	socket.on('update wins', function() {
		console.log("inside of update wins clientside");
		socket.emit('updating wins');
	});
	
	socket.on('update total games', function() {
		console.log("inside of update total games clientside");
		socket.emit('updating total games');
	});
	
	socket.on('update avg game time', function(gameTime) {
		console.log("inside of update avg game time clientside");
		socket.emit('updating avg game time', gameTime);
	});
	
	socket.on('leaving room', function() {
		console.log("inside of leaving room");
		chat.hide()
		createRoomForm.show();
		joinRoomForm.show();
		
	});
	
	socket.on('ending game procedure', function() {
		console.log("inside of ending game procedure clientside");
		var countdownTime = 10; //-1 because it first triggers after 1 second 14 +1 = 15 = 15s turn
		gameClockElem.text("You will be returned to create/join lobby room in: " + countdownTime).css('visibility', 'visible');
		gameClock = setInterval(function() {
			//every second our "gameClock should be updated
			console.log("inside of gameClock ticking every second");
			gameClockElem.text("You will be returned to create/join lobby room in: " + countdownTime);
			countdownTime -= 1;
		}, SECOND);
		
		gameTurnTimer = setTimeout(function() {
			//what should happen after 15s?
			//clear gameClock interval
			//clearInterval(gameClock);
			//gameClock = null;
			//socket.emit switch turn -- hmm...
			//gameClockElem.hide();
			gameClockElem.hide()
			socket.emit('now we leave game');
			//socket.emit('register tictactoe move', -1); //either on 15s but then I want to send move data to serv.. fml...
			//canvas.off(eventName); //detach event listener if timer runs out
			
		}, 10*SECOND);
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
	
	//socket.on('stop lobby update interval', function(intervalID) {
	socket.on('stop lobby update interval', function() {
		clearInterval(intervalID);
		console.log("cleared interval of intervalID: ", intervalID);
		intervalID = null;
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
		
		//scroll to the latest added message, credit to: https://stackoverflow.com/questions/42196287/div-does-not-auto-scroll-to-show-new-messages
		messages.animate({ scrollTop: messages[0].scrollHeight }, 'fast')
		
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