/**
 *	Helpers and tools to ease your JavaScript day.
 *
 *	@author Trekka12
 */
window.Trekka12 = (function(window, document, undefined ) {
	var Trekka12 = {};
	
	/**
	 *	Useful functions already existing in JS:
	 *	Math.floor(nmbr)
	 *	parseInt("nmbr")
	 *	Math.round(nmbr)
	 *	nmbr.toFixed(amountOfDecimals)
	 *
	 *
	 *
	 *
	 */
	 
	 /**
	 *	Generates random integer number between min and max
	 *	@param min - minimum value to randomize with
	 *	@param max - maximum value to randomize with
	 */
	Trekka12.random = function (min, max) { //random(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	//inspired from: https://codehandbook.org/how-to-remove-duplicates-from-javascript-array/
	Trekka12.removeDuplicatesFromArray = function (array) {
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
	
	
	
	//generate timeDiff of 2 datetime .now() nmbrs
	
	//getArrayElementIndex of specific item in array
	
	//regex patterns for recognizing strings WITHOUT whitespace
	//- and strings INCL whitespace?
	
	
});