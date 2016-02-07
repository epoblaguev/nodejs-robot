// Set things up.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var streamProcess;
app.use('/', express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
var sockets = {};

//For Robot
var five = require("johnny-five");
var board = new five.Board();

// Runs when Arduino connects.
board.on("ready", function() {
  // Replace this with your arduino and motor setup.
  var configs = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V1;
  var right1 = new five.Motor(configs.M1);
  var right2 = new five.Motor(configs.M2);
  var left1 = new five.Motor(configs.M3);
  var left2 = new five.Motor(configs.M4);

  io.on('connection', function(socket) {
    sockets[socket.id] = socket;
    console.log("Total clients connected : ", Object.keys(sockets).length);
    socket.on('disconnect', function() {
      delete sockets[socket.id];
      // no more sockets, kill the stream
      if (Object.keys(sockets).length == 0) {
        if (streamProcess) streamProcess.kill();
      }
    });
    socket.on('start-stream', function() {
      startStreaming();
    });
    socket.on('stop-stream', function(){
      stopStreaming();
    });
    socket.on('say-massage',function(message){
      sayMessage(message);
    });

    socket.on('changeTrackState',function(leftYVal,rightYVal){
      /*
      * Constant, maximum speed is set as it works best for cheap brush motors.
      * This can be modified for different motors to set variable speed based on
      * rightYVal and leftYVal.
      */
      var speed=255;
      if(leftYVal>0){
        left1.forward(speed);
        left2.forward(speed);
      } else if(leftYVal<0){
        left1.reverse(speed);
        left2.reverse(speed);
      } else{
        left1.stop();
        left2.stop();
      }

      if(rightYVal>0){
        right1.forward(speed);
        right2.forward(speed);
      } else if(rightYVal<0){
        right1.reverse(speed);
        right2.reverse(speed);
      } else{
        right1.stop();
        right2.stop();
      }
    })
  });

});

//Listen on port 3000
http.listen(3000, function() {
  console.log('listening on *:3000');
});

/*
* Say a message. Works if text-to-speech software is installed on the
* Raspberry PI and a speaker is connected.
*/
function sayMessage(message){
  console.log("Say Message:"+message);
  var args = [message];
  //spawn("espeak",args);
  io.sockets.emit("returnMessage",message);
}

//Stops the streaming process.
function stopStreaming() {
  console.log("Stopping stream...");
  if (streamProcess) streamProcess.kill();
}

//Start stream if no stream exists.
function startStreaming() {
  if(!streamProcess){
    var args = ["captureImages.py"];
    streamProcess = spawn('python', args);
    console.log('Started Stream');
  }
}
