document.addEventListener("DOMContentLoaded", function(event) {
  go();
});

function go(){

  //set cross-browser variable
  var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

  //set public google STUN servers
  //http://en.wikipedia.org/wiki/STUN
  var configuration = {
    iceServers: [
      { url: "stun:stun.l.google.com:19302" },
      { url: "stun:stun1.l.google.com:19302" },
      { url: "stun:stun2.l.google.com:19302" },
      { url: "stun:stun3.l.google.com:19302" },
      { url: "stun:stun4.l.google.com:19302" }
    ]
  };

  // set options
  var options = {
    optional: [
      {DtlsStrpKeyAgreement: true},
      {RtpDataChannels: true},
    ]
  };

  //instantiate new peer connection
  var pc = new PeerConnection(configuration, options);

  //finds an ICE candidate then saves found candidate and sets onicecandidate to null
  pc.onicecandidate = function(e){
    //candidate exists in e.candidate
    if (!e.candidate) return;
    console.log('icecandidate event detected!');
    send("icecandidate", JSON.stringify(e.candidate));
    pc.onicecandidate = null;
  };

  pc.createOffer(function(offer){
    pc.setLocalDescription(offer);

    send("offer", JSON.stringify(offer));
  }, errorHandler, constraints);

  var errorHandler = function(err){
    console.error(err);
  };

  var constraints = {
    mandatory: {}
  };

}
