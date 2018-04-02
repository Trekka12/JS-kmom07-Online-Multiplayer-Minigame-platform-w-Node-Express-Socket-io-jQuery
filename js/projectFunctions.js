var exports = exports || {}; //thank you earendel from ##javascript @ IRC

/**
 *	Adds a dated message via jQuery .append method for <li> element to a chat <ul>
 *	@param (elementObject)	el	- The element to append the message to (our chat)
 *	@param (string)			str	- The string (message) to append with a <li> to chat <ul>
 */
function appendDatedMsg(el, str) {
			var date = new Date();
			el.append($('<li>').append(date.toLocaleTimeString() + " | " + str));
}

/**
 *	Calculates and prepares presentation for time difference in string specific string format between a point in time (inparam) and now
 *	@param (number) createdtime - Date.now() generated number to get time diff with
 *	@return (string) createdStr - String presentation of the calculated time difference
 */
function getTimeDiffString(createdtime) {
	var now = Date.now();
	var timeDiff = now - createdtime;
	console.log("timeDiff: ", timeDiff);
	var secs = Math.floor(timeDiff/1000);
	console.log("secs = ", secs);
	var mins = 0; 
	var hour = 0;
	
	if(secs >= 60 && secs < 3600)
	{
		
		mins = Math.floor(secs / 60);
		secs = secs % 60;
		console.log("when a minute or more mins, secs = " + secs + ", and mins = " + mins);
		
	}else if(secs >= 3600)
	{
		hour = Math.floor(secs / 3600);
		mins = Math.floor((secs % 3600) / 60);
		secs = Math.floor((secs % 3600) % 60);
	}
	
	console.log("hour, mins, secs: " + hour + ", " + mins + ", " + secs);
	var createdStr = "";
	if(secs < 1 && mins == 0)
	{
		createdStr = "a few seconds";
	}else if(secs == 1 && mins == 0)
	{
		createdStr = "1 second";
	}else if(secs > 1 && secs < 60 && mins == 0)
	{
		createdStr = secs + " seconds";
	}else if(mins == 1 && secs == 0)
	{
		createdStr = "1 minute";
	}else if(mins >= 1 && mins < 60)
	{
		console.log("inside of more than 1 minute...");
		createdStr = mins + " minutes";
		if(secs > 0 && secs < 60)
		{
			createdStr += " and " + secs + " seconds";
		}
	}else if(hour >= 1)
	{
		createdStr = hour + " hours, " + mins + " minutes and " + secs + " seconds";
	}
	console.log("timeDiffString: " + createdStr);
	
	return createdStr;
}


/*
=================================================================
					Canvas funcs
=================================================================
*/
/**
 *	Draws background with certain color for a canvas
 *	@param (canvas context) ctx		- The canvas context of where the background is to be painted
 *	@param (number)			w		- The width number of the canvas to be painted
 *	@param (number)			h		- The height number of the canvas to be painted
 *	@param (string)			color	- The color to have the background be painted with 
 */
function drawBackground(ctx, w, h, color) {
	ctx.clearRect(0,0,w,h);
	ctx.fillStyle = color;
	ctx.fillRect(0,0,w,h);
}

/**
 *	Resets game graphics of canvas to a default "reset" stage - in our case clean tictactoe board - no painted pieces, the background color, and the info plack at top
 *	@param (canvas context)	ctx			- The canvas context of where the background is to be painted
 *	@param (number)		canvasWidth		- The width number of the canvas to paint in
 *	@param (number)		canvasHeight	- The height number of the canvas to paint in
 *	@param (JS Object)	gameColors		- A JS Object containing semantic keys with string value pairs for colors used in the application
 *	@param (number)		plackMarginLeft	- SelfExplanatory variable name I think
 *	@param (JS Object)	plackInfo		- JS object containing measurements, and other related information data to info plack to be painted in canvas
 *	@param (number)	 tttBoardMarginLeft	- The number for tictactoe boards margin left
 *	@param (number)	 tttBoardMarginTop	- The number for tictactoe boards margin top
 *	@param (number)		boardSide		- The width number for squared board side
 */
function resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide) {
	//repaint background, plack (no text or with text?), and base foundation no pieces added to TTTBoard
	
	drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
	
	paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo);
	
	drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
}

/**
 *	Felt easier calling resetLineWidth and looked a bit cleaner coding-wise to use compared to calling ctx.lineWidth = 1; multiple times (also allows to alter 1 function if its ever desired to reset to a different line width compared to whats being used now.
 *	@param (canvas context)	ctx		- The canvas context where to reset the line width
 */
