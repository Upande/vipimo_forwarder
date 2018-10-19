const decoder = require('./decoders.js');

class kcsdecoder extends decoder{
	constructor()
	{
		super();
		let self = this;
	}

	async decode () {
		let self = this;
		let options = self.options
		let hexstring = options.hexstring
		let NodeType = options.NodeType;
		let payload = options.payload;

		let packet_bigEndian = [];
		let packet_smallEndian = [];
		let hexlen = hexstring.length;
		  //  console.log(i)
		for(var i= 0;i<hexlen;i++)
		{
		    packet_smallEndian.push(parseInt("0x"+hexstring[i++]+hexstring[i]));
		}
		let tmp=0;
		let digital1, digital2, analog1, analog2, vbat, temperature, doorstatus;

		while(tmp<hexlen/2)
		{
		    packet_bigEndian.push(packet_smallEndian.pop());
		    tmp++;
		}
		doorstatus = payload[15];
		digital1 = (payload[19]<<24) + (payload[20]<<16) + (payload[21]<<8) + payload[22];
		digital2 = (payload[23]<<8) + payload[24];
		analog1 = (payload[13]<<8) + payload[14];
		analog2 = (payload[16]<<8) + payload[17];
		temperature = (payload[25]<<8) + payload[26];
		try
		{
			let payloadlen = payload.length;
			vbat = (payload[--payloadlen]<<8) + payload[--payloadlen];
		}catch(error)
		{
			vbat = (payload[28]<<8) + payload[27];
		}
		
		vbat *= 0.006406;		

		temperature *= 0.0625
		// console.log("digital1:"+digital1)
		// console.log("digital2:"+digital2)
		// console.log("analog1:"+analog1)
		// console.log("analog2:"+analog2)
		// console.log("temperature:"+temperature)
		// console.log("vbat:"+vbat) // corrent

		if(analog1 > 32768) analog1 = ((~(analog1+1)) <<16)>>16
		if(analog2 > 32768) analog2 = ((~(analog2+1)) <<16)>>16
	
		// console.log("digital1:"+digital1)
		// console.log("digital2:"+digital2)
		// console.log("analog1:"+analog1)
		// console.log("analog2:"+analog2)
		// console.log("temperature:"+temperature)
		// console.log("vbat:"+vbat) // corrent
		if(doorstatus === 67) doorstatus = 0;
		else doorstatus = 1;

		let ret = {}
		switch (NodeType) {
			case 'D2A2TB' :         // never used in kcs encoding
				ret.D1 = digital1;
				ret.D2 = digital2;
				ret.D3 = doorstatus;   // door state
				ret.A1 = analog1;
				ret.A2 = analog2;
				ret.T1 = temperature;
				ret.B = vbat;
				break;
			case 'D2TB' :
				ret.D1 = digital1;
				ret.D2 = digital2;
				ret.D3 = doorstatus;   // door state
				ret.T1 = temperature;
				ret.B = vbat;
				break;
			case 'D2AB' :
				ret.D1 = digital1;
				ret.D2 = digital2;
				ret.D3 = doorstatus;  // door state
				ret.A1 = analog1;
				ret.B = vbat;
				break;

		}

		return ret;
	}
}


module.exports =  new kcsdecoder()