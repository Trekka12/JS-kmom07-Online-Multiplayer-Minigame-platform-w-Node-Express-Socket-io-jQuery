# TicTacToe (& minigames) online Multiplayer gaming portal project for JS @ BTH, by: Trekka12
## A Node.js, Express.js and Socket.io web application to utilize realtime multiplaying capabilities of the modern web with simpler mini-games

## Presentation
This project is a combination of many various parts as you can read in the headline. It has combined a realtime socket.io chat with some quality-of-life features together with the socket.io multi-room functionality, HTML5 canvas and Express.js with Node.js for WebApp/JS server to be able to create an Online Multiplayer realtime minigame portal where people can enter to play with strangers or friends during downtime. 

Password protection for game rooms help to restrict access to rooms from random people so that friends can play together easily.

This project was mainly meant as a learning experience and to get familiar with the various areas: Node, Express, Socket.io and how modern realtime web works (even explored HTML5 Web Workers and some other (for me) new areas, during this projects development process). 

But I also wanted to create some place online where minigames could be played in realtime together with friends and strangers without having to use Flash like minigame websites usually have been, and have such a place where friends could visit to play easily with one another during breaks or shorter spare times in their everyday lives - and building it initially with room for 1 mini-game, and eventually be able to add more mini-games for variety.

## Project process
I struggled a lot at first to get started with this project, which lead me to "postpone" it a few years because I couldn't understand how I would possibly start, I envisioned exactly how I wanted everything to be, and work and look but I lacked the necessary knowledge and energy truth be told, and idea of approach to get started and making it work.

After a few years though, I decided to get started again, this time I also struggled quite a bit at first, but then I decided to separate the project into "smaller pieces" or "units" as some might call them(?), where I divided the code I needed for the entirety of the project into a few groups that I needed to figure out and master before I could put everything together. This probably also helped minimize development time, as well as debugging efforts throughout the entire project - since it allowed me to focus on specific smaller areas, instead of having to step-through the massive interface just to reach the problemarea. 

I also put up a personal deadline for this project of a months time to help me keep motivated and productive and driven towards that goal.

The areas I decided to divide my project into were the following:
- Canvas, graphics and Tic Tac Toe specific graphics as well as basic game logics
- Node.js, Socket.io and Express.js realtime chat application with some additional quality-of-life features
- Node.js, Socket.io and Express.js Multi-room feature - tested on chat rooms

And after having completed all of the above mini-sections and felt confident in understanding each and every one of them, I decided to start the "final product" where everything was to be put together and work in sync with everything and I also started using Git to document the development process of the project - making larger commits when I personally felt I had reached a "checkpoint".

And here we are now...

## Installation, configuration and usage
This project can easily be cloned with Git to then be run via **node server.js** command _(assuming you have a Node server up and running)_.

Port listened to for the node server can be altered at the **end** of _server.js_ file.

Global constant vars that allow for customization have been declared for: _Game turn timer_, _readycheck timer_, _long & short fade time_, _min and max chars for username and lobbyname_ as well as _Regexes used for clientside "validation" of username/lobbyname_ can be found and altered at will at the **top** of _client.js_.

Styles can be easily found and altered from within the **styles.less** file residing in the **css** folder - the style doc is very well documented and structured to easily locate the styles you're looking for.

For further customization options: **gameColors** constant object is also to be found at **top** of _client.js_ file where the hexadec color codes used for the canvas painting procedures can be found and altered. Other constants holding _board side size_ data as well as _game plack info_ can also be found and altered, together with _textStrings_ object constant that holds the text strings to be printed out on canvas throughout the game progressions. _Line thickness_ can also be easily altered here for how **"fat"** X's and O's lines should be.

## Competitor analysis
Compared to similar products on the internet today, my project is focused _(for now)_ on tic tac toe, and will not be of as high focus perhaps on the game itself, but rather on the realtime functionality and interoperability of the various features I have coded to work together to create my endproduct which is a sort of dedicated platform for visitors to play multiple game sessions on and have the site keep score of that particular game as long as session is kept alive.

Other minigame websites are very focused on their games and have other people upload games as well, so visitors then can play these. And on these sites Multiplaying capabilities seem to exist, but they do so _"within"_ the games themselves, and don't seem to exist on the site basis.

A sound majority of these minigame sites I looked into seem to still be favoring **Flash** games, whilst I am using **HTML5 Canvas** for the graphics and Socket.io to communicate the game data in realtime on the actual website/Application.

In a way, for those who are looking for a nice quick game of tic tac toe, with their friends, and do a Best out of 5 or something like that - I believe my product to be superior to a lot of the alternatives that exist out on the web today.

I have made comparison to both **Addictinggames.com** as well as **miniclip.com** minigame portal websites.

Also compared to a site called **papergames.io** that offered Multiplayer capable Tic Tac Toe, and what I found was that their game was very sluggish, the countdown timer was delayed by about 2 seconds per second it was supposedly counting down, they lacked a proper realtime chat for the players facing off at tic tac toe, they had tons of irrelevant _(to the game)_ added features about emojis and stuff, so in comparison to them I both offer a proper chat functionality as well as keeping it clean and fast to play tic tac toe with friends.