function resetLineWidth(ctx) {
	ctx.lineWidth = 1;
}

//removed drawMoves function due to NOT in use

/**
 * 	Helpful to have only 1 function to paint both X's and O's (marked AND unmarked)
 *	@param	(canvas context)	ctx		- The canvas context where to paint the X's and O's
 *	@param	(char string)		xo		- A representative single-character string to tell whats to be painted, if X or O
 *	@param	(number)		cellNmbr	- A number representing the cell number between 1-9 which should be painted
 *	@param	(number)	XOLineThickness	- The line thickness number for the X or O that will be painted
 *	@param	(JS Object)		gameColors	- A JS Object holding all application colors to use for painting
 *	@param	(ref JS object)	cellPos		- A global reference JS Object containing all the X & Y coordinates for each and every tictactoe cell
 *	@param	(number)		cellSide	- The cell square width number
 *	@param	(boolean)	[marked=false]	- A boolean to help determine if the cell in which to paint the X or O should be "marked" meaning white background, or not (marked if win occurred)
 */
function paintXO(ctx, xo, cellNmbr, XOLineThickness, gameColors, cellPos, cellSide, marked = false) {
	//to start out - paint X in first box:
	//will need canvas context, marginleft, canvasWidth, marginTop
	//set lineWidth, and fillStyle of the pieces.. Black & white. very standard.
	//call respective proper paint method from within here whenever its needed (saves us from implementing ctx etc from this method directly - and instead is done indirectly from the paint methods)
	//marked = different bgcolor for the box - overlay box before painting the lines/circle
	//cellpos = 1-9
	console.log("inside of paint xo");
	
	ctx.lineWidth = XOLineThickness;
	
	if(marked)
	{
		//paint a background color square at cellpos
		paintMarkedCell(ctx, cellNmbr, gameColors, cellPos, cellSide);
	}
	
	if(xo === "x")
	{
		//paintX at cellpos
		paintX(ctx, cellNmbr, XOLineThickness, cellPos, cellSide);
		
	}else if(xo === "o") //text comparison in JS is done how?
	{
		//paintO at cellpos
		paintO(ctx, cellNmbr, XOLineThickness, cellPos, cellSide);
		
	}
}

/**
 *	Helper function to paint the marked cells for wins etc
 *	@param (canvas context)		ctx	- The canvas context on which to paint the marked cell
 *	@param (number)		cellNmbr	- The cell number between 1-9 which is to be painted marked
 *	@param (JS Object)	gameColors	- A JS Object that contains all colors used for the application
 *	@param (ref JS Object)	cellPos	- A reference JS Object which holds X & Y Coordinate information about each and every tictactoe cell
 *	@param (number)		cellSide	- The cell width
 */
function paintMarkedCell(ctx, cellNmbr, gameColors, cellPos, cellSide) {
	ctx.fillStyle = gameColors.markedCellColor;
	ctx.fillRect(cellPos[cellNmbr].x+1, cellPos[cellNmbr].y+1, cellSide-2, cellSide-2);
}

/**
 *	The function that paints O's
 *	@param (canvas context)		ctx	- The canvas context the O should be painted to
 *	@param (number)		cellNmbr	- The cell number between 1-9 where the O should be painted
 *	@param (number)	XOLineThickness	- The number representing the width of the Line the O should be painted with
 *	@param (ref JS Object)	cellPos	- A reference JS Object which holds X & Y Coordinate information about each and every tictactoe cell
 *	@param (number)		cellSide	- The cell width
 */
function paintO(ctx, cellNmbr, XOLineThickness, cellPos, cellSide) {
	//boardMargins = {} for dot-notation access to data variables
	//drawCircle for canvas
	ctx.lineWidth = XOLineThickness;
	
	var marginLeft = cellPos[cellNmbr].x;
	var marginTop = cellPos[cellNmbr].y;
	
	ctx.beginPath();
	ctx.arc(marginLeft + cellSide/2, marginTop + cellSide/2, 40, 0, 2 * Math.PI);
	ctx.stroke();
	
	resetLineWidth(ctx);
}

/**
 *	The function that paints X's
 *	@param (canvas context)		ctx	- The canvas context the X should be painted to
 *	@param (number)		cellNmbr	- The cell number between 1-9 where the X should be painted
 *	@param (number)	XOLineThickness	- The number representing the width of the Line the X should be painted with
 *	@param (ref JS Object)	cellPos	- A reference JS Object which holds X & Y Coordinate information about each and every tictactoe cell
 *	@param (number)		cellSide	- The cell width
 */
