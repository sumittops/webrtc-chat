navigator.getUserMedia = navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia;
var localVideoElement = document.getElementById('localScreen');
var remoteVideoElement = document.getElementById('remoteScreen');
//Streams
var localStream, remoteStream;
//Data channel Information
var sendChannel, receiveChannel;
//Flags
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
//the PeerConnection object
var pc;
//PeerConnection ICE protocol configuration for chrome
var pc_config = {'iceServers':[{'url':'stun:stun.l.google.com:19302'}]};
var pc_constraints = {
	'optional':[{'DtlsSrtpKeyAgreement':true}]
};
var sdpConstraints = {};

function success(mediaStream){
	localStream = mediaStream;
	localVideoElement.src = window.URL.createObjectURL(mediaStream);	
	attachMediaStream(localVideoElement,mediaStream);
}
function errorCallback(e){
	alert('Something wrong happened:'+e.toString());
}
var remoteUser = '';	
$('#connect').on('click',function(){
	if(!isStarted){
		remoteUser = $('#remoteUser').val();
		if(remoteUser != '')
			socket.emit('newVideoChatRequest',remoteUser,function(data){
				if(data){
					isInitiator = true;
					
				}else{
					alert('No such user is online now or the call was rejected by the remote user.');
				}
			});
	}else{
		localVideoElement.src= null;
		gettingStream = false;
		$('#getFeed').text('Get Feed');
	}
});
