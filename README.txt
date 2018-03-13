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
<b> mark username and roomname when user joins a room
switch focus to #m once joining room
when logged in --- focus lobbyname form field!


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