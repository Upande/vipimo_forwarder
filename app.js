const udp = require('dgram');
const config = require('./config/config');
const fse = require('fs-extra');
const dotenv = require('dotenv');
const kcs_forwarder = require('./src/kcs_forwarder.js')
const Async = require('async');
const { StringDecoder } = require('string_decoder');

/**
 * Load environment variables from .env file, where API keys and passwords are configured
 */

if (fse.existsSync('.env'))
  dotenv.load({ path: '.env' });
else
  dotenv.load({ path: '.env.example' });


// --------------------creating a udp server --------------------

// creating a udp server
var server = udp.createSocket('udp4');

// emits when any error occurs
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
});

server.on('message',function(msg_in,info){
  Async.auto({
    start: function (dones) {
	let decoder = new StringDecoder('utf8');
	let msg2 = msg_in.slice(12, msg_in.length)
	msg2 = Buffer.from(msg2);
	msg2 = decoder.write(msg2);
      kcs_forwarder.init(msg2, info, function(err, result){
        if(!err)
        {
          kcs_forwarder.decode();
          kcs_forwarder.sendsignalmsg();
        }

      });
    },
 })
  

});

//emits when socket is ready and listening for datagram msgs
server.on('listening',function(){
  var address = server.address();
  var port = address.port;
  var family = address.family;
  var ipaddr = address.address;
  console.log('Server is listening at port: ' + port);
  console.log('Server ip :' + ipaddr);
  console.log('Server is IP4/IP6 : ' + family);
});

//emits after the socket is closed using socket.close();
server.on('close',function(){
  console.log('Socket is closed !');
});




//wait for system to sync time
setTimeout(function(){
  server.bind(process.env.PORT);

  kcs_forwarder.gatewayreports(function(err,result){});
  //send a message to server from gateway after one hour

  setInterval(function() { 
    kcs_forwarder.gatewayreports(function(err,result){});
  }, config.get('/intervals/gatewayalive'));
}, 10000)
