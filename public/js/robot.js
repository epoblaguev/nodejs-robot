var gamepadConnected=true;
var oldGamepadTimestamp;
var socket = io();
var controllerLoop;
var cameraLoop;

// Listen for GamePad connection. Start polling gamepad every 100ms.
window.addEventListener("gamepadconnected", function(e) {
	console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",e.gamepad.index, e.gamepad.id,e.gamepad.buttons.length, e.gamepad.axes.length);
	oldGamepadTimestamp=jQuery.extend(true, {}, e.gamepad).timestamp;
	controllerLoop=setInterval(mainPollingFunction,100);
});

// Listen for gamepad disconnecting. Stop polling gamepad.
window.addEventListener("gamepaddisconnected", function(e) {
	console.log("Gamepad disconnected from index %d: %s",e.gamepad.index, e.gamepad.id);
	clearInterval(controllerLoop);
	alert("Gamepad disconnected. Please connect gamepad and press a button.");
});

socket.on("returnMessage",function(message){
	$("#recievedMessage").html(message);
});

// Tries connecting gamepad on startup.
function tryConnectingGamepad(){
	if(navigator.getGamepads()[0]!=undefined){
		oldGamepadTimestamp = jQuery.extend(true,{},navigator.getGamepads()[0]).timestamp;
		controllerLoop=setInterval(mainPollingFunction,200);
	}else{
		alert("Please connect gamepad and press 'A'!");
	}

}

// Send message to NodeJS to start the camera, start polling images.
function startStream() {
	socket.emit('start-stream');
	$('#startCamera').hide();
	$('#stopCamera').show();
	cameraLoop = setInterval(function(){$("#stream").attr("src","/stream/image_stream.jpg?t="+Math.random())},100);
}

// Send message to NodeJS to stop the camera. Stop image polling loop.
function stopStream(){
	socket.emit('stop-stream');
	$('#startCamera').show();
	$('#stopCamera').hide();
	clearInterval(cameraLoop);
}

// Changes the size of the streamed image. Only changes size locally, does not change stream quality.
function zoomImage(zoom){
	$('#stream').animate({height:"+="+zoom.toString()},500,function(){});
}

// Send message to NodeJS that will (maybe) be said via text-to-speech software.
function sendMessage(){
	var message = $("#inputSay").val();
	socket.emit("say-massage", message);
}

// Changes the color of the buttons representing the left and right tracks.
function changeTrackColor(leftYVal, rightYVal){
	var trackLF=$("#TrackL_Forward");
	var trackLN=$("#TrackL_Neutral");
	var trackLB=$("#TrackL_Backward");

	var trackRF=$("#TrackR_Forward");
	var trackRN=$("#TrackR_Neutral");
	var trackRB=$("#TrackR_Backward");

	trackLF.removeClass("label-success").addClass("label-default");
	trackLN.removeClass("label-success").addClass("label-default");
	trackLB.removeClass("label-success").addClass("label-default");

	trackRF.removeClass("label-success").addClass("label-default");
	trackRN.removeClass("label-success").addClass("label-default");
	trackRB.removeClass("label-success").addClass("label-default");

	if(leftYVal>0){
		trackLF.removeClass("label-default").addClass("label-success");
	} else if(leftYVal<0){
		trackLB.removeClass("label-default").addClass("label-success");
	} else{
		trackLN.removeClass("label-default").addClass("label-success");
	}

	if(rightYVal>0){
		trackRF.removeClass("label-default").addClass("label-success");
	} else if(rightYVal<0){
		trackRB.removeClass("label-default").addClass("label-success");
	} else{
		trackRN.removeClass("label-default").addClass("label-success");
	}
}

//The main polling function for the gamepad.
function mainPollingFunction(){
	// Clone the entire gamepad object.
	var gamepad = jQuery.extend(true,{},navigator.getGamepads()[0]);

	// If the gamepad state was updated since the last time it was polled.
	if (gamepad.timestamp != oldGamepadTimestamp) {
		//Left and right joysticks.
		var leftX=0;
		var leftY=1;
		var rightX=2;
		var rightY=3;

		//D-Pad
		var dpadF=12;
		var dpadB=13;
		var dpadL=14;
		var dpadR=15;

		//D-Pad pressed
		var fPressed=gamepad.buttons[dpadF].pressed;
		var bPressed=gamepad.buttons[dpadB].pressed;
		var lPressed=gamepad.buttons[dpadL].pressed;
		var rPressed=gamepad.buttons[dpadR].pressed;

		//Wheel values preset
		var leftYVal = 0;
		var rightYVal = 0;

		// If a key on the d-pad was pressed.
		if(fPressed || bPressed || lPressed || rPressed){
			if(fPressed){
				leftYVal = lPressed ? 0 : 100;
				rightYVal = rPressed ? 0 : 100;
			} else if(bPressed){
				leftYVal = lPressed ? 0 : -100;
				rightYVal = rPressed ? 0 : -100;
			} else if(lPressed || rPressed){
				leftYVal = lPressed ? -100 : 100;
				rightYVal = rPressed ? -100 : 100;
			}
		}
		// If the d-pad wasn't pressed, check the joysticks.
		else {
			leftYVal=Math.floor(gamepad.axes[leftY]*(-100));
			rightYVal=Math.floor(gamepad.axes[rightY]*(-100));

			if(Math.abs(leftYVal)<10) leftYVal=0;
			if(Math.abs(rightYVal)<10) rightYVal=0;

			if(Math.abs(leftYVal)>90) leftYVal=100*Math.sign(leftYVal);
			if(Math.abs(rightYVal)>90) rightYVal=100*Math.sign(rightYVal);
		}
		changeTrackColor(leftYVal,rightYVal);
		socket.emit("changeTrackState",leftYVal,rightYVal);
		oldGamepadTimestamp = gamepad.timestamp;
	};
}
