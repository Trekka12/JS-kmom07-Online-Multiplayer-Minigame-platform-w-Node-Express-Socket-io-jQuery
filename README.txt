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


Shit that can be added in future: real-time form validation - telling how many chars is left for choosing username and lobbyname in realtime ?

rename #chat to #gameRoom later ? possibly
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