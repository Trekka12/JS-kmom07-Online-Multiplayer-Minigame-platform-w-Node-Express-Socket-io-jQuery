$(document).ready(function(){
	"use strict";
	var socket = io();
	
	/*
	=================================================================
			Global var declaration below
	=================================================================
	*/
	
	//global const var declaration (also for semantics)
	const LONG_FADE_TIME = 2000; //2s
	const SHORT_FADE_TIME = 500; //ms
	const TYPING_TIMER_LENGTH = 400; //ms
	const TIMER_TRIGGER_TIME = 15000; //15s
	const GAME_TURN_TIME = 15000; //15s
	const READYCHECK_TIME = 30000; //30s
	const SECOND = 1000; //1s
	
	
	const MIN_USERNAME_CHARS = 2;
	const MAX_USERNAME_CHARS = 25;
	const MIN_LOBBYNAME_CHARS = 2;
	const MAX_LOBBYNAME_CHARS = 20;
	
	//global RegEx patterns used throughout client.js
	//swedish unicode chars to use for regex to use swedish chars for roomname and username:
	//\u00C4\u00C5\u00D6\u00E4\u00E5\u00F6
	
	const azAZ09regex = /^[a-zA-Z0-9\u00C4\u00C5\u00D6\u00E4\u00E5\u00F6]+$/; 
	const azAZ09inclWS = /^([a-zA-Z0-9\s\u00C4\u00C5\u00D6\u00E4\u00E5\u00F6]+)$/; //unicodes represent swedish chars lowercase and uppercase according to: http://www.geocities.ws/click2speak/unicode/chars_sv.html (thanks devsnek @ ##javascript , IRC)
	
	//global client var declaration
	var roomToLoginTo = -1; //used to keep track of what room client is currently in
	var typing = false; //keeping track of whether user is typing or not
	
	//front-end DOM elements used throughout client.js
	var container = $('#container');
	var dcArea = $('#dcArea');
	var dcText = $('#dcText');
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
	var readyCheckStatusMsg = $('#readycheckStatusMsg');
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
	
	
	//timer ids (declared globally to easily reset them when needed)
	var secondClockActionIValID = null; //readycheck interval ID
	var t2 = null; //readycheck timeout ID
	
	var intervalID = null; //roomlist update inteval ID
	
	var gameTurnTimer = null; //gameturn timeout ID
	var gameClock = null; //game clock interval ID
	
	var leaveRoomInt = null; //leave room "ending game procedure" interval id
	var leaveRoomCountdown = null; //leave room "ending game procedure" timeout id
	
	var reconnectTimer = null; //pretty self explanatory I figure
	
	var typingTimeout = null;
	
	//global clientside game vars
	const gameColors = {	bgColor: "#1f781f",
							boardColor: "#b05e23",
							textAndBorderColor: "#000000",
							plackColor: "#e3e3e3",
							markedCellColor: "#ffffff"};

	const boardSide = 300; //our tic tac toe box width
	const cellSide = boardSide/3; //our tic tac toe cell width

	const plackInfo = {	fontSize: 35,
						fontFamily: "sans-serif",
						width: 600,
						height: 50,
						marginTop: 24};
	
						
	const plackMarginLeft = canvasWidth/2 - plackInfo.width/2; //to center it
	
	const plackToTTTSpace = 45; //TTT = TicTacToe
	
	const tttBoardMarginTop = plackInfo.marginTop + plackInfo.height + plackToTTTSpace, //45 between plack and TTT board ~ 114 margin-top total
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
	
	//help us determine who is starting player
	var yourBoardPiecesStartingValue = 4; //starts out as 4 both of them, one changes depending on who is "starting player" since he by default will have 1 extra board piece to use
	var opponentBoardPiecesStartingValue = 4;
	
	//keep track of boardPieces to be painted after each move made
	var yourBoardPiecesLeft = null;
	var opponentBoardPiecesLeft = null;
	
	/*
	=================================================================
			Client connect interface setup
	=================================================================
	*/
	
	//hide the parts of the interface not to be shown at client connect
	dcArea.hide();
	
	createRoomForm.hide();
	joinRoomForm.hide();
	roomLogin.hide();
	
	readyCheck.hide();
	
	//save 3 lines of code here by simply hiding chat instead? possible future fix to investigate
	canvas.hide();
	chat.hide();
	boardPieces.hide();
	
	//its a nice user friendly feature not having to manually click the field to write input into it - hence .focus()
	usernameField.focus();
	
	socket.on('connect', function() {
		if(reconnectTimer != null) //if a reconnect occured, clear the interval before moving on
		{
			clearInterval(reconnectTimer);
			reconnectTimer = null;
		}
	});
	
	/*
	=================================================================
			Client triggered Events below
	=================================================================
	*/
	
	$('#usernameRegForm').submit(function() {
		//console.log("inside of #usernameRegForm.submit");
		
		//it can't be empty, AND it must be more than 2 characters or less than/equal to 25
		if(usernameField.val().length >= MIN_USERNAME_CHARS && usernameField.val().length <= MAX_USERNAME_CHARS)
		{
			//secondary check - indirectly check to see if it contains spaces with regex by checking that it contains only a-z, A-Z and 0-9 + swe chars - if it does also contain whitespace: inform user and have them change it to without whitespaces (personal preference)
			if(azAZ09regex.test(usernameField.val()))
			{
				socket.emit('user registration', usernameField.val()); 
				
				usernameField.val(''); //just in case
				
			}else {
				nickRegStatusMsg.text("Your nickname contained whitespaces or foreign characters. Please change it to not have whitespaces (or anything except a-z, A-Z and 0-9).").fadeIn(100).fadeOut(LONG_FADE_TIME);
			}
		}else {
			//if less than- or 1 character, or more than 25
			nickRegStatusMsg.text("Username must be > 1 character long, and less than 25 characters.").show().fadeOut(LONG_FADE_TIME);
		}
		
		return false; //return false stops default execution, and for .submit this means page update is stopped (which is what we want)
	});
	
	
	$('#createRoomForm').submit(function() {
		//console.log("inside of submit func for createRoomBtn");
		
		//handle all the user input filtration on the server side and then also emit events from serverside based on what input was given - if sufficient or not.
		//check clientside so input is neither empty nor faulty before sending it along to the best of clientsides abilities
		var lobbyName = lobbyNameField.val().trim(); //start by trimming away trailing and leading whitespaces
		
		if(lobbyName.length >= MIN_LOBBYNAME_CHARS && lobbyName.length <= MAX_LOBBYNAME_CHARS) //check so that length is within parameters
		{
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
		pwField.val('');
		
		return false;
	});
	
	
	$('#joinRoomForm').submit(function() {		
		//when a socket / client / user selects room and presses "join room", they should by all accounts join the perverbial room by hiding create room, and join room sections, and show chat room - and also connect to the specific room they selected. 
		
		//console.log("inside of joinRoomForm submit");
		//console.log("selected room attempting to join: ", roomlist.val());
		
		socket.emit('join room', roomlist.val());
		
		return false;
	});
	
	
	$('#roomLoginForm').submit(function() {
		// console.log("inside roomLoginForm.submit");
		
		//what should happen when PW-form is submitted...
		socket.emit('room login attempt', {roomindex: roomToLoginTo, pw: loginPWField.val()});
		//on successful login - reset roomToLoginTo? - something to consider in future if there are downsides Not to do
		
		//console.log("$('loginPW').val() = ", loginPWField.val());
		
		loginPWField.val('');
		
		return false;
	});
	
	
	socket.on('too many in room', function() {
		loginStatus.text('Room appears to be full, either restart client or try a different room, we apologize for the inconvenience.').show().delay(2000).fadeOut(500);
	});
	
	
	$('#yesBtn').on('click', function() {
		// console.log("registering yesBtn click");
		
		socket.emit('readycheck response', true);
		
		return false;
	});

	
	$('#noBtn').on('click', function() {
		
		// console.log("registering noBtn click");
		
		socket.emit('readycheck response', false);
		
		return false;
	});
	
	
	$('#back2mainScreen').on('click', function() {
		// console.log("inside of back2mainScreen onclick");
		
		roomLogin.fadeOut(SHORT_FADE_TIME);
		
		return false;
	});
	
	
	$('#roomlist').on('change', function() {
		$('option[value="' + this.value + '"]').attr('selected', 'selected');
		// console.log("checking .val() if shows selected: " + roomlist.val());
		
		joinRoomBtn.prop('disabled', false);
	});	
	
	
	$('#chatForm').submit(function() {
		// console.log("inside chatForm submit");
		
		//check if first letter is a '/' <- then assume command, if not, assume chat msg
		if(m.val().substr(0,1) === "/")
		{
			// console.log("sending a command");
			socket.emit('command', m.val());
			m.val('');
			
		}else //if no command, but chat msg
		{
			socket.emit('chat message', {msg: m.val(), timestamp: (Date.now())});
		}
		
		return false; // breaks function execution e.g. no page update
	});
	
	
	$('#m').keydown(function(e) {
		if (e.which === 13) //if ENTER
		{
			socket.emit('stopTypingEnter');
			typing = false;
			// console.log("stopped typing by enter");
		}else if(e.which === 38) //arrow up
		{
			socket.emit("recreate last message");
			// console.log("detected arrow up keydown");
		}
	});
	
	
	$('#m').on('input', function() {
		// console.log("someone is typing now");

		//on textfield input - type out whos/that someone is typing
		socket.emit('isTyping'); //sending typing from client to server
		// console.log("typing");
			
	});
	
	//https://schier.co/blog/2014/12/08/wait-for-user-to-stop-typing-using-javascript.html
	$('#m').on('keyup', function() {
		// console.log("inside on keyup - aka stopped typing");
		clearTimeout(typingTimeout);
	
		typingTimeout = setTimeout(function() {
			socket.emit('stopTyping');
			// console.log("stopped typing by timeout");
			
		}, TYPING_TIMER_LENGTH);
	});
	
	
	$('#leaveRoom').on('click', function() {
		// console.log("roomToLoginTo is of value: ", roomToLoginTo);
		
		socket.emit('leave room', roomToLoginTo);
		
		return false;
	});	
	
	
	/*
	=================================================================
			Dealing with server-responses below
	=================================================================
	*/
	
	socket.on('user registered', function(username) {
		// console.log("inside of user registered.");
		
		//hide username reg interface section
		usernameRegSection.hide();
		createRoomForm.show();
		joinRoomForm.show();
		lobbyNameField.focus();
		
		titleText.append("Welcome to TicTacToe online Multiplayer gaming portal <span id='usernameColor'>" + username + "</span>");
	});
	
	//this helps server to let user know in which ways the interface is NOT supposed to be used
	socket.on('ajabaja', function(idString) {
		var elem = null;
		if(idString == "userreg")
		{
			elem = nickRegStatusMsg;
		}else if(idString == "createroom" || idString == "joinroom" || idString == "typing" || idString == "leaveroom") 
		{
			elem = statusMsgContainer;
		}else if(idString == "roomlogin")
		{
			elem = loginStatus;
		}else if(idString == "readycheck")
		{
			elem = readyCheckStatusMsg;
		}
		
		elem.text("Seems you have attempted to use the application interface in ways it was not intended, please use the application as intended instead.").show().delay(4000).fadeOut(500);
	});
	
	
	socket.on('update siteStatsArea', function(clients) {

		totalConnectedUsers.text(clients.length);
		
		var notInRoomCounter = 0;
		for(var i = 0; i < clients.length; i++)
		{
			if(clients[i].roomActive == false)
			{
				notInRoomCounter += 1;
			}
		}
		
		notYetInRoomUsers.text(notInRoomCounter);
		
	});
	
	/*
	=================================================================
			Create/Join room Socket.io event emit handlers
	=================================================================
	*/
	
	socket.on('show login form', function(roomIndex) {
		// console.log("inside of show login form event clientside");
		
		roomLogin.fadeIn(SHORT_FADE_TIME);
		
		roomToLoginTo = roomIndex;
		// console.log("roomIndex that is attempting to be logged into: ", roomToLoginTo);
	});
	
	//used for PW-protection mainly
	socket.on('created and joined room', function(roomindex) {
		roomToLoginTo = roomindex;
	});
	
	
	socket.on('update roomToLoginTo index', function(newRoomIndex) {
		roomToLoginTo = newRoomIndex;
	});
	
	
	socket.on('load roomlist', function(rooms) {
		// console.log("inside load roomlist");
		
		// console.log("rooms contains: ", rooms);
		
		roomlist.empty(); //first we empty the roomlist (select-option list)
		// console.log("amount of rooms: ", rooms.length);
		if(rooms.length > 0) //then if rooms exist, we load them
		{
			var createdStr = "";
			for(var i = 0; i < rooms.length; i++)
			{
				//for every room:
				createdStr = getTimeDiffString(rooms[i].createdTime);
				
				//short-hand if here determines if room loaded is PW-protected - if so - add a free-to-use-commercially Lock-icon to indicate this interface-wise
				roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>"));
			}
			//once all rooms loaded --- then initiate update sequence
			
			if(intervalID == null) //otherwise assume its already running
			{
				// console.log("start roomlist update emitted from client here");
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
		// console.log("inside of individual roomlist update");
		
		//check if any of the alternatives are selected, if so, get its value
		intervalID = setInterval(function() {
			var selectedValue = "";
			if($('#roomlist').val())
			{
				selectedValue = $('#roomlist').val();
				// console.log("select value: ", selectedValue);
			}
			// console.log("selected value : ", selectedValue);
			// console.log("inside of timeout function should be called every 15s");
			socket.emit('update roomList', selectedValue);
			
		}, TIMER_TRIGGER_TIME); //every 15 secs
		
	});
	
	
	socket.on('update gameStatsArea', function(gameStats) {
		
		wonGames.text(gameStats.wonGames + "/" + gameStats.totalGames);
		
		if(gameStats.avgGameTime >= 60)
		{
			var min = Math.floor(gameStats.avgGameTime / 60);
			var s = gameStats.avgGameTime % 60;
			avgGameTime.text(min + "min & " + s + "s");
		}else {
			avgGameTime.text(gameStats.avgGameTime + "s");
		}
		
	});
	
	
	socket.on('update selected option', function(selectedValue) {
		// console.log("inside of update selected option clientside.");
		$('option[value="' + selectedValue + '"]').attr('selected', 'selected');
	});
	
	
	socket.on('room login failed', function() {
		// console.log("inside of room login failed");
		
		loginStatus.text('Wrong password, try again - or return to lobbylist.').fadeIn(SECOND).fadeOut(LONG_FADE_TIME);
	});
	
	
	socket.on('creator joins room', function(data) {
		// console.log("creator joins room");
		
		createRoomForm.hide();
		joinRoomForm.hide();
		titleText.hide();
		canvas.show();
		boardPieces.hide();
		messages.empty(); //empty potential previous unwanted/irrelevant chat history
		chat.show();
		m.focus(); //shift focus to message input field
		
		appendDatedMsg(messages, "Welcome <b>" + data.username + "</b>, you have joined your created room: <i>" + data.room + "</i>");
		
		//also paint the graphics necessary for when creator have joined his created room:
		drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
		
		paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo);
		
		drawPlackText(ctx, textStrings.wfo, plackMarginLeft, plackInfo, gameColors);
		
		drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
	});
	
	
	socket.on('disable readycheck', function() {
		//if creator DCs during readycheck, disable readycheck
		readyCheck.hide();
		
		if(t2 && secondClockActionIValID)
		{
			clearInterval(secondClockActionIValID);
			secondClockActionIValID = null;
			clearTimeout(t2);
			t2 = null;
		}
	});
	
	
	socket.on('reset creator on client leave', function() {
		// console.log("reset creator on client leave");
		
		readyCheck.hide();
		
		if(t2 && secondClockActionIValID)
		{
			clearInterval(secondClockActionIValID);
			secondClockActionIValID = null;
			clearTimeout(t2);
			t2 = null;
		}
		boardPieces.hide();
		messages.empty();
		chat.show();
		m.focus();

		appendDatedMsg(messages, "Client left and room has now been reset.");
		
		drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
		
		paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo);
		
		drawPlackText(ctx, textStrings.wfo, plackMarginLeft, plackInfo, gameColors);
		
		drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
	});
	
	
	socket.on('client joins room', function(data) {
		// console.log("client joins room");
		
		roomLogin.hide();
		createRoomForm.hide();
		joinRoomForm.hide();
		titleText.hide();
		canvas.show();
		boardPieces.hide();
		messages.empty();
		chat.show();
		m.focus();
		
		appendDatedMsg(messages, "Welcome <b>" + data.username + "</b>, you have joined your created room: <i>" + data.room + "</i>");

		drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
		
		paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo);
		
		drawPlackText(ctx, textStrings.wfo, plackMarginLeft, plackInfo, gameColors);
		
		drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		socket.emit('trigger readycheck broadcast for room', data.room); //triggering readycheck when client joins room (because creator is already in it, so safe to assume that room is full)
	});
	
	
	socket.on('client joined room', function(username) {
		//when a client joins the room --- creator should be notified by appending message to messages:
		appendDatedMsg(messages, "User: <b>" + username + "</b> have joined the room.");
	});
	
	
	socket.on('load existing rooms on connect', function(rooms) {
		// console.log("inside of load existing rooms on connect and init update");
		
		//start by painting all the rooms and their timers, then initiate the update sequence.
		var createdStr = "";
		for(var i = 0; i < rooms.length; i++)
		{
			//for every room
			createdStr = getTimeDiffString(rooms[i].createdTime);
			
			roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>"));
		}
	});
	
	
	socket.on('stop lobby update interval', function() {
		clearInterval(intervalID);
		// console.log("cleared interval of intervalID: ", intervalID);
		intervalID = null;
	});
	
	
	socket.on('deactivate leave room btn', function() {
		// console.log("inside of deactivating leave room button clicker");
		$('#leaveRoom').attr('disabled', 'disabled');
	});
	
	
	/*
	=================================================================
			Readycheck Socket.io event emit handlers
	=================================================================
	*/
	
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
			// console.log("inside progressbar tick each sec");
			
		}, SECOND); //every second it should update the "ticker" and progressbar
		
		t2 = setTimeout(function() {
			clearInterval(secondClockActionIValID);
			secondClockActionIValID = null;
			// console.log("clearing progressbar tick interval");
			socket.emit('readycheck response', false); //if it runs out -- Give out No replies.
			
		}, READYCHECK_TIME + 2000); //+2000 because takes about 2s to get started give or take (rough estimation) (or so it seemed during testing)
		
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
	});
	
	
	socket.on('kick client from a room', function(rooms) {
		// console.log("inside of kick client from a room");
		chat.hide();
		createRoomForm.show();
		joinRoomForm.show();
		roomlist.empty();
		// console.log("amount of rooms: ", rooms.length);
		
		statusMsgContainer.text("Either you or opponent declined readycheck or chose to leave the room or the game was finished. If creator of room for some reason left, then room got deleted and all in it kicked - same goes for finishing a game, if client that joined room left, then that client alone is kicked from room.").show().delay(12*SECOND).fadeOut(SHORT_FADE_TIME);
		
		//load roomlist instantaneously, and then initiate update
		if(rooms.length > 0) //only if there are rooms in roomList, if none, room update should occur naturally from creating the room anyways.
		{
			// console.log("inside of if rooms.length > 0");
			
			var createdStr = "";
			for(var i = 0; i < rooms.length; i++)
			{
				//for every room:
				createdStr = getTimeDiffString(rooms[i].createdTime);
				
				roomlist.append($('<option>').attr('value', rooms[i].name).append((rooms[i].pw !== "none" ? "<img src='img/lock.png' width='12' height='12' /> " : "") + "<b>" + rooms[i].name + "</b> <i>(created " + createdStr + " ago)</i>")); //I am aware that these two lines of code are repetitively written within client.js, but have yet to functionize it
			}
			
			socket.emit('start roomlist update');
		}
		
	});
	
	
	socket.on('roomleaving data scrubbing', function() {
		socket.emit('roomleave data scrub');
	});
	
	/*
	=================================================================
			Start game Socket.io event emit handlers
	=================================================================
	*/
	
	socket.on('set board piece client value', function(value) {
		yourBoardPiecesStartingValue = value;
		yourBoardPiecesLeft = yourBoardPiecesStartingValue;
		
		var oppValue = 0;
		if(value == 4)
		{
			oppValue = 5;
		}else {
			oppValue = 4;
		}
		opponentBoardPiecesStartingValue = oppValue;
		opponentBoardPiecesLeft = opponentBoardPiecesStartingValue;
	});
	
	
	socket.on('prep for start of game', function() {
		// console.log("prep for start of game");
		boardPieces.show();
		
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
	
	
	socket.on('your turn in game', function(boardGrid = [0,0,0,0,0,0,0,0,0]) {
		// console.log("inside of your turn in game");

		gameClockElem.css('visibility', 'visible');
		
		//clear canvas
		//paint plack
		//tttboard
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		drawPlackText(ctx, textStrings.mymove, plackMarginLeft, plackInfo, gameColors);
		
		var eventName = Modernizr.touch ? 'touchstart' : 'click'; //preparations have been made to mobile-adapt this application in the future by handling touch events if no mouse exist
		// console.log("eventName: ", eventName);
		
		canvas.on(eventName, function(e) {
			e.preventDefault();
			
			// console.log("inside of canvas click");
			
			var canvasPosition = {
				x: canvas.offset().left,
				y: canvas.offset().top
			};
			
			// console.log("canvasPosition.x (canvas.offset().left): ", canvasPosition.x);
			// console.log("canvasPosition.y (canvas.offset().top): ", canvasPosition.y);
			
			var position = getPosition(e, canvasPosition);
			//this gives us local coordiantes which consider (0,0) origin at top-left of canvas element
			
			// console.log("canvas click/touch detected at pos: ", position);
				
			var cellHit = hitZoneDetection(position.x, position.y, boardSide, cellPos, tttBoardMarginLeft, tttBoardMarginTop, cellSide, boardGrid);
			
			// console.log("cellHit = " + cellHit);
			
			if(cellHit != -1)
			{
				// console.log("registering tictactoe move");
				socket.emit('register tictactoe move', cellHit);
				canvas.off(eventName); //detach event listener if hit was made
			}
			
			return false;
		});
		
		var countdownTime = GAME_TURN_TIME/1000 -1; //-1 because it first triggers after about 1 second 14 +1 = 15 = 15s turn
		gameClockElem.text("Time left on turn: 15");
		gameClock = setInterval(function() {
			//every second our "gameClock should be updated
			// console.log("inside of gameClock ticking every second");
			gameClockElem.text("Time left on turn: " + countdownTime);
			countdownTime -= 1;
		}, SECOND);
		
		gameTurnTimer = setTimeout(function() {
			gameClockElem.css('visibility', 'hidden');
			socket.emit('register tictactoe move', -1); //-1 = No hit
			canvas.off(eventName); //detach event listener if timer runs out
			
		}, GAME_TURN_TIME);
		
	});
	
	
	socket.on('opponents turn in game', function() {
		// console.log("opponents turn in game");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);

		drawPlackText(ctx, textStrings.othersmove, plackMarginLeft, plackInfo, gameColors);
		
		//and rest is just to wait until "your turn" I suppose
		gameClockElem.css('visibility', 'hidden');
		
	});
	
	/*
	=================================================================
			Playing the game Socket.io event emit handlers
	=================================================================
	*/
	
	socket.on('boardPieces paintout', function() {
		var textString = '';		
		
		textString += '<b>Your board pieces:</b> [';
		if(yourBoardPiecesStartingValue == 5)
		{
			for(var i = 0; i < yourBoardPiecesLeft; i++)
			{
				if(i < yourBoardPiecesLeft-1)
				{
					textString += 'O, ';
				}else {
					textString += 'O';
				}
			}
		}else {
			for(var i = 0; i < yourBoardPiecesLeft; i++)
			{
				if(i < yourBoardPiecesLeft-1)
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
	
	
	socket.on('decrement boardPieces', function() {
		// console.log("inside of decrement boardPieces clientside");
		yourBoardPiecesLeft -= 1;
		opponentBoardPiecesLeft += 1;
	});
	
	
	socket.on('increment boardPieces', function() {
		// console.log("inside of increment boardPieces clientside");
		yourBoardPiecesLeft += 1;
		opponentBoardPiecesLeft -= 1;
	});
	
	
	socket.on('boardPieces update', function(player) {
		// console.log("this clients yourBoardPiecesStartingValue holds: " + yourBoardPiecesStartingValue + ", and opponentBoardPiecesStartingValue holds: " + opponentBoardPiecesStartingValue);
		
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
					if(i < yourBoardPiecesLeft-1) 
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
					if(i < yourBoardPiecesLeft-1) 
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
	
	
	socket.on('clear leave room timers', function() {
		if(leaveRoomInt)
		{
			clearInterval(leaveRoomInt);
			leaveRoomInt = null;
		}
		
		if(leaveRoomCountdown)
		{
			clearTimeout(leaveRoomCountdown);
			leaveRoomCountdown = null;
		}
	});
	
	
	socket.on('clear creator game-related data', function() {
		socket.emit('clear creator game data');
	});
	
	
	socket.on('update wins', function() {
		// console.log("inside of update wins clientside");
		socket.emit('updating wins');
	});
	
	
	socket.on('update total games', function() {
		// console.log("inside of update total games clientside");
		socket.emit('updating total games');
	});
	
	
	socket.on('update avg game time', function(gameTime) {
		// console.log("inside of update avg game time clientside");
		socket.emit('updating avg game time', gameTime);
	});
	
	
	socket.on('leaving room', function() {
		// console.log("inside of leaving room");
		chat.hide()
		createRoomForm.show();
		joinRoomForm.show();
	});
	
	
	socket.on('ending game procedure', function() {
		// console.log("inside of ending game procedure clientside");
		var countdownTime = 10; 
		gameClockElem.text("You will be returned to create/join lobby room in: " + countdownTime).css('visibility', 'visible');
		leaveRoomInt = setInterval(function() {
			//every second our "gameClock should be updated
			// console.log("inside of gameClock ticking every second");
			gameClockElem.text("You will be returned to create/join lobby room in: " + countdownTime);
			countdownTime -= 1;
		}, SECOND);
		
		leaveRoomCountdown = setTimeout(function() {
			gameClockElem.css('visibility', 'hidden');
			socket.emit('now we leave game');
			$('#leaveRoom').removeAttr('disabled');
			
		}, 10*SECOND);
	});	
	
	/*
	=================================================================
			Game graphics with Canvas Socket.io event emit handlers
	=================================================================
	*/
	
	socket.on('paint moves', function(movesArray) {
		// console.log("inside of paint moves");
		// console.log("movesArray.length: ", movesArray.length);
		
		//"scroll through each movesArray index, check if 1, -1, or 0 and paint accordingly
		for(var i = 1; i <= movesArray.length; i++)
		{
			//cellHit will be i-1 since index start off 0
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
	
	
	socket.on('draw lose', function(data) {
		// console.log("inside of draw lose");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		drawPlackText(ctx, textStrings.ulose, plackMarginLeft, plackInfo, gameColors);
		
		drawPiecesExceptWinPieces(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
		drawMultipleCells(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
	});
	
	
	socket.on('draw win', function(data) {
		// console.log("inside of draw win");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		drawPlackText(ctx, textStrings.uwin, plackMarginLeft, plackInfo, gameColors);
		
		drawPiecesExceptWinPieces(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
		drawMultipleCells(data.winCells, data.boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide);
		
	});
	
	
	socket.on('draw draw', function(movesArray) {
		// console.log("inside of draw draw");
		
		resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
		
		//paint placktext
		drawPlackText(ctx, textStrings.adraw, plackMarginLeft, plackInfo, gameColors);
		
		for(var i = 1; i <= movesArray.length; i++)
		{
			//cellHit will be i-1 since index start off 0
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
	
	/*
	=================================================================
			Chat Socket.io event emit handlers
	=================================================================
	*/
	
	socket.on('new message', function(data) {
		m.val('');
		
		var date = new Date();
		
		messages.append($('<li>').css('color', data.textColor).text(date.toLocaleTimeString() + " | " + data.username + ": " + data.message)); //this way (simple fix) opponent will always have blue color while the user himself will always type with black text, "quick-n-diry" ;) - if more users - this could be made more complex and thorough via colors in clientList serverside.
		
		//scroll to the latest added message, credit to: https://stackoverflow.com/questions/42196287/div-does-not-auto-scroll-to-show-new-messages
		messages.animate({ scrollTop: messages[0].scrollHeight }, 'fast');
		
		//have black text for the message sent by self always (will appear colored for other person in chatroom)
	});
	
	
	socket.on('user joined', function(data) {		
		appendDatedMsg(messages, "<b>" + data.username + " joined.</b>");
	});
		
	
	socket.on('isTyping', function(user) {
		statusMsgContainer.text(user.username + " is typing...").show();
	});
	
	
	socket.on('stopTyping', function() { 
		// console.log("clientside stopTyping");
		statusMsgContainer.hide();
	});
	
	
	socket.on('stopTypingEnter', function() {
		statusMsgContainer.hide();
	});
	
	
	socket.on('userLeft', function(data) {
		appendDatedMsg(messages, "<b>" + data.username + " has left.</b>");
	});
	
	
	socket.on('not enough data', function() {
		statusMsgContainer.text("To change nickname you need to enter a nickname between " + MIN_USERNAME_CHARS + " and " + MAX_USERNAME_CHARS + " characters.").show().fadeOut(8000);
	});
	
	
	socket.on('username successfully changed', function(username) {
		m.val(''); //clear field -- doing it here because I want to keep the message in case user tried to type but did so too fast - so they dont have to rewrite entire message...
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
		statusMsgContainer.text("You typed too fast, One message per 1/2 second is allowed. Try again in a little while.").show().delay(LONG_FADE_TIME).fadeOut(SHORT_FADE_TIME);
		//set a timeout and then allow user to type again? show an active timer of how long they must wait? -- advanced (chose to skip this advanced additional feature and focus on whats important).
	});
	
	
	socket.on('recreate last message', function(lastMessage) {
		//set both the value and the actual text in the input field
		m.text(lastMessage);
		m.val(lastMessage);
	});
	
	
	socket.on('disconnect', function() {
		// console.log("application lost connection with server, restart of application will occur on reconnection");
		
		//show DC screen "server went down or your internet did." for example
		
		container.hide();
		
		dcArea.fadeIn(SHORT_FADE_TIME);
		
		//alternatively what could be done here is message the server with a specific event - on server when this event is received, everything is reset --- or recreated (recreation would however require that the data before server went down was stored in DB or similar persistent data storage, a feature I am not looking to implement at this time).
	});
	
	
	socket.on('reconnect', function() {
            // console.log('reconnect fired!');
			
			dcText.text("");
			
			var counter = 5;
			
			dcText.append('Connection re-established,<br />we will reconnect you in 5 seconds.');
			
			var countDownTimer = setInterval(function() {
				counter -= 1;
				
				dcText.text('');
				dcText.append('Connection re-established,<br />we will reconnect you in ' + counter + ' seconds.');
			}, SECOND);
			
			
			var reconTimer = setTimeout(function() {
				location.reload(true); //reload page without cache - simplest solution if node goes down
				clearTimeout(reconTimer);
				clearInterval(countDownTimer);
				countDownTimer = null;
				reconTimer = null;
			}, 5000);
        });
});