Found another canvas based tic tac toe game site where you could play vs AI called **novelgames.com** - the graphics were not as straight forward as on my project, and there was a super annoying background music as well.

Also found **bejofo.net/ttt** which offered a neat functionality which I myself had considered attempting to implement in the future - namely have a randomized link be generated with a created game to then be able to send as a link directly to the player you wish to play with.

**In summary:** compared to many of the competitor out there, my product seem to be a lot cleaner, and faster than the alternatives both graphic-wise and feature-wise.

## Known bugs (after some usertesting)
Developing this project I have tried to predict as many possible scenarios as I could of how users might act and behave, to be able to deal with each scenario properly, unfortunately there are still some unusual bugs and errors that appear from time to time resulting in server crash, most likely this is due to me not having forseen that particular scenario.
+ One of these bugs was recently discovered by people I had testing the application, and was when a game had been finished and "ending game procedure" had been set in motion, one client got "kicked" from the room before the other one and closed down the app tab causing a server crash due to that clients information being used to "kick" the other client from the same room, and thereby causing a server malfunction due to lack of info required for certain actions to be taken.
+ Another one also discovered by people I had testing this application was that at random times it seems like the server "forgets" data from registration of some users, having them enter a game room to play a game where the server cant find the room, even though it should exist, and thereby leading up to after readycheck having been completed and its time for starting player to make a move - server crashes due to server attempting to do actions to a room it cannot find. Neither me or my testing users have at this point in time (6th of April 2018) any idea where to start looking for a cause for this error and bug, so all I can do is inform that it exists and may occur due to (as for now) unknown circumstances.

##App hosting
App is currently being hosted with Heroku cloud app hosting service - I will pay a fee to have it run continuously during teacher-review period for when handing it in.
Although it could be tested also by cloning from GitHub and running it locally if Heroku should be down or the like.

## Current Features
### Application, interface and core functionality:
+ Username registration _(including swedish chars)_
+ Ability to create "game rooms" _(room names also allow swedish characters)_
+ Ability to join created "game rooms"
+ Rooms can also be created with a password to **"lock"** the room and require login to join the room _(useful if 2 users that know each other wish to play together)_
+ Readycheck feature when 2 people join a room
+ If/when 2 people Accept readycheck, game randomizes starting player and starts game
+ When win detected, win is painted for winner, lose for loser, game is concluded and both players will be returned to mainscreen within 10seconds
+ A draw is also declared if all pieces have been used on the board but still no win
--------------------------
#### Interface details:
+ Username is length restricted and use RegEx to validate for and only allow **a-zA-Z0-9 + swedish characters** but **NO whitespace** characters
+ Roomname is also length restricted and also use RegEx to validate for same as username BUT **Allows whitespace** in the name
+ Interface shows _"status messages"_ for user when username is not complying with limitations set (same for roomname)
+ Rooms have a **Leave room button** for convenience and user friendliness
+ Readycheck has a HTML5 progressbar it progressively fills up every second where **100% = amount of seconds** readycheck lasts
+ Roomlogin form that appears when trying to join PW protected rooms can be escaped with the push of a button to return to roomlist if one changes mind of joining the PW protected room
+ Upon creating a room - that user gets catapulted _automatically_ to join the room (no need to enter PW if PW protected room was created obviously since it was the creator catapulted into it)
+ If a user leaves the room - the other user connected to the same room is informed in the chat that his counterpart left
+ When game have started a **realtime countdown clock** is shown for the user- whos turn it is
+ After every move made, visual representation of players boardPieces is also updated
+ If turn timer runs out - user **forfeits his turn** and it passes to the other player
+ On gameover: game room is completely erased and players that played the game get **updated gamestatistics** and gets kicked back to mainpage within 10s
+ Clientside disconnect detection which will "update page" on connection break - causing the application to "restart" in interface to match the data-reset that occured if/when node was restarted.
--------------------------
#### Chat:
+ Ability to socket.io realtime chat within "game rooms"
+ Ability to see when someone is typing in a "game room"
+ Timestamped chat messages (toLocaleString used)
+ User chat messages are colored blue for opponent, black for the user
+ Chat have "special features" - one is to type command **/changeNick** to **change username**, the other is to press _"ARROW_UP"_ to **recreate last typed message** _(including command)_
+ Chat is also equipped with **Anti-Spam** feature that won't allow messages within **500ms** of each other _(and is prepared for implementing time delay punishment if anyone in future would like to add such an additional feature)_
+ Chat has a built-in feature to **auto-scroll** down to the **latest typed message** in the chatbox _(Quality of life)_
--------------------------
#### Quality of life:
+ Room is temporarily "removed" from roomlist when 2 users have joined it (only 2 users allowed in one room)
+ Roomlist shows created rooms with their designated roomname together with a **Lock-icon** if **PW protected**, as well as "created time ago" feature updated every 15th second
+ Mainscreen (after username registered) shows Game statistics such as Won games, total games, avg game time + total connected players (those who have registered) and players NOT in room currently
+ Automatic focus is set to both **username** textfield when loaded, as well as the room **lobbyname** textfield once that has been loaded
--------------------------
#### Code & Dev:
+ Application uses **Modernizr** for feature detection and **YepNope** for Polyfill compensation
+ Application is prepared for Touch event as alternative to Mouseclick - _not tested yet_ though, but code base for it is there and applied to project
+ Useful reusable functions used by client.js or server.js are placed within **projectFunctions.js** and exported to server.js via _exports_ and _modules_ to keep client.js and server.js as _"clean"_ as possible
+ Roomlist keeps track of selected options even beyond the updating of "created time ago" feature
+ No response on readycheck for person creating the room results in **room getting deleted** and all users in it **kicked out**, while No response from the user that did not create the room results in ONLY that user getting kicked out of the room
+ If Readycheck timer runs out this is equivalent to a **No response** on the readycheck - readycheck timer is set to **30seconds**
+ TimerID tracking variables are declared globally for easier clearing of them throughout the interface
+ Semantic constants are declared to help ease the understanding of the code
+ When readycheck is successfully completed and game stats - **startingplayer is randomized** and the available boardpieces are **visually added** to the interface
+ After every move made, checkWin is called to see if a Win has occurred
+ On win - the winning cells are specially visually marked - if 2 rows when win - **both cell lines** are marked
+ Canvas is only clickable when it is users turn
+ To avoid "jumpy" interface for users in a room, once turn timer clock has been loaded once, it will maintain its interface size occupation and only be visibility: hidden, instead of display: none via .hide()
+ Server.js doesnt only load index.html but also statically loads **all files in the project directory** (many files of which are used by the index.html)
+ Application uses **LESS** for styles and mostly **jQuery** for more 'efficient' use of JavaScript _(personal opinion + shows whats been learned throughout the course in general)_
+ Repeated use of similiar logic/functionality has been compressed into reusable functions to ease the code as well as to make it more efficient
+ Socket.io Multiple room functionality is used (obviously)
+ Users alternate between 2 types of rooms - **game rooms** and **default room** _(connected)_ - helps with the maintenance and update of interface information for individual connected- and registered sockets
+ Both username registration and lobbyname registration got **Anti-nameclash-feature** that avoids duplicates of the same name.
+ 22mar18: Added JS clientside manipulation countermeasures for form actions to ensure as much as possible that users actually follow the set out path.
+ Added HTML sanitization on serverside everywhere I could find that form data was received and used for taking action.
+ If a user (not the one that created the room) leaves by leave button, "reset" game room for the creator that is still left inside the room - reset all room variables and remove all room-related vars from client that left the room
+ Fixed so that in case of a Node.js crash a (somewhat) "pleasant" info screen is displayed and when node.js is back up and running, connected clients will automatically reconnect and be "reset" data-wise, doesnt much everything up
--------------------------
#### Miscellaneous
+ A complete reference list has been compiled for everything used to answer questions, or simple references used to refresh memory, as well as simulators and special code sharing sites/tools used throughout the entirety of the development process
+ JSDOC commenting style have been applied for all functions - and project has been well-documented in general


