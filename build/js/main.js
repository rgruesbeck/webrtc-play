document.addEventListener("DOMContentLoaded", function(event) {
  go();
});

function go(){

  //create signal channel
  var signalchannel = signalChannel('http://localhost:9999/peers');

  document.querySelector('.getpeers').addEventListener('click', function(){
    signalchannel.getPeers(function(peers){
      console.log(peers);
    });
  });

  var PeerConnection = window.webkitRTCPeerConnection;
  var IceCandidate = window.RTCIceCandidate;
  var SessionDescription = window.RTCSessionDescription;

  //set public google STUN servers
  //https://natvpn.googlecode.com/svn/trunk/stun_server_list
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
    //SignalChannel.send('ICECANDIDATE', JSON.stringify(e.candidate));
    pc.onicecandidate = null;
  };



  //send and offer to other peer
  pc.createOffer(function(offer){
    pc.setLocalDescription(offer);

    //SignalChannel.send('OFFER', JSON.stringify(offer));
  }, errorHandler, constraints);

  //log error
  var errorHandler = function(err){
    console.error(err);
  };

  //SDP options
  //http://en.wikipedia.org/wiki/Session_Description_Protocol
  var constraints = {
    mandatory: {}
  };



  /*
  recv("offer", function(offer){
    console.log('recieving offer...');
    offer = new SessionDescription(JSON.parse(offer));
    pc.setRemoteDescription(offer);
    pc.createAnswer(function(answer){
      pc.setLocalDescription(answer);
      //SignalChannel.send('ANSWER', JSON.stringify(answer));
    }, errorHandler, constraints);
  });
  */

  //Note: Interoperability between Chrome and Firefox is not possible with DataChannels. Chrome supports a similar but private protocol and will be supporting the standard protocol soon.
  //Chrome also does not support channelOptions so leave it empty for now
  var channelOptions = {};
  var channelName = 'sync';
  var dataChannel = pc.createDataChannel(channelName, channelOptions);

  dataChannel.onerror = function(err){
    console.error("Channel Error: ", err);
  };

  dataChannel.onmessage = function(msg){
    console.log("Got message: " + msg.data);
  };

  dataChannel.onopen = function () {
    console.log("datachannel open");
  };

  dataChannel.onclose = function () {
    console.log("datachannel close");
  };

  //Binding the Events
  pc.ondatachannel = function(e){
    e.channel.onmessage = function(){
      console.log('binding events');
      /*
        If you were the creator of the channel (meaning the offerer),
        you can bind events directly to the DataChannel you created with createChannel.
        If you are the answerer,
        you must use the ondatachannel callback on PeerConnection to access the same channel.
      */
    };
  };

  //send message to peer over channel!
  //dataChannel.send("Hi Peer!");

  //close() closes connection
}
