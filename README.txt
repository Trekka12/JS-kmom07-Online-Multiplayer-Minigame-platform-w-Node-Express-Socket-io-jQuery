#TicTacToe (& minigames) online Multiplayer gaming portal project for JS @ BTH, by: Trekka12
##A Node.js, Express.js and Socket.io web application to utilize realtime multiplaying capabilities of the modern web with simpler mini-games

##Project process
I struggled a lot at first to get started with this project, which lead me to "postpone" it a few years because I couldn't understand how I would possibly start, I envisioned exactly how I wanted everything to be, and work and look but I lacked the necessary knowledge and energy truth be told, and idea of approach to get started and making it work.
After a few years though, I decided to get started again, this time I also struggled quite a bit at first, but then I decided to separate the project into "smaller pieces" or "units" as some might call them(?), where I divided the code I needed for the entirety of the project into a few groups that I needed to figure out and master before I could put everything together. This probably also helped minimize development time, as well as debugging efforts throughout the entire project - since it allowed me to focus on specific smaller areas, instead of having to step-through the massive interface just to reach the problemarea.
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
+ ability to see within "game rooms" when someone is typing
+ timestamped chat messages (toLocaleString used)
+ User chat messages are colored red/blue depending on startingPlayer
+ Readycheck feature when 2 people join a room
+ room is temporarily "removed" from roomlist when 2 users have joined it (only 2 users allowed in one room)
+ Roomlist shows created rooms with their designated roomname, as well as "created time ago" feature updated every 15th
+ Mainscreen (after username register) shows Game statistics such as Won games, total games, avg game time + total connected players (those who have registered) and players NOT in room currently
+ Rooms can also be created with a password to "lock" the room and require login to join the room
+ Username is length restricted and use RegEx to validate for and only allow a-zA-Z0-9 + swedish characters but NO whitespace characters
+ roomname is also length restricted and also use RegEx to validate for same as username BUT Allows whitespace in the name
+ Interface show "status messages" for user for example when username is not complying with limitations set - same for roomname
+ input is escaped using .val()
+ Application uses Modernizr for feature detection and YepNope for Polyfill compensation
+ Application is prepared for Touch event as alternative to Mouseclick - not tested yet though but code base for it is there
+ projectFunctions.js uses module exports to export useful functions to be used within server.js
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
+ semantic constants are declared to help the understanding of the code
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
+ users alternate between 2 types of rooms - game rooms and default room (connected) - helps with the maintenance and update of interface information for individual connected and registered sockets

##Features currently being worked on
+ Have node.js run "forever" even with terminal shut down, also have it auto instant restart upon potential crash and have it add error message to a logfile if there is a crash
+ If a user (not the one that created the room) leaves by leave button, "reset" game room for the creator that is still left inside the room - reset all room variables and remove all room-related vars from client that left the room
+ Confirm that 2 users is Maxlimit to be joined in a room, even if 2 users simultaneously press "join" at the same time for example
+ Validate code using JSLint/ESLint
+ consider and look into loading all JS files for index.html via Require.js
+ consider and look into replacing var with let for variable declaration
+ Fix so that Node.js crash and then restart, doesnt fuck everything up - but instead "resets" users that was connected **before** the Node.js crashed...


##Features explored but was found not suited
+ Considered using HTML5 Web Workers for dealing with task such as background updating roomlist - but turned out this was not possible due to the fact that HTML5 Web Workers don't support manipulation of DOM elements.

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











































To fix in this project now that most of all logic is understood and figured out:
- Setup LESS for CSS rendering
- Setup Require.js for including of JS files
- Setup index.html with all the proper elements and blocks
- Implement Modernizr and YepNope feature detection and polyfill implementation
- Start Gitting the final-stage prj folder and all of its subfolders and files within
- Start NPMing the folder for Socket.io and Express.js with Node
- Format ALL files to NO-BOM
- Setup referenceArchive JS file to be used for general-purpose useful functions that will be used
- Setup projectFunctions.js with project-specific functions to be used (keep server & client "clean")
- Implement CSS-reset by Eric Meyer
- Possibly provide "local" copy of jQuery code to run for stability?
- Implement AwesomeFont for Lock icon?



first commit message: initial interface design (preliminary css styles using LESS), index.html structure and server/client .js files foundation for js kmom07 endproject established.


Implementation steps:
- Username Reg comes first.
- After that it is transition into create/join room section of the interface.
- After that its the joined room readycheck + socket.io chat
- After that its the Game Logic

possibly have on user connect resp. disconnect have broadcast to userList be done and integrate it as part of create/join interface section?


Gå igenom samtlig kod i slutändan för att se exakt vad som används och vad som ej används..
Fixa de sista bitarna med spellogiken etc när alla delarna är sammansatta.

Byta samtliga vars till let vars?

connected users list that users gets added to every time they connect - and remove upon disconnect?
- part of create/join room event

Fix proper endproduct username registration - and conclude proper disconnect

When first user connects to a room - this 'check' needs to be done On room join, to determine if "firstUserJoined" should be set to true for a room --- this in turn is needed because determining user chat text color

Also need to keep track of activeUserNmbr for each and every room - since if 2 people is active in a room --- not only should no1 else be able to join the room, but it should also be TEMPORARILY removed from the lobbylist.

So basically once I got all the parts together in endproduct state, I will go through the motions users will go through, fixing stuff discovered along the way, then once all of that is completed... I will be moving on to implement the actual game logics and graphics... finally, including the readycheck and updating of messages when people enter rooms... test this thoroughly, want it running smoothly.

