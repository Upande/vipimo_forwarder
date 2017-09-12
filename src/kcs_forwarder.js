'use strict'
const lora_packet = require('lora-packet');
const config = require('../config/config');
const gatewayconfig = require('../config/gatewayconfig');
const request = require('request');
const parser = require('./parser.js');
const shell = require('shelljs');
const Async = require('async');


class kcs_forwarder extends parser
{
	static updates()
	{
		let self= this;
		self.checkforupdates(function(err, updated){
			if(err)return;
			if(updated === true)
			{

				console.log(updated)
				// self.updatemodules();
			}
		})
		
	}

	static checkforupdates(callback)
	{
		console.log("checking for updates...")
		let cmd = 'git pull';
		let child = shell.exec(cmd, {async:true, silent:true});
		child.stdout.on('data', function(data) {
			console.log(data)
			let noupdates = data.match(/up-to-date/);
			console.log(noupdates)
			if(noupdates)return callback(null, false);
			return callback(null, true);	//updates found and updated
		});
	}

	// static updatemodules()
	// {
	// 	console.log("will now try to update node modules...")
	// 	let cmd = 'npm install';
	// 	let child = shell.exec(cmd, {async:true, silent:true});
	// 	child.stdout.on('data', function(data) {
	// 		console.log(data)
	// 	});
	// 	//restart service after 3 minutes (assume npm is done)
	// 	setTimeout(function() { 
	// 		let cmdi = 'systemctl restart kcs_forwarder.service';
	// 	  	let childi = shell.exec(cmdi, {async:true, silent:true});
	// 		childi.stdout.on('data', function(data) {
	// 			console.log(data)
	// 		});
	// 	}, config.get('/intervals/restartservice'));

	// }

	static gatewayreports(callback)
	{

		let self = this;
		self.gatewayupdate(function(err, result){})			//if anything breaks, update first before continue ing
		self.gatewayalive(function(err, result){})
		
	}

	static gatewayalive(callback)
	{
		let self = this;
		let gatewayaliveendpoints = config.get("/gatewayendpoints/alive");
		let gatewayIMEI = gatewayconfig.get("/IMEI");
		Async.each(gatewayaliveendpoints, function(url, callback) {
			//require this data string...


			let strUp = self.kcsstringWithCorrectTime()
		    let sendto = url +gatewayIMEI+"|"+strUp;//PVNZjzLw0vFM6g0000000Qc000000000000000000000";	
		    console.log('Sending to  ' + sendto);

		    request(sendto, function (error, response, body) {
		    	if(error)return callback(error)
		    	if(body === undefined)return callback();

				// console.log('error:', error); // Print the error if one occurred 
				//console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
				console.log("Sent to KCS")
				console.log('from kcs:', body); // Print the HTML for the Google homepage. 
				console.log(body.match(/\+CLI(.)*/ig))
				let commands = body.match(/\+CLI(.)*/ig);
				Async.each(commands, function(command, callback_inner) {
					command = command.replace(/\+CLI([.]*)/ig, '$1');

					let cmd = command;
					console.log(cmd)
					let child = shell.exec(cmd, {async:true, silent:true});
					let calledback = false;
					child.stdout.on('data', function(data) {
						console.log(data)
						if(calledback === false) 
							callback_inner();
					});
					
					// callback_inner();
				});
				
				callback()

			});
		}, function(err) {
		    // if any of the file processing produced an error, err would equal that error
		    if( err ) {
		      console.log(' '+err);
		    } else {
		      // console.log('...');
		    }
		});
	}

	static gatewayupdate(callback)
	{
		let self = this;
		self.updated = false;
		let cmd = "git pull";
		let child = shell.exec(cmd, {async:true, silent:true});
		let calledback = false;
		child.stdout.on('data', function(data) {
			console.log("data:"+data)
			let noupdates = data.match(/up-to-date/);
			console.log("no updated....."+noupdates);

			let noupdates = data.match(/up-to-date/);
			if(noupdates !== null)self.updated = true;
		});
		self.diditupdate();
		setTimeout(function(){
			callback();
		},30000)//be done after 30 seconds
	}

	static diditupdate()
	{
		let self = this;
		let updated = false;
		setTimeout(function(){
			updated = self.updated;
			if(updated === true)
				self.restartservice(10000, function(){});
		}, 30000)//wait 20 seconds to check for updates...
	}

	static restartservice(delay, callback)
	{
		setTimeout(function(){

			let cmd = "systemctl restart kcs_forwarder.service";
			let child = shell.exec(cmd, {async:true, silent:true});
			child.stdout.on('data', function(data) {
				console.log(data)
				callback();
			});
		}, delay)
	}

	static roughSizeOfObject( object ) {

	    let objectList = [];
	    let stack = [ object ];
	    let bytes = 0;

	    while ( stack.length ) {
	        let value = stack.pop();

	        if ( typeof value === 'boolean' ) {
	            bytes += 4;
	        }
	        else if ( typeof value === 'string' ) {
	            bytes += value.length * 2;
	        }
	        else if ( typeof value === 'number' ) {
	            bytes += 8;
	        }
	        else if
	        (
	            typeof value === 'object'
	            && objectList.indexOf( value ) === -1
	        )
	        {
	            objectList.push( value );

	            let i
	            for(i in value ) {
	                stack.push( value[ i ] );
	            }
	        }
	    }
	    return bytes;
	}

