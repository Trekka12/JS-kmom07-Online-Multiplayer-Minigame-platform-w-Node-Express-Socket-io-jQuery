#TicTacToe (& minigames) online Multiplayer gaming portal project for JS @ BTH, by: Trekka12
##A Node.js, Express.js and Socket.io web application to utilize realtime multiplaying capabilities of the modern web with simpler mini-games

##Project process
I struggled a lot at first to get started with this project, which lead me to "postpone" it a few years because I couldn't understand how I would possibly start, I envisioned exactly how I wanted everything to be, and work and look but I lacked the necessary knowledge and energy truth be told, and idea of approach to get started and making it work.
After a few years though, I decided to get started again, this time I also struggled quite a bit at first, but then I decided to separate the project into "smaller pieces" or "units" as some might call them(?), where I divided the code I needed for the entirety of the project into a few groups that I needed to figure out and master before I could put everything together. This probably also helped minimize development time, as well as debugging efforts throughout the entire project - since it allowed me to focus on specific smaller areas, instead of having to step-through the massive interface just to reach the problemarea. I also put up a personal deadline for this project of a months time to help me keep motivated and productive and driven towards that goal.
The areas I decided to divide my project into was the following:
- Canvas, graphics and Tic Tac Toe specific graphics as well as basic game logics
- Node.js, Socket.io and Express.js realtime chat application with some additional quality-of-life features
- Node.js, Socket.io and Express.js Multi-room feature - tested on chat rooms

And after having completed all of the above mini-sections and felt confident in understanding each and every one of them, I decided to start the "final product" where everything was to be put together and work in sync with everything and I also started using Git to document the development process of the project - making larger commits when I personally felt I had reached a "checkpoint".

And here we are now...


##Current Features
+ Username registration (including swedish chars)
+ Ability to create "game rooms" (room names allow swedish characters)
+ Ability to join created "game rooms"
+ ability to socket.io realtime chat within "game rooms"
+ ability to see inside of "game rooms" when someone is typing
+ timestamped chat messages (toLocaleString used)
+ User chat messages are colored red/blue depending on startingPlayer
+ Readycheck feature when 2 people join a room
+ room is temporarily "removed" from roomlist when 2 users have joined it (only 2 users allowed in one room)
+ Roomlist shows created rooms with their designated roomname, as well as "created time ago" feature updated every 15th second
+ Mainscreen (after username registered) shows Game statistics such as Won games, total games, avg game time + total connected players (those who have registered) and players NOT in room currently
+ Rooms can also be created with a password to "lock" the room and require login to join the room (helps if 2 users that know each other wish to play together)
+ Username is length restricted and use RegEx to validate for and only allow a-zA-Z0-9 + swedish characters but NO whitespace characters
+ roomname is also length restricted and also use RegEx to validate for same as username BUT Allows whitespace in the name
+ Interface show "status messages" for user for example when username is not complying with limitations set - same for roomname
+ input is escaped using .val()
+ Application uses Modernizr for feature detection and YepNope for Polyfill compensation
+ Application is prepared for Touch event as alternative to Mouseclick - not tested yet though but code base for it is there and applied to project
+ projectFunctions.js uses module exports to export useful functions to be used within server.js and separate "functions" to be used from the actual client.js and server.js files to keep them as "clean" as possible
+ Chat have "special features" - one is to type command /changeNick to change username, the other is to press "ARROW_UP" to recreate last typed message (including command)
+ Chat is also equipped with Anti-Spam feature that won't allow messages within 500ms of each other
+ Rooms have a Leave room button for convenience
+ Roomlist keeps track of selected options even beyond the updating of "created time ago" feature
+ Readycheck has a HTML5 progressbar it progressively fills up every second where 100% = amount of seconds readycheck lasts
+ No response on readycheck for person creating the room results in room getting deleted and all users in it kicked out, while No response from the user that did not create the room results in ONLY that user getting kicked out of the room
+ if Readycheck timer runs out this is equivalent to a No response on the readycheck - readycheck timer is set to 30seconds
+ Roomlogin form that appears when trying to join PW protected rooms can be escaped with the push of a button to return to roomlist if one changes mind of joining the PW protected room
+ upon creating a room - that user gets catapulted automatically to join the room (no need to enter PW if PW protected room was created obviously since it was the creator catapulted into it)
+ TimerID tracking variables are declared globally for easier clearing of them throughout the interface
+ semantic constants are declared to help ease the understanding of the code
+ useful functions used by client.js or server.js are placed within projectFunctions
+ automatic focus is set to both username textfield when loaded, as well as the room lobbyname textfield once that has been loaded
+ if a user left the room - the other user connected to the same room is informed in the chat
+ when readycheck is successfully completed and game stats - startingplayer is randomized and the available boardpieces are visually added to the interface
+ when game have started a realtime countdown clock is shown for the user whos turn it is
+ after every move made, checkWin is called to see if a Win has occurred
+ after every move made, visual representation of players boardPieces is also updated
+ on win - the winning cells are specially visually marked - if 2 rows when win - both cell lines are marked
+ canvas is only clickable when it is users turn
+ if turn timer runs out - user forfeits his turn and it passes to the other player
+ if boardPieces run out and yet no winner a draw is declared
+ a draw is also declared if all pieces have been used on the board but still no win
+ to avoid "jumpy" interface for users in a room, once turn timer clock has been loaded once, it will maintain its interface size occupation and only be visibility: hidden, instead of display: none via .hide()
+ on gameover game room is completely erased but players that played the game get updated winstatistics
+ server.js doesnt only load index.html but also statically loads all files in the project directory (many files of which are used by the index.html)
+ Application uses LESS for styles and jQuery for more 'efficient' use of JavaScript (personal opinion + shows whats been learned throughout the course in general)
+ a complete reference list has been compiled for everything used to answer questions, or simple references used to refresh memory, as well as simulators and special code sharing sites/tools used throughout the entirety of the development process
+ JSDOC commenting style have been applied for all functions - and project has been well-documented in general
+ repeated use of similiar logic/functionality has been compressed into reusable functions to ease the code as well as to make it more efficient
+ socket.io Multiple room functionality is used (obviously)
+ users alternate between 2 types of rooms - game rooms and default room (connected) - helps with the maintenance and update of interface information for individual connected- and registered sockets
+ chat has a built-in feature to auto-scroll down to the latest typed message in the chatbox
+ Clientside disconnect detection which will "update page" on connection break - causing the application to "restart" in interface to match the data-reset that occured if/when node was restarted.
+ Both username registration and lobbyname registration got Anti-nameclash-feature that avoids duplicates of the same name.
+ Game room chat feature have user textColor embedding, if client is typing, hes doing so in black textcolor, whilst if other connected socket is typing, his text is displayed with blue textcolor.
+ added textcolor for users in chat to distinguish between them.
+ 22mar18: Added JS clientside manipulation countermeasures for form actions to ensure as much as possible that users actually follow the set out path.
+ added HTML sanitization on serverside everywhere I could find that form data was received and used for taking action.