function paintX(ctx, cellNmbr, XOLineThickness, cellPos, cellSide) {
	
	ctx.lineWidth = XOLineThickness;
	
	var xMargin = 10;
	
	var marginLeft = cellPos[cellNmbr].x;
	var marginTop = cellPos[cellNmbr].y;
	
	ctx.beginPath();
	//First line from top-left to bottom-right corner
	ctx.moveTo(marginLeft + xMargin, marginTop + xMargin);
	ctx.lineTo(marginLeft + cellSide - xMargin, marginTop + cellSide - xMargin);
	
	//Second line from bottom-left to top-right corner
	ctx.moveTo(marginLeft + xMargin, marginTop + cellSide - xMargin);
	ctx.lineTo(marginLeft + cellSide - xMargin, marginTop + xMargin);
	
	
	ctx.stroke();
	
	resetLineWidth(ctx);
}

/**
 *	Paint the game info plack
 *	@param (canvas context)	ctx			- The canvas context of where everything is to be painted
 *	@param (JS Object)	gameColors		- A JS Object containing semantic keys with string value pairs for colors used in the application
 *	@param (number)		plackMarginLeft	- SelfExplanatory variable name I think
 *	@param (JS Object)	plackInfo		- JS object containing measurements, and other related information data to info plack to be painted in canvas
 */
function paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo) {
	
	ctx.fillStyle = gameColors.plackColor;

	ctx.fillRect(plackMarginLeft, plackInfo.marginTop, plackInfo.width, plackInfo.height);
}

/**
 *	Painting the actual text in the game info plack
 *	@param (canvas context)	ctx			- The canvas context of where everything is to be painted
 *	@param (string)		textString		- The text string that should be "written"/painted on the game info plack
 *	@param (number)		plackMarginLeft	- SelfExplanatory variable name I think
 *	@param (JS Object)	plackInfo		- JS object containing measurements, and other related information data to info plack to be painted in canvas
 *	@param (JS Object)	gameColors		- A JS Object containing semantic keys with string value pairs for colors used in the application
 */
function drawPlackText(ctx, textString, plackMarginLeft, plackInfo, gameColors) {
	
	ctx.font = plackInfo.fontSize.toString() + "px " + plackInfo.fontFamily;
	ctx.fillStyle = gameColors.textAndBorderColor;
	
	var textWidth = Math.floor(ctx.measureText(textString).width); //round down
	var textHeight = parseInt(ctx.font)*1.2; //inspired from an answer at: https://stackoverflow.com/questions/1134586/how-can-you-find-the-height-of-text-on-an-html-canvas
	
	//var plackMarginLeft = canvasWidth/2 - plackInfo.width/2; //to center
	
	var marginLeft = plackMarginLeft + plackInfo.width/2 - textWidth/2; //centered
	var marginTop = plackInfo.marginTop + plackInfo.height - textHeight/3; //why divided by 4 works I am not sure of. But seem to do the trick for now at least..
	
	ctx.fillText(textString, marginLeft, marginTop);
	
}

/**
 * 	Painting the Tic Tac Toe gameboard
 *	@param	(canvas context)	ctx		- The canvas context where to paint everything
 *	@param	(JS Object)		gameColors	- A JS Object holding all application colors to use for painting
 *	@param (number)	 tttBoardMarginLeft	- The number for tictactoe boards margin left
 *	@param (number)	 tttBoardMarginTop	- The number for tictactoe boards margin top
 *	@param (number)			boardSide	- The width number for the square board sides
 */
function drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide) {
	//The idea here is to draw the "major" rectangle outline for the three boxes/squares
	//then paint 3x3 rectangles within this one
	//lets get started
	
	//set black outline color
	ctx.fillStyle = gameColors.textAndBorderColor;
	ctx.strokeRect(tttBoardMarginLeft, tttBoardMarginTop, boardSide, boardSide);
	
	
	ctx.fillStyle = gameColors.boardColor;
	ctx.fillRect(tttBoardMarginLeft+1, tttBoardMarginTop+1, boardSide-2, boardSide-2);
	
	//draw the 4 lines to create our 9 boxes
	ctx.beginPath();
	//vertical lines first
	ctx.moveTo(tttBoardMarginLeft + boardSide/3, tttBoardMarginTop);
	ctx.lineTo(tttBoardMarginLeft + boardSide/3, tttBoardMarginTop + boardSide);
	
	ctx.moveTo(tttBoardMarginLeft + boardSide/1.5, tttBoardMarginTop);
	ctx.lineTo(tttBoardMarginLeft + boardSide/1.5, tttBoardMarginTop + boardSide);
	
	//horizontal lines
	ctx.moveTo(tttBoardMarginLeft, tttBoardMarginTop + boardSide/3);
	ctx.lineTo(tttBoardMarginLeft + boardSide, tttBoardMarginTop + boardSide/3);
	
	ctx.moveTo(tttBoardMarginLeft, tttBoardMarginTop + boardSide/1.5);
	ctx.lineTo(tttBoardMarginLeft + boardSide, tttBoardMarginTop + boardSide/1.5);
	
	ctx.stroke();
}

/**
 * 	Helps paint multiple cells easily
 *	@param	(JS Object)		cellNmbrs	- A number representing the cell number between 1-9 which should be painted
 *	@param	(array)			boardGrid	- The array holding moves that have been made in the game - for both players (total moves)
 *	@param	(canvas context)	ctx		- The canvas context where to paint everything
 *	@param	(number)	XOLineThickness	- The line thickness value for the X or O that will be painted
 *	@param	(JS Object)		gameColors	- A JS Object holding all application colors to use for painting
 *	@param	(ref JS object)	cellPos		- A global reference JS Object containing all the X & Y coordinates for each and every tictactoe cell
 *	@param	(number)		cellSide	- The cell square width number
 *	@param	(boolean)	[marked=false]	- A boolean to help determine if the cell in which to paint the X or O should be "marked" meaning white background, or not (marked if win occurred)
 */
function drawMultipleCells(cellNmbrs, boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide, marked = true) {
	console.log("inside of drawMultipleCells function");
	
	for(var i = 0; i < cellNmbrs.length; i++)
	{
		//check the value of the cell in boardGrid to find out pieceType
		var player = boardGrid[cellNmbrs[i]-1];
		var piece = "";
		if(player == 1)
		{
			piece = "o";
			paintXO(ctx, piece, cellNmbrs[i], XOLineThickness, gameColors, cellPos, cellSide, marked);
		}else if(player == -1)
		{
			piece = "x";
			paintXO(ctx, piece, cellNmbrs[i], XOLineThickness, gameColors, cellPos, cellSide, marked);
		}
	}
}

/**
 * 	Helps paint multiple cells easily without cells to be excepted to be painted at a later time with a different function
 *	@param	(array)			winCells	- The array holding the win cell numbers
 *	@param	(array)			boardGrid	- The array holding moves that have been made in the game - for both players (total moves)
 *	@param	(canvas context)	ctx		- The canvas context where to paint everything
 *	@param	(number)	XOLineThickness	- The line thickness value for the X or O that will be painted
 *	@param	(JS Object)		gameColors	- A JS Object holding all application colors to use for painting
 *	@param	(ref JS object)	cellPos		- A global reference JS Object containing all the X & Y coordinates for each and every tictactoe cell
 *	@param	(number)		cellSide	- The cell square width number
 */
function drawPiecesExceptWinPieces(winCells, boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide) {
	//först måste denna få winCombo, sen måste den gå igenom boardGrid och göra en kopia av denne fast utan winPieces, sedan måste vi kalla på drawMultipleCells
	//loop through boardGrid
			
	console.log("winCells: ", winCells);
	
	var cellNmbrs = [];
	var counter = 0;
	var match = false;

	for(var i = 0; i < boardGrid.length; i++)
	{
		//for every single cell, we need to check against out winning cells
		//so imagine this, we loop through our win cells, compare to our actual cell
		//if the cell is not a match to one of the win cell - store as cellNmbr array value
		//after the iteration - we can paint those..
		//every cell must be Either OR a match to win, if it is (true?) store cellnmbr in cellnmbr array, if not, don't?
		console.log("iteration for cellNmbr: " + (i+1));
		
		for(var j = 0; j < winCells.length; j++)
		{
			console.log("wincell iteration for wincell nr: " + j);
			//if its a match
			if((i+1) == winCells[j])
			{
				console.log("wincell-boardGridCell match was found at cell: " + winCells[j]);
				match = true; 
				break;
			}else
			{
				match = false;
			}
		}
		if(!match)
		{
			cellNmbrs[counter] = i+1; //this way cellNmbrs contain what cells to repaint (not wincells) - ofc I only want to repaint the cells that actually hold a mark to paint... how to distinguish this...?
			
			counter += 1;
		}
	}
	
	console.log("Last printout before draw multiple cells, cellNmbrs contain: ", cellNmbrs);
	
	drawMultipleCells(cellNmbrs, boardGrid, ctx, XOLineThickness, gameColors, cellPos, cellSide, false);
	
}

