const lora_packet = require('lora-packet');
const config = require('../config/config');
const request = require('request');
const Async = require('async');
const gatewayconfig = require('../config/gatewayconfig');
//const Encoder = require('node-html-encoder').Encoder;
//const encoder = new Encoder('entity');
let nodeMon = require("./nodeMonitor")
const bitwise = require('bitwise');
const shell = require('shelljs');


class parser
{
	constructor()
	{
		this.nodeMon = nodeMon
	}
	/*static*/ clear_vars()
	{
		let self = this;
		self.msg = null;
		self.payload = null;
		self.hexstring = null;
		self.imei = null;
	}
	/*static*/ init(msg, info, callback)
	{
		let msg2 = msg;
		let self = this;
		self.clear_vars();
  	 	console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
		// console.log(msg);
		let is_data;
		try
		{
			msg = JSON.parse(msg)
			is_data = msg.rxpk[0].data
			if(is_data === undefined) throw new Error("..")
//			is_data = msg.match(/"data":"[^\"]*"/ig)[0].replace(/"data":"([^\"]*)"/, '$1');
		}catch(error)
		{
			// console.log(error)
			return callback(error);
		}

		self.msg = is_data;
		self.signalmsg = msg;
		callback()

	}

	/*static*/ sendsignalmsg(devArr)
	{
		
		let self = this;
		let kcsserver = config.get("/kcsserver");
		//let gatewayIMEI = gatewayconfig.get("/IMEI");
		//console.log(self.signalmsg)
		self.signalmsg.rxpk[0]["gateway"] = gatewayconfig.get("/IMEI");
		self.signalmsg.rxpk[0]["devaddr"] = devArr//self.devArr;
		//console.log(self.signalmsg)
		let strtosend = new Buffer(JSON.stringify(self.signalmsg)).toString('base64')
		
		Async.each(kcsserver, function(url, callback) {
			url = url.replace("upload.php","uploadsignal.php");
		    let sendto = url +strtosend;
		    // console.log('Sending to  ' + sendto);

		    request(sendto, function (error, response, body) {
				console.log('from kcs signal:', body); // Print the HTML for the Google homepage. 
				if(error)callback(error)
				else callback()

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

	/*static*/ decode()
	{
		let self = this;

		// console.log(self.msg)
		var packet = lora_packet.fromWire(new Buffer(self.msg, 'base64'));

		let devArr = self.devArr
		
		// check MIC
		var NwkSKey = new Buffer(config.get("/NwkSKey"), 'hex');
		// console.log("MIC check=" + (lora_packet.verifyMIC(packet, NwkSKey) ? "OK" : "fail"));

		// calculate MIC based on contents
		// console.log("calculated MIC=" + lora_packet.calculateMIC(packet, NwkSKey).toString('hex'));

		// decrypt payload
		let AppSKey = new Buffer(config.get("/AppSKey"), 'hex');
		// console.log("Decrypted='" + lora_packet.decrypt(packet, AppSKey, NwkSKey).toString() + "'");
		let ind;
		let savestr = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' });
		// for(ind in packet._packet)
			// savestr += `::::::${packet._packet[ind].toString('hex')}`

		savestr += `::${self.devArr}::${self.msg}`
		let cmd = `echo ${savestr} >> logs`
		let child = shell.exec(cmd, {async:true, silent:true});  //0000008D 

		let payload = lora_packet.decrypt(packet, AppSKey, NwkSKey);
		let hexstring = payload.toString('hex');
		let imei = self.DevAddrToFakeImei(devArr)
		self.imei = imei;
		self.payload = payload;
		self.hexstring = hexstring;

		self.kcs_encode(function(err, result){
			if(err)return;
		})
	}

	completehex(hex, reqlen = 0)
	{
		let self = this
		if(reqlen === 0 )reqlen = hex.length;
		if(reqlen % 2 > 0)reqlen++;
		let len
		if((len =hex.length) < 4)
			for(let i = len; i<4; i++) hex = '0'+hex
		return hex
	}

	twoscomplement(number)
	{
		let self = this
		if(number >= 0)return number;
		number = Math.abs(number)
		let buffer = new Buffer(self.completehex(number.toString(16)), 'hex');
		let resultBuffer = bitwise.buffer.not(buffer);
		let ones = bitwise.readUInt(resultBuffer, 0, 16);
		let twos = ones + 1
		return twos
	}


	decodev1()
	{
		let self = this;
		var packet = lora_packet.fromWire(new Buffer(self.msg, 'base64'));
		let devArr = self.devArr
		var NwkSKey = new Buffer("2B7E151628AED2A6ABF7158809CF4F3C", 'hex');
		let AppSKey = new Buffer("2B7E151628AED2A6ABF7158809CF4F3C", 'hex');
		let payload = lora_packet.decrypt(packet, AppSKey, NwkSKey);
		let hexstring = payload.toString('hex');
		let imei = self.DevAddrToFakeImei(devArr)
		self.imei = imei;
		// console.log(devArr+":"+imei)
		// console.log(hexstring)
		self.payload = payload;
		self.hexstring = hexstring;
		// console.log(hexstring)

		// console.log(`LITTLE ENDIAN: ${hexstring}`)
		let statusbyte = '0x'+hexstring.substr(0, 2)
		let statusbits = parseInt(statusbyte)
		// console.log(`status bits: ${statusbyte} ->${statusbits} -> 0b${(+statusbits).toString(2)}`)
		let validtemp = (statusbits & 1);
		// console.log(`Valid Humidity sensor temp: 0b${(+statusbits).toString(2)} & 0x01 -> ${validtemp}`)

		if(validtemp === 1)
		{
			let temp = hexstring.substr(6, 4)
			let temp1 = parseInt('0x'+temp)
			let temp11 = ((temp1 & 0xff00)>> 8) //+ (temp1 & 0x00ff)<< 8
			let temp111 =  (temp1 & 0x00ff)<< 8
			temp111+= temp11
			temp = temp111.toString(16)
			temp1 = parseInt('0x'+temp)
			let tempfinal = -45 + 175 * (temp1/65535)
			// console.log(`temperature value (bytes 3 & 4): 0x${temp} -> ${temp1} => ${tempfinal} degrees Celcius `)
			// tempfinal = Math.floor(tempfinal);
			let humiditytemp = tempfinal
			// console.log(`SOME TEMP: ${tempfinal}`);
			tempfinal /= 0.0625;
			tempfinal = Math.floor(tempfinal);
			
			// if(tempfinal < 0)
			// 	console.log(`${tempfinal} .. to hex(from negative) -> ...${~tempfinal.toString(16)}`)
			// else
			// 	console.log(`${tempfinal} .. to hex -> ...${tempfinal.toString(16)}`)
			// if(tempfinal < 0)
			// {
			// 	console.log(`was ${tempfinal}`)
			// 	tempfinal = ~tempfinal.toString(16);
			// 	console.log(`${tempfinal} .. to hex(from negative) `)
			// }
			// else
			// {
			// 	tempfinal = tempfinal.toString(16);
			// 	console.log(`${tempfinal} from hex `)
			// }
			// console.log(`SOME TEMP: ${tempfinal}`);
			tempfinal = self.twoscomplement(tempfinal)
			tempfinal = tempfinal.toString(16);


			let len;
			if((len =tempfinal.length) < 4)
				for(let i = len; i<4; i++) tempfinal = '0'+tempfinal
			// console.log(`${tempfinal} .....${tempfinal.toString(16)}`)


			let humidity = hexstring.substr(2, 4)
			let humidity1 = parseInt('0x'+humidity)
			let humidity11 = ((humidity1 & 0xff00)>> 8) //+ (humidity1 & 0x00ff)<< 8
			let humidity111 =  (humidity1 & 0x00ff)<< 8
			humidity111+= humidity11
			humidity = humidity111.toString(16)
			humidity1 = parseInt('0x'+humidity)
			let humidityfinal = 100 * humidity1 / 65535
			humidityfinal *= 1000
			// console.log(`humidityerature value (bytes 3 & 4): 0x${humidity} -> ${humidity1} => ${humidityfinal} degrees Celcius `)
			// humidityfinal = Math.floor(humidityfinal);
			humidityfinal = Math.floor(humidityfinal);	//divide by 3 on server to get to 3 decimal places

			humidityfinal = humidityfinal.toString(16);
			let reqhumidityfinallen = 8;
			if((len =humidityfinal.length) < reqhumidityfinallen)
				for(let i = len; i<reqhumidityfinallen; i++) humidityfinal = '0'+humidityfinal

			statusbyte = '0x'+hexstring.substr(2, 2)
			statusbits = parseInt(statusbyte)
			let validbarometertemp = (statusbits & 1);

			if(validbarometertemp === 1)
			{
				let temp = hexstring.substr(13*2, 2*2)
				let temp1 = parseInt('0x'+temp)
				let temp11 = ((temp1 & 0xff00)>> 8) //+ (temp1 & 0x00ff)<< 8
				let temp111 =  (temp1 & 0x00ff)<< 8
				temp111+= temp11
				temp111 /= 100
				// console.log(`Barometer temperature: ${temp1} ${temp111} but humidity temp: ${humiditytemp/0.0625}`)
				temp = temp111.toString(16)
				temp1 = parseInt('0x'+temp)
				// let tempbaromenterfinal = -45 + 175 * (temp1/65535)
				// tempbaromenterfinal = Math.floor(tempbaromenterfinal/0.0625);
				// tempbaromenterfinal = tempbaromenterfinal.toString(16);
				// if(tempbaromenterfinal.length < 4) tempbaromenterfinal = '0'+tempbaromenterfinal

			}

					// humidityfinal = '0'+humidityfinal
			self.hexstring = "24000000000000000000000000000000000000"+humidityfinal+"0000"+tempfinal+"0000"
			// console.log(`temp ${self.hexstring} AND ${humidityfinal} AND ${tempfinal}`)
			// console.log(self.hexstring.length)
			self.payload = new Buffer(self.hexstring, 'hex')
			// console.log(self.payload)
			self.kcs_encode(function(err, result){
				if(err)return;
			})


		}
	}




	/*static*/ getdevAddr(callback)
	{
		let self = this;
		// console.log(self.msg)
		var packet = lora_packet.fromWire(new Buffer(self.msg, 'base64'));
		let msg = packet.toString();
		let devArr;
		try
		{
			//console.log(self.msg)
			devArr = msg.match(/DevAddr = [A-Z0-9a-z]*/i)[0].replace(/DevAddr = ([.]*)/, '$1')

		}catch(error)
		{
		 	console.log(error)
		 	return false;
		}
		self.devArr = devArr
		nodeMon.addNode(devArr)
		return callback(null, devArr);
	}


	/*static*/ kcs_encode(callback)
	{
		let self = this;
		let hexstring = self.hexstring
		let payload = self.payload;
		
		if(payload[0] !== 0x24 && payload[0] !== 0x23)return callback("invalid payload received");

		let packet_bigEndian = [];
		let packet_smallEndian = [];
		//let hexstring = "1c00000001000000fdfffeff090b1400";
		let hexlen = hexstring.length;
		  //  console.log(i)
		for(var i= 0;i<hexlen;i++)
		{
		    packet_smallEndian.push(parseInt("0x"+hexstring[i++]+hexstring[i]));
		   // console.log("0x"+hexstring[i-1]+hexstring[i]+":"+packet_smallEndian)
		}
		let tmp=0;
		//while(tmp=packet_smallEndian.pop())
		let digital1, digital2, analog1, analog2, vbat, temperature, doorstatus;

		while(tmp<hexlen/2)
		{
		    packet_bigEndian.push(packet_smallEndian.pop());
		    tmp++;
		}
		//console.log(packet_bigEndian)
		// digital1 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8)+(packet_bigEndian.pop()<<16)+(packet_bigEndian.pop()<<24);
		// //console.log(packet_bigEndian)
		// digital2 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8)+(packet_bigEndian.pop()<<16)+(packet_bigEndian.pop()<<24);
		// analog1 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);
		// analog2 = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);
		// vbat = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);
		// temperature = packet_bigEndian.pop() + (packet_bigEndian.pop()<<8);     //-32768
		doorstatus = payload[15];
		digital1 = (payload[19]<<24) + (payload[20]<<16) + (payload[21]<<8) + payload[22];
		digital2 = (payload[23]<<8) + payload[24];
		analog1 = (payload[13]<<8) + payload[14];
		analog2 = (payload[16]<<8) + payload[17];
		temperature = (payload[25]<<8) + payload[26];
		vbat = (payload[28]<<8) + payload[27];
		vbat *= 0.006406;

		// analog1 = 4;
		// temperature = 3;
		
		

		/////////////////////////////////////////////////////////////////
		//console.log(packet_bigEndian)
		// console.log("digital1:"+digital1)
		// console.log("digital2:"+digital2)
		// console.log("analog1:"+analog1)
		// console.log("analog2:"+analog2)
		vbat *= 1000;
		// console.log("vbat(mV):"+vbat)
		vbat /= 1000;
		// console.log("vbat(V):"+vbat)
		// console.log("temperature (in enclosure...):"+temperature)

		let time = Math.floor(Date.now() / 1000)//timestamp in seconds
		let sizeoftime = self.roughSizeOfObject(time)
		let sizeofdigital1 = self.roughSizeOfObject(digital1)
		let sizeofdigital2 = self.roughSizeOfObject(digital2)
		let sizeofanalog1 = self.roughSizeOfObject(analog1)
		let sizeofanalog2 = self.roughSizeOfObject(analog2)
		let sizeofvbat = self.roughSizeOfObject(vbat)
		let sizeoftemperature = self.roughSizeOfObject(temperature)
		let packet33chars = []

		// console.log(time+"..."+time)
		// console.log(self.roughSizeOfObject(time))
		//time
		// //sizeoftime is 8 bytes long
		// console.log("sizeoftime:"+sizeoftime+"bytes")
		sizeoftime *= 8//in bits
		time = 100*(time-946684800.0)/16

		packet33chars.push((time<<(sizeoftime-4*8))>>(sizeoftime-4*8)>>(3*8))
		packet33chars.push((time<<(sizeoftime-3*8))>>(sizeoftime-3*8)>>(2*8))
		packet33chars.push((time<<(sizeoftime-2*8))>>(sizeoftime-2*8)>>(1*8))
		packet33chars.push((time<<(sizeoftime-(1*8)))>>(sizeoftime-(1*8))>>(0*8))
		//temperature
		// console.log("sizeoftemperature:"+sizeoftemperature+"bytes")
		sizeoftemperature *= 8//in bits
		                                                                                                // analog1 = analog1/96;
		                                                                                                // temperature = analog1;//send analog 1 inplace of temperature;
		// console.log()
		// temperature = 0.0625;
		temperature *= 0.0625;
		temperature = (temperature+60) * 256
		 
		                                    // console.log("temperature (in enclosure...):"+temperature)
		packet33chars.push((temperature<<(sizeoftemperature-2*8))>>(sizeoftemperature-2*8)>>(1*8))
		packet33chars.push((temperature<<(sizeoftemperature-1*8))>>(sizeoftemperature-1*8)>>(0*8))

		//vbat
		// console.log("sizeofvbat:"+sizeofvbat+"bytes")
		sizeofvbat *= 8//in bits
		vbat = (vbat - 0.2)*1969
		packet33chars.push((vbat<<(sizeofvbat-2*8))>>(sizeofvbat-2*8)>>(1*8))
		packet33chars.push((vbat<<(sizeofvbat-1*8))>>(sizeofvbat-1*8)>>(0*8))
		// packet33chars.push(1)
		// packet33chars.push(1)
		//switch
		packet33chars.push(0x70)
		//port size
		packet33chars.push(0x19)
		//digital1, pulses
		// console.log("sizeofdigital1:"+sizeofdigital1+"bytes")
		sizeofdigital1 *= 8//in bits
		packet33chars.push((digital1<<(sizeofdigital1-4*8))>>(sizeofdigital1-4*8)>>(3*8))
		packet33chars.push((digital1<<(sizeofdigital1-3*8))>>(sizeofdigital1-3*8)>>(2*8))
		packet33chars.push((digital1<<(sizeofdigital1-2*8))>>(sizeofdigital1-2*8)>>(1*8))
		packet33chars.push((digital1<<(sizeofdigital1-1*8))>>(sizeofdigital1-1*8)>>(0*8))
		//digital2,, only 2 bytes
		// console.log("sizeofdigital2:"+sizeofdigital2+"bytes")
		sizeofdigital2 *= 8//in bits
		packet33chars.push((digital2<<(sizeofdigital2-2*8))>>(sizeofdigital2-2*8)>>(1*8))
		packet33chars.push((digital2<<(sizeofdigital2-1*8))>>(sizeofdigital2-1*8)>>(0*8))
		//door status...2nd bit is door status
		// packet33chars.push(0x43)// or try 1 to make second bit zero
		packet33chars.push(doorstatus);
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
		// console.log("packetind: "+packetind)
		//console.log("packetind: "+packetind)
		//let time go last
		// console.log(packet33chars)
		let packet33charsinverted = []
		for(tmp=0;tmp<=packetind;tmp++)packet33charsinverted.push(packet33chars.pop())
		// console.log(packet33chars)
		let packetstr = 0;
		let lastpacketlen = (8*packetind)/6

		//console.log(packet33charsinverted)
		let bitindex, byteindex;

		let packetstosend = [];

		byteindex = 0; 
		let byte;
		let bytet0push = 0;
		//byte = packet33charsinverted.pop()
		let tmpi = 0;
		// console.log("packetind: "+packetind)
		for(tmp=0;tmp<packetind;tmp++)
		{
		    byte = packet33charsinverted.pop()
		    //console.log("is byte:"+byte)
		    for(bitindex=0;bitindex<8;bitindex++)
		    {
		      let bit =   (byte<<(8*7+bitindex))>>(8*7+bitindex)>>(7-bitindex);
		      if(bit === -1)bit = 1;//////////////////////////////////////////////////////// is the sign bit remaining?
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
		//packetind = roughSizeOfObject(packet33charsinverted)/singleitemsize-1
		// console.log("packetind: "+packetind)
		let c = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';

		let strtosend = '';
		for(tmp= 0; tmp<packetind;tmp++)
		{
		    let ind = packetstosendbigEndian.pop();
		    strtosend += c[ind]
		}
		strtosend = self.imei+"|"+strtosend;
		// console.log(strtosend)

		let kcsserver = config.get("/kcsserver");


		Async.each(kcsserver, function(url, callback) {

		    let sendto = url +strtosend;
		    console.log('Sending to  ' + sendto);

		    request(sendto, function (error, response, body) {
				// console.log("Sent to KCS")
				console.log('from kcs:', body); // Print the HTML for the Google homepage. 
				if(error)callback(error)
				else callback()

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

	/*static*/ DevAddrToFakeImei(DevAddr) {
		var imei = "999", bits, digit;
		if (!DevAddr.match(/^[0-9a-f]{8}$/i))
			return ""; //Not 8 hexadecimal characters
		bits = parseInt(DevAddr.substr(-4), 16);
		for (var digits = 3; digits < 14; digits++) {
			digit = (bits & 7).toString(10);
			imei += (bits & 7).toString(10);
			bits >>= 3;
			if (digits == 3)
				bits |= parseInt(DevAddr.substr(0, 4), 16) << 13;
		}
		var c = 0, i, d;
		for (i = 0; i < 14; i += 2) {
			d = imei.charAt(i + 1) << 1;
			c += (imei.charAt(i) - 0) + Math.floor(d / 10) + (d % 10);
		}
		return imei + ((10 - (c % 10)) % 10).toString(10);
	}

	/*static*/ roughSizeOfObject( object ) {

	    var objectList = [];
	    var stack = [ object ];
	    var bytes = 0;

	    while ( stack.length ) {
	        var value = stack.pop();

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

	            for( var i in value ) {
	                stack.push( value[ i ] );
	            }
	        }
	    }
	    return bytes;
	}

}


module.exports = parser
