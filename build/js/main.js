document.addEventListener("DOMContentLoaded", function(event) {
  go();
});

function go(){
  var peerId, signalChannel;
  var peerList = [];
  signal();

  function signal(){
    console.log('connecting to signaling server...');
    //var uri = 'http://192.168.171.81:9999/peers';
    var uri = 'http://localhost:9999/peers';
    var stream = shoe(uri);
    stream.pipe(multiStream()).pipe(stream);
  }

  function multiStream(){
    var mdm = MuxDemux();

    var rpcStream = mdm.createStream('rpc');
    var client = createRpc();
    client.pipe(rpcStream).pipe(client);
    signalChannel = client.wrap([
        'sendICE',
        'sendSDP'
    ]);

    mdm.on('connection', function(stream){
      if (stream.meta == 'msg') {
        stream.on('data', function(data){
          var msg = JSON.parse(data);
          if (msg.id) {
            updateId(msg.id);
          } else if (msg.peerlist) {
            updatePeerList(msg.peerlist, 'refresh');
          } else if (msg.join) {
            updatePeerList(msg.join, 'join');
          } else if (msg.leave) {
            updatePeerList(msg.leave, 'leave');
          }
          console.log(data);
        });
      }
    });

    mdm.on('close', function(stream){
      id = null;
      peerList = [];
      setTimeout(signal, 2000);
      console.log('lost connection to signaling server...');
    });

    mdm.on('error', function(err){
      console.log(err.toString());
      mdm.destroy();
    });

    return mdm;
  }

  //testing send ICE
  signalChannel.sendICE({
    to: 'other peer',
    ice: 'here is your ice'
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

  console.log(pc);

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

//update id
function updateId(id){
  peerId = id;
  var pid = document.getElementById('peerId');
  pid.textContent = id;
}

//update peerlist
function updatePeerList(data, task){
  var plist = document.getElementById('peerList');
  if (task == 'refresh') {
    peerList = data;
    plist.innerHTML = '';
    data.forEach(function(peer){
      var p = document.createElement('li');
      p.setAttribute('id', peer);
      p.innerHTML = peerMarkup(peer);
      plist.appendChild(p);
    });
  } else if (task == 'join') {
    peerList.push(data);
    var p = document.createElement('li');
    p.setAttribute('id', data);
    p.innerHTML = peerMarkup(data);
    plist.appendChild(p);
  } else if (task == 'leave') {
    var tmp = null;
    for (i = 0; i < peerList.length; ++i) {
      if (peerList[i] === data) {
        tmp = i;
        break;
      }
    }
    peerList.splice(tmp, 1);
    plist.removeChild(plist.querySelector('#' + data));
  }

  function peerMarkup(id){
    var html = [
      '<div>',
      '<h3>' + id + ': </h3>',
      '<button value="' + id + ' onclick=connect(this.value)">Connect</button>',
      '</div>'
    ];
    return html.join('');
  }
}

window.connect = function(val){
  console.log('connecting...');
  console.log(val);
};