	static kcsstringWithCorrectTime()
	{
		let self = this;
		let packet_bigEndian = [];
		let packet_smallEndian = [];
		let hexstring = "1c00000001000000fdfffeff090b1400";
		let hexlen = hexstring.length;

		let i;
		for(let i= 0;i<hexlen;i++)
		    packet_smallEndian.push(parseInt("0x"+hexstring[i++]+hexstring[i]));
		  
		let tmp=0;
		let digital1, digital2, analog1, analog2, vbat, temperature;

		while(tmp<hexlen/2)
		{
		    packet_bigEndian.push(packet_smallEndian.pop());
		    tmp++;
		}
		digital1 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8)+(packet_bigEndian.pop()<<16)+(packet_bigEndian.pop()<<24);
		digital2 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8)+(packet_bigEndian.pop()<<16)+(packet_bigEndian.pop()<<24);
		analog1 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);
		analog2 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);
		vbat = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);
		temperature = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);     //-32768
		vbat /= 1000;

		let time = Math.floor(Date.now() / 1000)//timestamp in seconds
		let sizeoftime = self.roughSizeOfObject(time)
		let sizeofdigital1 = self.roughSizeOfObject(digital1)
		let sizeofdigital2 = self.roughSizeOfObject(digital2)
		let sizeofanalog1 = self.roughSizeOfObject(analog1)
		let sizeofanalog2 = self.roughSizeOfObject(analog2)
		let sizeofvbat = self.roughSizeOfObject(vbat)
		let sizeoftemperature = self.roughSizeOfObject(temperature)
		let packet33chars = []


		sizeoftime *= 8//in bits
		time = 100*(time-946684800.0)/16

		packet33chars.push((time<<(sizeoftime-4*8))>>(sizeoftime-4*8)>>(3*8))
		packet33chars.push((time<<(sizeoftime-3*8))>>(sizeoftime-3*8)>>(2*8))
		packet33chars.push((time<<(sizeoftime-2*8))>>(sizeoftime-2*8)>>(1*8))
		packet33chars.push((time<<(sizeoftime-(1*8)))>>(sizeoftime-(1*8))>>(0*8))
		//temperature
		sizeoftemperature *= 8//in bits
		                                                                                                analog1 = analog1/96;
		                                                                                                temperature = analog1;//send analog 1 inplace of temperature;
		temperature = (temperature+60) * 256
		packet33chars.push((temperature<<(sizeoftemperature-2*8))>>(sizeoftemperature-2*8)>>(1*8))
		packet33chars.push((temperature<<(sizeoftemperature-1*8))>>(sizeoftemperature-1*8)>>(0*8))

		//vbat
		sizeofvbat *= 8//in bits
		vbat = (vbat - 0.2)*1969
		packet33chars.push((vbat<<(sizeofvbat-2*8))>>(sizeofvbat-2*8)>>(1*8))
		packet33chars.push((vbat<<(sizeofvbat-1*8))>>(sizeofvbat-1*8)>>(0*8))

		//switch
		packet33chars.push(0x70)
		//port size
		packet33chars.push(0x19)
		//digital1, pulses
		sizeofdigital1 *= 8//in bits
		packet33chars.push((digital1<<(sizeofdigital1-4*8))>>(sizeofdigital1-4*8)>>(3*8))
		packet33chars.push((digital1<<(sizeofdigital1-3*8))>>(sizeofdigital1-3*8)>>(2*8))
		packet33chars.push((digital1<<(sizeofdigital1-2*8))>>(sizeofdigital1-2*8)>>(1*8))
		packet33chars.push((digital1<<(sizeofdigital1-1*8))>>(sizeofdigital1-1*8)>>(0*8))
		//digital2,, only 2 bytes
		sizeofdigital2 *= 8//in bits
		packet33chars.push((digital2<<(sizeofdigital2-2*8))>>(sizeofdigital2-2*8)>>(1*8))
		packet33chars.push((digital2<<(sizeofdigital2-1*8))>>(sizeofdigital2-1*8)>>(0*8))
		//door status...2nd bit is door status
		packet33chars.push(0x43)// or try 1 to make second bit zero
		let singleitem = packet33chars.pop();
		packet33chars.push(singleitem)
		let singleitemsize = self.roughSizeOfObject(singleitem)
		let packetind = self.roughSizeOfObject(packet33chars)/singleitemsize
		for(;packetind<30;packetind++) packet33chars.push(0)
		//filler for pos 30, 31,32
		packet33chars.push(0)
		packet33chars.push(0)
		packet33chars.push(0)
		//if forwarded by gateway
		packet33chars.push(99)
		packetind = self.roughSizeOfObject(packet33chars)/singleitemsize-1

		let packet33charsinverted = []
		for(tmp=0;tmp<=packetind;tmp++)packet33charsinverted.push(packet33chars.pop())
		let packetstr = 0;
		let lastpacketlen = (8*packetind)/6

		let bitindex, byteindex;

		let packetstosend = [];

		byteindex = 0; 
		let byte;
		let bytet0push = 0;
		let tmpi = 0;

		for(tmp=0;tmp<packetind;tmp++)
		{
		    byte = packet33charsinverted.pop()
		    for(bitindex=0;bitindex<8;bitindex++)
		    {
		      let bit =   (byte<<(8*7+bitindex))>>(8*7+bitindex)>>(7-bitindex);
		      if(bit === -1)bit = 1;
		      bytet0push += bit<<(5-tmpi)
		      tmpi++;
		      if(tmpi == 6)
		      {
		        packetstosend.push(bytet0push)
		        bytet0push = 0;
		        
		        tmpi = 0;
		      }
		    }
		}


		packetind = self.roughSizeOfObject(packetstosend)/singleitemsize
		let packetstosendbigEndian = []
		for(tmp= 0; tmp<packetind;tmp++)packetstosendbigEndian.push(packetstosend.pop())
		let c = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
		let strtosend = '';
		for(tmp= 0; tmp<packetind;tmp++)
		{
		    let ind = packetstosendbigEndian.pop();
		    strtosend += c[ind]
		}
	    return strtosend;
	}
}


module.exports = kcs_forwarder