## Features currently being worked on
+ Have node.js run "forever" even with terminal shut down, also have it auto instant restart upon potential crash and have it add error message to a logfile if there is a crash
+ Confirm that 2 users is Maxlimit to be joined in a room, even if 2 users simultaneously press "join" at the same time for example


## Features explored but was found not suited
+ Considered using HTML5 Web Workers for dealing with task such as background updating roomlist - but turned out this was not possible due to the fact that HTML5 Web Workers don't support manipulation of DOM elements.
+ consider and look into replacing var with let for variable declaration - Will stick with my var, since I am basing my project on EcmaScript 5 at this time and let seem to be part of ES6
+ Considered loading JS files via Require, found this to be too much of a hassle for this particular project (lack of time to invest figuring it all out and making it efficient)
+ Application is prepared to give punishment for chat spamming , but chosen not to implement due to not wanting to punish my visitors for now.
+ Also explored implementing Artificial Intelligence to be an option users could choose to play against, although this kind of would defeat the entire purpose of my application to have it be Multiplayer - but I also understand the appeal of having it since otherwise people may risk wait times etc. in lack of page visitors- that is unless they bring their own friends :) Another thing that made me choose NOT to have AI was the fact that (e.g. minimax AI), always Won or made the game into draw, which would be quite tiresome.
+ Validate code using JSLint/ESLint (have not done this from the start of the project, which in retrospect I should've - so chosen it was too late now, but know for future projects to use these during development much more frequently and vigilant)

--------------------------

## Future possible enhancements/improvements/additional features
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
+ Also fix feature to generate links of specific created rooms that can be shared with friends you wish to invite to PW protected rooms, so they instantly can join those rooms - would also be quite a neat feature to have.
+ Fix proper 404 page on disconnect served up via Express - un-manipulateble by client
+ Maybe also adjust interface to be more "segmented" so that not all interface components are in one index.html but maybe instead use Express to have it reach across multiple .html files, so that URL's can be used for rooms etc. perhaps. Also implement EJS/Jade templating engine to work with Express for easier HTML coding