$(document).ready(function(){
			var socket = io.connect();
			var $chatWrap = $('#chatWrap');
			var $loginWrap = $('#loginWrap');
			var $loginForm = $('#loginForm');
			var $chatForm = $('#chatBox');
			var $msg = $('#message');
			var $username = $('#name');
			var $chatScoll = $('#chatScroll').find('ul');
			var self;
			$loginForm.on('submit',function(e){
				e.preventDefault();
				$newUser = $username.val();
				self = $newUser;
				console.log('want to connect as '+$newUser);
				if($newUser != ''){
					$(this).disabled = true;
					socket.emit('new user',$newUser,function(data){
						if(data){
							$chatWrap.slideDown();
							$loginWrap.slideUp();
							$('#title').html('ChatApp v0.0.2 - Welcome, '+$newUser);
							$username.val('');
						}else{
							$('#loginMsg').html('Sorry! A user by that name already exists. Try some other name.');
						}
					});
				}else{
						$('#loginMsg').html('Please enter a valid username to connect.');
						$(this).disabled = false;
				}
			});
			$chatForm.on('submit',function(e){
				e.preventDefault();
				var msg = $('#message').val();
				if(msg!='')
					socket.emit('new message',msg);
				$('#message').val('');
			});
			socket.on('users',function(data){
				var listHtml = '';
				for(i=0;i<data.length;i++){
					listHtml += '<li>'+data[i]+'</li>';
				}
				$('#userList').html(listHtml);
			});
			socket.on('message',function(data){
				$('#chatScroll>ul').prepend('<li><b>'+data.name+': </b>'+data.msg+'</li>');
			});
//CODE FOR WEBRTC AND VIDEO CHAT STARTS HERE....
			
navigator.getUserMedia = navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia;
var localVideoElement = document.getElementById('localScreen');
var remoteVideoElement = document.getElementById('remoteScreen');
//Streams
var localStream, remoteStream;
//Data channel Information
var sendChannel, receiveChannel;
//Flags
var isStarted = false;
//the PeerConnection object
var pc;
//PeerConnection ICE protocol configuration for chrome
var pc_config = {'iceServers':[{'url':'stun:stun.l.google.com:19302'}]};
var pc_constraints = {
	'optional':[{'DtlsSrtpKeyAgreement':true}]
};
var sdpConstraints = {};
var remoteUser = '';
function callerSuccess(mediaStream){
	localStream = mediaStream;
	localVideoElement.src = webkitURL.createObjectURL(mediaStream);
	pc = new webkitRTCPeerConnection(pc_config,pc_constraints);
	console.log('Peer connection created '+pc);
	pc.addStream(mediaStream);
	
	pc.onaddstream = function(streamEvent){
		remoteStream = streamEvent.stream;
		console.log('Remote Stream: '+remoteStream);
		remoteVideoElement.src =  webkitURL.createObjectURL(streamEvent.stream);
		$('#callStatus').html('Call in progress...');
	};
	pc.onicecandidate = function(e){
		var candidate = e.candidate;
		if(candidate){
			console.log('Caller Candidate Log: '+candidate);
			socket.emit('candidate',{targetUser:remoteUser, candidate:candidate});
		}
	};
	pc.createOffer(function(offerSDP){
		pc.setLocalDescription(offerSDP);
		console.log('Creating offer to remote user '+remoteUser);
		socket.emit('offersdp',{targetUser:remoteUser, offerSDP:offerSDP});
	},onfailure,sdpConstraints);
	function onfailure(e){
		alert('PC failed somewhat:'+e);
	}
};
function errorCallback(e){
	alert('Something wrong happened:'+e.toString());
}

//code for caller
$('#connect').on('click',function(){
	console.log('Trying to start a call. Current call started status :'+isStarted);
	if(!isStarted){
		remoteUser = $('#remoteUser').val();
		if(remoteUser != ''&&remoteUser != self){
			console.log('Call request from '+self+' to '+remoteUser);
			$('#video-chat').slideDown();
			$('#cover').fadeIn();
			socket.emit('newVideoChatRequest',{sender:self,receiver:remoteUser},function(data){
				$('#remoteUser').val('');
				if(data.response){
					console.log('Your call was accepted!')
					$('#callStatus').html('Call accepted. Initiating video call now. Please, Allow Media Access to continue.');
					$('#video-chat').children('h3').css('background-color','#99CC00');
					if(navigator.getUserMedia){
						navigator.getUserMedia({video:true,audio:true},callerSuccess,errorCallback);
					}else
						$('#callStatus').html('Your browser does not support getUserMedia. Please update your broswer to use this app.');
					isStarted = true;
				}else{
					console.log('Your call request was either rejected or the user is busy');
					$('#callStatus').html('Call Failed. Reason: '+data.reason);
				}
				
			});
		}else
			alert('Please enter a valid remote user name');
	}else{
			$('#callStatus').html('You are already on a call');
	}
});
$('#cancelCall').on('click',function(e){ e.preventDefault();hangup(); });
socket.on('hangup',function(data){
	console.log('hangup request from '+data.reqSource+' to '+data.target);
	if(data.target == self && data.reqSource == remoteUser){
		console.log('Call hang up request to me!');
		remoteHangup();
	}
});

function hangup(){
	if(isStarted)
		socket.emit('hangup',{target:remoteUser,reqSource:self});
	remoteHangup();
}
function remoteHangup(){
	if(pc){
		pc.close(); 
		pc = null;
	}
	if(remoteStream){
		remoteStream.stop();
	}
	if(localStream){
		localStream.stop();
	}
	isStarted = false;
	remoteUser = '';
	$('#callStatus').html('Call ended!');
	$('#video-chat').slideUp('slow');
	$('#cover').fadeOut();
}
//Code for answerer!!


function createAnswer(offerSDP){

	//first set remote descriptions based on offerSDP
	var remoteDescription = new RTCSessionDescription(offerSDP);
	pc.setRemoteDescription(remoteDescription);
	pc.createAnswer(function(answerSDP){
		pc.setLocalDescription(answerSDP);
		socket.emit('answersdp',{targetUser:remoteUser,answerSDP:answerSDP});
	},function(e){alert('something wrong happened :'+e);},sdpConstraints);
	
};

socket.on('newVideoCallRequest',function(data,callback){
console.log('New Video Call Request. Current call started status :'+isStarted);
if(!isStarted){
	$div = $('.callRequest');
	remoteUser = data.from;
	$div.find('#caller').text(remoteUser);
	$div.slideDown();
	$('#cover').fadeIn();
	$div.on('click','.green',function(){
		isStarted = true;
		callback({response:true,reason:'accepted'});
		$div.slideUp();
		$('#video-chat').slideDown();
		$('#video-chat').children('h3').css('background-color','#99CC00');
		$('#callStatus').html('Call accepted. Initiating video call now. Please, allow Media Access when asked for.');
		navigator.getUserMedia({video:true,audio:true},answererSuccess,errorCallback);
		function answererSuccess(mediaStream){
		localStream = mediaStream;
		localVideoElement.src =  webkitURL.createObjectURL(mediaStream);
		pc = new webkitRTCPeerConnection(pc_config,pc_constraints);
		console.log('Peer connection created '+pc);
		pc.addStream(mediaStream);
		pc.onaddstream = function(streamEvent){
			remoteStream = streamEvent.stream;
			console.log('Remote Media Stream: '+ remoteStream);
			remoteVideoElement.src =  webkitURL.createObjectURL(streamEvent.stream);
			$('#callStatus').html('Call in progress...');
		};
		pc.onicecandidate = function(e){
			var candidate = e.candidate;
			if(candidate){
				socket.emit('candidate',{targetUser:remoteUser, candidate:candidate});
			}
		};
		}
	});
	$div.on('click','.red',function(){
		isStarted = false;
		callback({response:false,reason:'rejected'});
		$div.slideUp();
		$('#cover').fadeIn();
	});
}else{
	callback({response:false,reason:'busy'});	
}
});
//Handlers for sockets
socket.on('candidate',function(data){
	if(pc)
		pc.addIceCandidate(new RTCIceCandidate(data.candidate));
});
socket.on('offersdp',function(data){
	console.log(self+':: offer received. target user is ' + data.targetUser);
	if(data.targetUser == self && data.offerSDP){
		console.log('Receiver reaches here. Not the offerer.');
		createAnswer(data.offerSDP);
	}
});
socket.on('answersdp',function(data){
	if(data.targetUser == self && data.answerSDP){
		console.log('Offerer reaches here. Not the receiver.');
		var remoteDescription = new RTCSessionDescription(data.answerSDP);
		pc.setRemoteDescription(remoteDescription);
	}
});
});