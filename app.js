const udp = require('dgram'),
  config = require('./config/config'),
  fse = require('fs-extra'),
  dotenv = require('dotenv'),
  kcs_forwarder = require('./src/kcs_forwarder.js'),
  Async = require('async'),
  to = require('await-to-js').to,
  { StringDecoder } = require('string_decoder'),
  decoder = new StringDecoder('utf8');

/**
 * Load environment variables from .env file, where API keys and passwords are configured
 */

if (fse.existsSync('.env'))
  dotenv.load({ path: '.env' });
else
  dotenv.load({ path: '.env.example' });


// --------------------create a udp server --------------------
let server = udp.createSocket('udp4');

// emits when any error occurs
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
});

server.on('message', async function(msg_in,info){
  let [err, results] = await to(kcs_forwarder.msgType(msg_in))
  if (err) return;

  /*
   * Type of packet 
   * see https://github.com/Lora-net/packet_forwarder/blob/master/PROTOCOL.TXT
   */
  let identifier = parseInt("0x"+results.identifier);
  // console.log(`identifier->${identifier}`)
  let packet, jsonMsg;
  switch(identifier) {
    case 0:               // PUSH_DATA identifier 0x00
      packet = kcs_forwarder.pushAckPacket(results);
      server.send(packet, info.port, info.address);
      jsonMsg = kcs_forwarder.getJSONfromPacket(msg_in);
      kcs_forwarder.pushedPacket(jsonMsg, results.MAC)
      break;
    case 2:               // PULL_DATA identifier 0x02
      packet = kcs_forwarder.pullAckPacket(results);
      server.send(packet, info.port, info.address);
      break;
    case 5:               // TX_ACK identifier 0x05
      jsonMsg = kcs_forwarder.getJSONfromPacket(msg_in);
      console.log(jsonMsg)
      break;

  }


  // let decoder = new StringDecoder('utf8');

 // console.log('--------------------------->')

  
  // console.log(err)
  // console.log(results)

 //  Async.auto({
 //    start: function (dones) {
 //  // let decoder = new StringDecoder('utf8');
 //  // let msg2 = msg_in.slice(12, msg_in.length)
 //  // msg2 = Buffer.from(msg2);
 //  // msg2 = decoder.write(msg2);
 //      kcs_forwarder.init(msg2, info, function(err, result){
 //        // what type of msg have we?
 //        if(!err)
 //        {
 //          kcs_forwarder.getdevAddr(function(err, devAddr){
 //            console.log(devAddr)
 //            if(devAddr[0] === '0')
 //            if(devAddr === '0702D663'||devAddr === '0702A342'|| devAddr === '0A03F8E4'
 //              || devAddr === '0802C474'|| devAddr === '0A03F9E4'|| devAddr === '0602ED46'|| 
 //              devAddr === '0902C767'||devAddr === '0902B341'|| devAddr === '0702A44D' || 
 //              devAddr === '0702B549' || devAddr === '0702D272')
            
 //            {
 //              kcs_forwarder.decodev1();
 //              // kcs_forwarder.sendsignalmsg(devAddr);
 //            }
 //            else
 //            {
 //              kcs_forwarder.decode();
 //              // kcs_forwarder.sendsignalmsg(devAddr);
 //            }
 //          })
          
 //        }

 //      });
 //    },
 // })
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


// kcs_forwarder.callSendFromLogs("gateway");
// kcs_forwarder.callSendFromLogs("nodes");
// kcs_forwarder.gatewayreports(function(err,result){});
//wait for system to sync time
setTimeout(function(){
  server.bind(process.env.PORT);
  // setInterval(function() { 
  //   kcs_forwarder.gatewayreports(function(err,result){});
  // }, config.get('/intervals/gatewayalive'));

  // setInterval(function() { 
  //   kcs_forwarder.callSendFromLogs("gateway");
  //   kcs_forwarder.callSendFromLogs("nodes");
  // //}, config.get('/intervals/sendfromlogs') || 1200);
  //  }, config.get('/intervals/sendfromlogs') || 120000);


  // setInterval(function() { 
  //   kcs_forwarder.gatewayupdate(function(err,result){});
  // }, config.get('/intervals/checkupdates'));
  
}, 1000)
// }, 100000)