//removed drawTicTacToeGamescene function due to NOT in use

/*
=================================================================
					Game logics funcs
=================================================================
*/
/**
 *	Get position for mouse/touch events
 *	@param	(event object)	e			- The event object that holds all the mouse/touch event data
 *	@param	(JS Object)	canvasPosition	- A JS Object holding the canvas X & Y position
 *	@return	(JS Object)	position		- A JS Object with the proper X & Y coordinates of the touch/click in relation to the canvas
 */
function getPosition(e, canvasPosition) {
	var position = {
		x: null, y: null
	};
	
	if(Modernizr.touch) //global var detecting touch support
	{
		if(e.touches && e.touches.length > 0)
		{
			position.x = e.touches[0].pageX - canvasPosition.x;
			position.y = e.touches[0].pageY - canvasPosition.y;
		}
	}else {
		position.x = e.pageX - canvasPosition.x;
		console.log("position.x (inside of getPosition) = " + position.x);
		position.y = e.pageY - canvasPosition.y;
		console.log("position.y (inside of getPosition) = " + position.y);
	}
	
	return position;
}

/**
 *	Check if a mouse/touch event hit a vital point and return a value for if hit - and if so - where action should be taken
 *	@param	(number)			mx			- Mouse X value
 *	@param	(number)			my			- Mouse Y value
 *	@param	(number)			boardSide	- The board side value
 *	@param	(ref JS Object)		cellPos		- A reference JS Object that holds all cells X and Y positions
 *	@param	(number)	tttBoardMarginLeft	- Tic tac toe boards left margin value
 *	@param	(number)	tttBoardMarginTop	- Tic tac toe boards top margin value
 *	@param	(number)			cellSide	- The cell side value
 *	@param	(array)				boardGrid	- Holds ALL total moves made in a game of Both players
 *	@return	(number)			cellHit		- The number of the cell that was hit
 */
function hitZoneDetection(mx, my, boardSide, cellPos, tttBoardMarginLeft, tttBoardMarginTop, cellSide, boardGrid) {
	//this function will be used to iterate through our hitzones, check our mouse x and mouse y to see what zone it lands in,
	//then return that zone nmbr so that XO can be painted
	var cellHit = -1;
	//only trigger a cellZone check if within the board params, check this first
	if(mx >= tttBoardMarginLeft && mx <= (tttBoardMarginLeft + boardSide) && my >= tttBoardMarginTop && (my <= tttBoardMarginTop + boardSide))
	{
		for(var i = 1; i <= 9; i++)
		{
			if(mx >= cellPos[i].x && mx <= (cellPos[i].x + cellSide) && my >= cellPos[i].y && my <= (cellPos[i].y + cellSide) && boardGrid[i-1] == 0)
			{
				//if all of these are true, its a hit, somehow find out what cellNmbr these coordinates belonged to and return it
				cellHit = i;
				break;
			}else {
				cellHit = -1;
			}
		}
	}else {
		cellHit = -1;
	}
	
	return cellHit;
}

/**
 *	Checks if a win state has been reached - to be called after every move that will be made
 *	@param	(array)	boardGrid		- The array holding ALL total moves made for a game from Both players
 *	@return	(array)	winComboArray	- Holds what player won, also what cells that player won with
 */
