var appointmentId = document.getElementById("appointmentId").value
var jsonObj = document.getElementById('data').value

jsonObj = JSON.parse(jsonObj)
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
pc.onicecandidate = (event => event.candidate?sendMessage(yourId, JSON.stringify({'ice': event.candidate}),appointmentId):console.log("Sent All Ice") );
pc.onaddstream = (event => friendsVideo.srcObject = event.stream);

function sendMessage(senderId, data,appointmentId) {
    console.log(appointmentId);
    var msg = database.push({ sender: senderId, message: data ,appointment:appointmentId});
    msg.remove();
}
function readMessage(data) {
    var msg = JSON.parse(data.val().message);
    var sender = data.val().sender;
    var myAppointment = data.val().appointment;
    if (sender != yourId && myAppointment == appointmentId) {
        if (msg.ice != undefined)
            pc.addIceCandidate(new RTCIceCandidate(msg.ice));
        else if (msg.sdp.type == "offer")
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              .then(() => pc.createAnswer())
              .then(answer => pc.setLocalDescription(answer))
              .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription}),appointmentId));
        else if (msg.sdp.type == "answer")
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
  pc.createOffer()
    .then(offer => pc.setLocalDescription(offer) )
    .then(() => sendMessage(yourId, JSON.stringify({'sdp': pc.localDescription}),appointmentId) );
}

function findMeetingLocation(){
  $("#schedule-body").empty();
  $("#schedule-head").html("MEETING LOCATIONS")

  $("#schedule-body").html(`
  <div class="wrap-input100 validate-input" data-validate="Name is required">
                        <b><p><span class="label-input100 .label-input100-agent">Starbucks Makati</span></p></b>
                        <p><span class="label-input100 .label-input100-agent">50m from client and 30m from agent</span></p>
                      </div>
                      <div class="wrap-input100 validate-input" data-validate = "Valid email is required: ex@abc.xyz">
                          <b><p><span class="label-input100 .label-input100-agent">Starbucks Edsa</span></p></b>
                          <p><span class="label-input100 .label-input100-agent">100m from client and 10m from agent</span></p>
  </div>
  `)
}

function setSchedule(){
  $("#schedule-body").empty();
  $("#schedule-head").html("SET SCHEDULE")
  $("#schedule-body").html(`
  <div class="wrap-input100 validate-input" data-validate="Name is required">
					<span class="label-input100 .label-input100-agent">Client Name</span>
					<input class="input100 input100-agent" type="text" name="name" placeholder="Enter your Name" id= "name">
					<span class="focus-input100"></span>
				</div>

				<div class="wrap-input100 validate-input" data-validate = "Valid email is required: ex@abc.xyz">
					<span class="label-input100 .label-input100-agent">Client Email</span>
					<input class="input100 input100-agent" type="text" name="email" placeholder="Enter your Email Address" id= "email">
					<span class="focus-input100"></span>
				</div>

				<div class="wrap-input100 validate-input" data-validate = "Valid email is required: ex@abc.xyz">
						<span class="label-input100 .label-input100-agent">Client Birthday</span>
						<input class="input100 input100-agent" type="date" name="email" placeholder="Enter your email addess" id= "birth">
						<span class="focus-input100"></span>
				</div>

				<div class="wrap-input100 validate-input" data-validate = "Valid email is required: ex@abc.xyz">
						<span class="label-input100 .label-input100-agent">Client Contact Number</span>
						<input class="input100 input100-agent" type="text" name="email" placeholder="Enter your Phone Number" id= "phone">
						<span class="focus-input100"></span>
        </div>
        <div class="wrap-input100 validate-input" data-validate = "Valid email is required: ex@abc.xyz">
						<span class="label-input100 .label-input100-agent">Meeting Schedule</span>
						<input class="input100 input100-agent" type="date" name="email" placeholder="Enter your email addess" id= "schedule">
						<span class="focus-input100"></span>
        </div>
        <div class="wrap-input100 validate-input" data-validate = "Valid email is required: ex@abc.xyz">
						<span class="label-input100 .label-input100-agent">Meeting Time</span>
						<input class="input100 input100-agent" type="text" name="email" placeholder="Enter Desired Time" id= "time">
						<span class="focus-input100"></span>
				</div>
<div class="container-contact100-form-btn">
  <div class="wrap-contact100-form-btn">
    <div class="contact100-form-bgbtn"></div>
    <button type="button" class="contact100-form-btn" onclick="subm()">
      <span>
        Submit
        <i class="fa fa-long-arrow-right m-l-7" aria-hidden="true"></i>
      </span>
    </button>
  </div>
</div>
  `)

  $('#name').val(jsonObj.name);
  $('#email').val(jsonObj.email);
  $('#phone').val(jsonObj.phone);
  $('#birth').val(jsonObj.birth);

  
}

function subm(){
var data = {}
data.name = $('#name').val()
data.email = $('#email').val()
data.phone = $('#phone').val()
data.birth = $('#birth').val()
data.agent = localStorage.getItem('username')
data.schedule = $('#schedule').val()
data.time = $('#time').val()
  $.ajax({
    url:`${ip}:8080/insert`,
    type:"POST",
    data:data,
    success: function(data){
      console.log("YEH");
        success();
    },
    error:function(){
      alert("error");
    }
  });
}
function success() {
  console.log("Display");
  $(".success-checkmark").css('display','inline-block')
  $(".check-icon").hide();
  setTimeout(function () {
    $(".check-icon").show();
    
  }, 10);
  setTimeout(function(){
    $("#modalLarge").modal('toggle')
  },1500);
}