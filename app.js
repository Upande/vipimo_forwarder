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
          kcs_forwarder.getdevAddr(function(err, devAddr){
            console.log(devAddr)
            if(devAddr === '0702D663'  || devAddr === '0702A342'|| devAddr === '0A03F8E4'|| devAddr === '0802C474'|| devAddr === '0A03F9E4'|| devAddr='0602ED46'|| devAddr='0702A44D')
            {
              kcs_forwarder.decodev1();
              kcs_forwarder.sendsignalmsg(devAddr);
            }
            else
            {
              kcs_forwarder.decode();
              kcs_forwarder.sendsignalmsg(devAddr);
            }
          })
          
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


kcs_forwarder.callSendFromLogs("gateway");
kcs_forwarder.callSendFromLogs("nodes");
kcs_forwarder.gatewayreports(function(err,result){});
//wait for system to sync time
setTimeout(function(){
  server.bind(process.env.PORT);

  //send a message to server from gateway after one hour
  //kcs_forwarder.gatewayreports(function(err,result){});
  //kcs_forwarder.callSendFromLogs("gateway");
  //kcs_forwarder.callSendFromLogs("nodes");

  setInterval(function() { 
    kcs_forwarder.gatewayreports(function(err,result){});
  }, config.get('/intervals/gatewayalive'));

  setInterval(function() { 
    kcs_forwarder.callSendFromLogs("gateway");
    kcs_forwarder.callSendFromLogs("nodes");
  //}, config.get('/intervals/sendfromlogs') || 1200);
   }, config.get('/intervals/sendfromlogs') || 120000);


  setInterval(function() { 
    kcs_forwarder.gatewayupdate(function(err,result){});
  }, config.get('/intervals/checkupdates'));
  
}, 1000)
// }, 100000)