function checkWin(boardGrid) {
	//if first three are not 0 and are of same type = win, same with second and third row,
	//same for 1st, 2nd, 3rd vertical rows
	//and for bottomleft-to-topright diagonal and for topleft-to-bottomright diagonal
	//so thats a total of 8 possible win scenarios...
	
	//iterate through boardGrid and check for these combinations - for this must have a var to keep track of 3 pieces connected - if all match, then win
	
	//i could also make 8 different comparison arrays for various winscenarios, and compare the two arrays, might be quicker?
	//for example [111000000] / [-1-1-1000000] = first win - dont think quciker
	
	
	//console.log("inside checkWin function, winCombos.length = " + winCombos.length);
	//two separate for 1 and -1 to give winCombo to proper player array?
	var winComboArray = [];
	var winComboCounter = 0;
	var winner = 0;
	var winCombo = 0;
	//for every wincombo, check what winCombo exist, once found, add to winCombo array, there can only be one type of winner - but i must distinguish from player1 and player2... somehow...
	//console.log("iterating through wincombos");
	
	if((boardGrid[0] == 1 && boardGrid[1] == 1 && boardGrid[2] == 1) || (boardGrid[0] == -1 && boardGrid[1] == -1 && boardGrid[2] == -1))
	{
		//a win for one of the players - check if -1 or 1 to determine what player won
		winner = boardGrid[0];
		winCombo = 1;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
	}
	
	if((boardGrid[3] == 1 && boardGrid[4] == 1 && boardGrid[5] == 1) || (boardGrid[3] == -1 && boardGrid[4] == -1 && boardGrid[5] == -1))
	{
		//a win for one of the players - check -1 or 1 to determine who won
		winner = boardGrid[3];
		winCombo = 2;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
		
	}
	
	if((boardGrid[6] == 1 && boardGrid[7] == 1 && boardGrid[8] == 1) || (boardGrid[6] == -1 && boardGrid[7] == -1 && boardGrid[8] == -1))
	{
		//a win for one of the players - check -1 or 1 to determine who won
		winner = boardGrid[6];
		winCombo = 3;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
		
	//VERTICAL WINS
	}
	
	if((boardGrid[0] == 1 && boardGrid[3] == 1 && boardGrid[6] == 1) || (boardGrid[0] == -1 && boardGrid[3] == -1 && boardGrid[6] == -1))
	{
		winner = boardGrid[0];
		winCombo = 4;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
		
	}
	
	if((boardGrid[1] == 1 && boardGrid[4] == 1 && boardGrid[7] == 1) || (boardGrid[1] == -1 && boardGrid[4] == -1 && boardGrid[7] == -1))
	{
		winner = boardGrid[1];
		winCombo = 5;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
		
	}
	
	if((boardGrid[2] == 1 && boardGrid[5] == 1 && boardGrid[8] == 1) || (boardGrid[2] == -1 && boardGrid[5] == -1 && boardGrid[8] == -1))
	{
		winner = boardGrid[2];
		winCombo = 6;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
		
	//DIAGONAL WINS
	}
	
	if((boardGrid[0] == 1 && boardGrid[4] == 1 && boardGrid[8] == 1) || (boardGrid[0] == -1 && boardGrid[4] == -1 && boardGrid[8] == -1))
	{
		winner = boardGrid[0];
		winCombo = 7;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
		
	}
	
	if((boardGrid[2] == 1 && boardGrid[4] == 1 && boardGrid[6] == 1) || (boardGrid[2] == -1 && boardGrid[4] == -1 && boardGrid[6] == -1))
	{
		winner = boardGrid[2];
		winCombo = 8;
		
		winComboArray[winComboCounter] = {player: winner, wincombo: winCombo};
		winComboCounter++;
	}

	//efter for-satsen, scrolla igenom vår wincombinations array för att se vilka som var true, därefter få ut playern.... ugh...
	
	
	console.log("winComboArrayLength: " + winComboArray.length);
	
	//in case no win, return this...
	if(!(winComboArray.length > 0))
	{
		winComboArray[0] = {player: 0, wincombo: 0};
	}
	
	return winComboArray;
}

/**
 *	Randomization function to get a random value between a min value and a max value
 *	@param	(number)	min	- The min value
 *	@param	(number)	max	- The max value
 *	@return	(number)		- The randomized value between min and max
 */
function randomize(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 *	A useful and handy function to remove duplicate values from arrays
 *	@param	(array)		array		- The array from which to remove duplicate values from
 *	@return	(array)	unique_array	- A new array with only unique values
 */
function removeDuplicatesFromArray(array) {
		var unique_array = [];
		for(var i = 0; i < array.length; i++)
		{
			if(unique_array.indexOf(array[i]) == -1) 
			{
				unique_array.push(array[i]);
			}
		}
		return unique_array;
}



exports.randomize = randomize; //no need to have input vars here, assumed to follow.
exports.checkWin = checkWin;
exports.removeDuplicatesFromArray = removeDuplicatesFromArray;


// to expose what I want to be able to access from server.js
//inspired from: https://stackoverflow.com/questions/5797852/in-node-js-how-do-i-include-functions-from-my-other-files

//https://stackoverflow.com/questions/5625569/include-external-js-file-in-node-js-app
//module.exports.checkWin = checkWin;