Ok so this "load existing rooms on connect/page update" thingy, might not be needed - since it will probably happen anyways, since users will have to re-register on page update. We will not be "saving" their state, they will be reset on page update.
What should happen is WHEN user registered nickname successfully, client should be contacted with event to trigger hiding of userreg form and interface section + showing create/join room (+ userlist (+ lobbylist)) - once that is done, it could contact server again to initiate updating of those lobbyrooms (created "x" time ago that is...)


Add the game graphics to the "room" together with the chat ;)

My main concern right now is getting it all to actually work.. Then I gotta write redovisningstexter, and integrate into my Me-sida.



har nu mergat canvas + clientside canvas-relaterade eventhandlers, game paint functions, socket.io chatt, multi-room functionality, username registration, create/join room functionality --- nu börjar det närma sig känns det som :D Bara kvar att fixa så allting verkligen funkar i sync tillsammans (har ju kodat samtliga delar separat tidigare, kräver vissa modifikationer), sen få själva "spelet" att funka när clients väl är inne i rum, och lägga in restriktioner för endproduct så max 2 spelare per rum, rum tas bort fr. lobbylistan när rum är fullt etc :D

- Gå igenom username registration så det funkar proper.
- Gå igenom create/join room functionaliy så det funkar proper.
-- Både för första join, samt andra join
-- Lägg in max 2 player restriction per rum och check för det när join
-- "ta bort" rum från lobbylist när 2 players i ett rum -- broadcasta uppdatering till samtliga när detta sker... ELLER stylistiskt markera att rum är fullt och disabla möjligheten att joina ... tror enklare logic wise att ta bort från lobbylist dock.. remove helt enkelt från roomList --- spara dock i activeRoomList istället så det kan bli återskapat om annan klient än skaparen lämnar rummet.
-- När allt det fixat, fixa inRoom interface looks, samt game paint and game logics, readycheck, moves, etc. Jobba med timers för move-turns osv. Det kmr nog bli det svåraste tbh hm :/



<b> mark username and roomname when user joins a room ---FIXED
switch focus to #m once joining room ---FIXED
when logged in --- focus lobbyname form field! ---FIXED

alternative could be chat "sticky" fixed to right of game graphics -- and simply have it scroll infinitely?

when second user joins a room, readycheck should be initiated somehow... check if both ready -- if they are -- randomize who goes first, give them O pieces, the other player gets X pieces, somewhere in the interface it should be visually shown how many pieces have been placed and how many is left, maybe show a game timer? (extra feature possibly to consider)


Copy an array object over to another array
array2.push(array1[i]) might work? :D

TODOS:
Re-Prioritization:
När ny klient kopplas in, om där finns rum skapat, som INTE är fullt ÄN - ladda in dem i Lobbylistan så dessa klienter kan joina dessa rum!!! ---FIXED

Next up : Fix what happens and should happen on client joining a Room from the roomList!
- Canvas should be .show(), That a user joined should be broadcasted to everyone in the room (in this case the creator -- excluding sender so not to the person that actually joined, he gets his own welcome message either way), canvas should also be painted accordingly, --FIXED

and then the ReadyCheck should be initiated -- meaning that readycheck HTML elements should be shown, and I need to work on adding event handlers for the buttons there on the clientside, also timestamp for when readyCheck was issued need to be remembered and also a timer needs to be issued for 30 seconds to respond to the readycheck ---FIXED 


after that deal with the fallout of server-received responses if there are any that is.. Maybe set timer time to 1 minute so I myself can test the system properly since I need to move between tabs on my own computer...

Deal with event on clientside: "client joined room" - append message to messages for the other client in the room. ---FIXED

"trigger client readycheck for room" -- emitted from client joins room -- deal with it on serverside - send back event to all in room to initiate a readycheck! update interface accordingly etc.

remember to hide canvas mouseclick listeners until readycheck is over.

when client joins a room --- check so that the activeUsersInRoom DONT exceed 2 people. ALSO Hide from roomlist INSTANTLY when a client joins... (instant update of interface) ---FIXED

FCK - Fix PW joining of room - so the logic is same as for Non-PW rooms!

Swedish chars not allowed in lobbyname selection hm... well thats fine I think

remove existing timers if there are any for when client joins a room!

L:560 creator joins room
L:590 = client joins room




for client connecting when rooms exist already --- update of roomlist should be instantaneous. not 15s delayed... THEN the update should commence AFTER that fact.


style the readyCheckForm and readycheck div have it position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background-color. rgba(0,0,0,0.9); margin: 0 auto; 
Style the buttons and possibly even the label...

socket.on('readycheck') clientside show the readycheck form
add readycheck button on('click') event handlers and onclick report to server with emit events "readycheck vote" with different values ofc. on serverside deal with it




In the near-distant future - fix functionality so that node.js can run forever basically, and also recover in case of a crash... however I do this  --- need to figure that out as well hm...

consider this: if a user creates a room, and thereby joins, then instantly leaves at the same time that another user connects/tries to connect to the same room in the list - on creator disconnect the room would disappear, so how would this play out hm...???





codeArt - showing people with illustrations and text how stuff is created with code on the web - for example show a plain and simple TicTacToe game board and then note all the functions used and how every detail in the picture is created :o Idea for future.


Mark the actual user in a userlist once connected for itself?
- broadcast to all within connected room if user joins io.in('connected').broadcast.emit ;)


Steps in the process:
User visits website. User registers nickname.
User gets to Create/Join rooms. if create - users also enters room.
If user instead decides to join someone elses already created room - activeUserNmbrInRoom should increment by +1, roomActive should also be set to true (together with what room the user is in somehow)






Future project: when developing - have editor exract globally defined variables, constants, and functions accessible - to have accessible 24-7 whilst coding, would help Soooo much!


After all is done and fixed... Integrate into BTH studentwebb.. AND write redovisningstext..






--- FINAL FINAL stage is to implement to Me-sida @ BTH.
---- AND publish Git directory to GitHub for Trekka12.