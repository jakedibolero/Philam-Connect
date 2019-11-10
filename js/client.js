var appointmentId = document.getElementById("appointmentId").value
var config = {
    apiKey: "AIzaSyA4iosB30yq3QbnhV0vNB_aqerwL7zaiCg",
    authDomain: "jake-demo-7890.firebaseapp.com",
    databaseURL: "https://jake-demo-7890.firebaseio.com",
    projectId: "jake-demo-7890",
    storageBucket: "jake-demo-7890.appspot.com",
    messagingSenderId: "1040228759134"
  };
  firebase.initializeApp(config);

var database = firebase.database().ref();
var yourVideo = document.getElementById("yourVideo");
var friendsVideo = document.getElementById("friendsVideo");
var yourId = Math.floor(Math.random()*1000000000);
var servers = {'iceServers': [{'urls': 'stun:stun.services.mozilla.com'}, {'urls': 'stun:stun.l.google.com:19302'}, {'urls': 'turn:numb.viagenie.ca','credential': 'jekinsjekins','username': 'jeremiah.valero@hotmail.com'}]};
var pc = new RTCPeerConnection(servers);
pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate}),appointmentId):$(".loader").css("display","none") );
pc.onaddstream = (event => friendsVideo.srcObject = event.stream);
function sendMessage(senderId, data, appointmentId) {
    var msg = database.push({ sender: senderId, message: data, appointment:appointmentId });
    msg.remove();
}

function readMessage(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    var myAppointment = data.val().appointment;
 
    if (sender != yourId && appointmentId == myAppointment) {
      
        if (msg.ice != undefined)
            
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type == "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription}),appointmentId));
        else if (msg.sdp.type == "answer")
            $(".loader").css("display","none")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
};

database.on('child_added', readMessage);

function showMyFace() {
  navigator.mediaDevices.getUserMedia({audio:true, video:true})
    .then(stream => yourVideo.srcObject = stream)
    .then(stream => pc.addStream(stream));
}

function showFriendsFace() {
  $(".loader-text").css("display","none")
  $(".loader").css("display","inline-block")
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer) )
    .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription}),appointmentId) );
}
