var exports = exports || {}; //thank you earendel from ##javascript @ IRC

function appendDatedMsg(el, str) {
			var date = new Date();
			el.append($('<li>').append(date.toLocaleTimeString() + " | " + str));
}

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
function drawBackground(ctx, w, h, color) {
	ctx.clearRect(0,0,w,h);
	ctx.fillStyle = color;
	ctx.fillRect(0,0,w,h);
}

function resetGameGraphics(ctx, canvasWidth, canvasHeight, gameColors, plackMarginLeft, plackInfo, tttBoardMarginLeft, tttBoardMarginTop, boardSide) {
	//repaint background, plack (no text or with text?), and base foundation no pieces added to TTTBoard
	
	drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
	
	paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo);
	
	drawTTTBoard(ctx, gameColors, tttBoardMarginLeft, tttBoardMarginTop, boardSide);
}

function resetLineWidth(ctx) {
	ctx.lineWidth = 1;
}

function drawMoves(movesArray, ctx, XOLineThickness, gameColors, cellPos, cellSide) {
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
}

//what is it that checkWin does --- I need somehow to paint all cells BUT win cells then paint Win Cells...

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

function paintMarkedCell(ctx, cellNmbr, gameColors, cellPos, cellSide) {
	ctx.fillStyle = gameColors.markedCellColor;
	ctx.fillRect(cellPos[cellNmbr].x+1, cellPos[cellNmbr].y+1, cellSide-2, cellSide-2);
}

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

/*
=================================================================
					Canvas game funcs
=================================================================
*/
function paintGameInfoPlack(ctx, gameColors, plackMarginLeft, plackInfo) {
	
	ctx.fillStyle = gameColors.plackColor;

	ctx.fillRect(plackMarginLeft, plackInfo.marginTop, plackInfo.width, plackInfo.height);
}

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

function drawTicTacToeGamescene() {
	drawBackground(ctx, canvasWidth, canvasHeight, gameColors.bgColor);
	
	paintGameInfoPlack();
	
	drawPlackText(textStrings.wfo, plackInfo.fontSize);
	
	drawTTTBoard();
	
	//adapting event listener based off on mobile or desktop
	var eventName = Modernizr.touch ? 'touchstart' : 'click';
	console.log("eventName: ", eventName);
	
	canvas.on(eventName, function(e) {
		e.preventDefault();
		
		var position = getPosition(e);
		//this gives us local coordiantes which consider (0,0) origin at to-left of canvas element
		
		console.log("canvas click/touch detected at pos: ", position);
			
		var cellHit = hitZoneDetection(position.x, position.y);
		
		for(var i = 1; i <= 9; i++)
		{
			if(cellHit == i)
			{
				boardGrid[i-1] = 1;
			}
		}
		
		if(cellHit != -1) //we don't want a paint action to occur if no hitzone is to be painted
		{
			paintXO("x", cellHit);
			
			var winstats = checkWin();
			//winstats == winComboArray
			for(var i = 0; i < winstats.length; i++)
			{
				console.log("winstats:", winstats[i]);
			}
			
			if(winstats[0].player != 0) //if a winner exist
			{
				//atm this ONLY paints the win, meaning other selected pieces wont get painted also... need to fix this.. Only winpieces is to be painted marked, rest is to be painted normal.
				resetGameGraphics();
				drawPlackText(textStrings.uwin, plackInfo.fontSize);
				
				//calculate all winpieces cellnmbrs - ONLY if more than 1 win
				
				var uniqueWinCells; //store the unique ones that will need repainting (if 2 rows complete at win = 1 common cell)
				if(winstats.length > 1) //if more than 1 completed row at win
				{
					var winCellNmbrs = [];
					for(var i = 0; i < winstats.length; i++) //for every winrow
					{
						winCellNmbrs[i] = winCombos[winstats[i].wincombo]; //fetch wincells per row
					}
					console.log("winCellNmbrs[0]: ", winCellNmbrs[0]);
					console.log("winCellNmbrs[1]: ", winCellNmbrs[1]);
					
					
					//once we got all the cellNmbrs in 2 arrays within winCellNmbrs, somehow merge and delete duplicates
					//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
					var winCellNmbrsConcat;
					
					if(winstats.length == 2)
					{
						winCellNmbrsConcat = winCellNmbrs[0].concat(winCellNmbrs[1]); //merge these two win rows
					}else if(winstats.length == 3)
					{
						winCellNmbrsConcat = winCellNmbrs[0].concat(winCellNmbrs[1], winCellNmbrs[2]); //merge these two win rows
					}
					console.log("length of concatenated winCellNmbrs arrays: " + winCellNmbrsConcat.length);
					
					for(var i = 0; i < winCellNmbrsConcat.length; i++) 
					{
						console.log("Iterated winCellNmbrs " + i + ": " + winCellNmbrsConcat[i]);
					}
					
					uniqueWinCells = removeDuplicatesFromArray(winCellNmbrsConcat); //remove duplicate (common) cells from win rows
					console.log("uniqueWinCells: ", uniqueWinCells);
					
				}else {
					uniqueWinCells = winCombos[winstats[0].wincombo]; //fetch wincells per row
					
					console.log("single row wincell nmbrs: ", uniqueWinCells);
				}
				//we want to redraw the win pieces as marked cells here.. start by drawing what is not part of the win I think I figured:
				
				drawPiecesExceptWinPieces(uniqueWinCells);
				
				drawMultipleCells(uniqueWinCells);
			}
		}
		
		return false;
	});
	
}

/*
=================================================================
					Game logics funcs
=================================================================
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


function randomize(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
}

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