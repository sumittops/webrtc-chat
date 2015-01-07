var express = require('express');
var app = express();
var http = require('http').createServer(app).listen(process.env.PORT||3000,function(){
	console.log('Application running on port '+this.address().port);
});
var io = require('socket.io').listen(http);
var userlist = {};
var liveVideoCalls = {};
app.use(express.static(__dirname+'/static/'));
app.get('/',function(req,res){
	res.sendFile(__dirname+'/static/index.html');
});
io.sockets.on('connection',function(socket){
	console.log('A user has connected!');
	socket.on('new user',function(data,callback){
		console.log('user wants to connect as '+data);
		if(data in userlist){
			callback(false);
		}else{
			callback(true);
			socket.username = data;
			userlist[socket.username] = socket;
			updateUserList();
		}
	});
	function updateUserList(){
		io.sockets.emit('users',Object.keys(userlist));
	}
	socket.on('disconnect',function(data){
		if(!socket.username)
			return;
		delete userlist[socket.username];
		updateUserList();
	});
	socket.on('new message',function(data){
		io.sockets.emit('message',{name:socket.username, msg:data});
	});
	
	socket.on('newVideoChatRequest',function(data,callback){
		console.log('Call request from '+data.sender+' to '+data.receiver);
		if(data.receiver in userlist){
			userlist[data.receiver].emit('newVideoCallRequest',{from:data.sender,to:data.receiver},function(res){
				callback(res);
				console.log('Call request from '+data.sender+' to '+data.receiver+' was '+res.reason);
			});
			
		}else{
			callback({response:false,reason:'No such user online.'});
		}
	});
	socket.on('hangup',function(data){
		console.log('User hangup target :'+data);
		io.sockets.emit('hangup',data);
	});
	socket.on('candidate',function(data){
		console.log('candidate call to '+data.targetUser+' with candidate'+data.candidate);
		io.sockets.emit('candidate',data);
	});
	socket.on('offersdp',function(data){
		console.log('offersdp to '+data.targetUser+' with offerSDP'+data.offerSDP);
		io.sockets.emit('offersdp',data);
	});
	socket.on('answersdp',function(data){
		console.log('answersdp to '+data.targetUser+' with answersdp'+data.answerSDP);
		io.sockets.emit('answersdp',data);
	});
});