##Features currently being worked on
+ Have node.js run "forever" even with terminal shut down, also have it auto instant restart upon potential crash and have it add error message to a logfile if there is a crash
+ If a user (not the one that created the room) leaves by leave button, "reset" game room for the creator that is still left inside the room - reset all room variables and remove all room-related vars from client that left the room
+ Confirm that 2 users is Maxlimit to be joined in a room, even if 2 users simultaneously press "join" at the same time for example
+ Validate code using JSLint/ESLint
+ Fix so that Node.js crash and then restart, doesnt fuck everything up - but instead "resets" users that was connected **before** the Node.js crashed...


##Features explored but was found not suited
+ Considered using HTML5 Web Workers for dealing with task such as background updating roomlist - but turned out this was not possible due to the fact that HTML5 Web Workers don't support manipulation of DOM elements.
+ consider and look into replacing var with let for variable declaration - Will stick with my var, since I am basing my project on EcmaScript 5 at this time and let seem to be part of ES6
+ Considered loading JS files via Require, found this to be too much of a hassle for this particular project (lack of time to invest figuring it all out and making it efficient)
+ Application is prepared to give punishment for chat spamming , but chosen not to implement due to not wanting to punish my visitors for now.

------------

##Future possible enhancements/improvements/additional features
+ realtime "amount of characters" validation for username registration & roomname selection
+ adding namespace to separate "info updates" in chat from chat messages - know how to do it, and could easily do it, but lack of time has left me not doing it yet
+ rename our #chat to #gameRoom to be more accurate in depiction (right word used?)
+ "Handshake-feature" when readycheck is complete instead of auto-randomize startingplayer - where players visually get to "coin toss" for who gets to start - would be pretty neat feature to have
+ Make an "educational chart" mapping all eventdriven actions taken with arrows and client block/server block and specific events on each block to see how the communication passes back and forth - aka visual aid as it were
+ fix FontAwesome for Lock icon to make it stylishable (future potential extra)
+ Adapt web application project for Touch devices and Responsive design so mobile devices also can enjoy it (huge time investment to fix probably)
+ Possibly see if I can fix so user session is remembered despite disconnect ? "Pick up where left off" - might not be as implicable for me in this case, as if it was only chat rooms, now its game rooms as well...
+ Doublecheck if swedish characters affect anything like joining of room, leaving room, reconnecting room etc.
+ Extend the project to support more "mini-games" and not _only_ TicTacToe, but maybe also sinking ships, rock-paper-scissor, etc. and have players select what game room type* they wish to have when creating new rooms :)
+ Could add persistent storage and profiles to registered users so that games won, avg game time, their usernames, total games, etc. is remembered - together with a "proper" login/new here-registration approach once entering the site, instead of just username registration - but not looking for this at the moment though.
+ Fix proper 404 page on disconnect served up via Express - un-manipulateble by client