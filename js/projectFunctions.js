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
	var mins = 0; //= Math.floor(secs/60);
	//console.log("mins = ", mins);
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