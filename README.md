# webrtc-chat
A small WebRTC-based video chat application. Developed with Node.js, Express and Socket.IO on server side. Chromium based browsers only supported.

This app uses RTCPeerconnection and getUserMedia specifications of WebRTC standards to develop a simple video chat application.

# Signaling
For signalling the application uses a Node.js and Express framework based server that provides it with the logic of signaling. 
Use of web sockets for communication - thanks to Socket.io module. 

# Functionality
Anybody can join the virtual chat room. List of online users is visible. A user calls another user using their usernames.
The call is accepted or rejected according to the receiver's will.



