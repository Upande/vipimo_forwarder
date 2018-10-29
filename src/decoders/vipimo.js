const decoder = require('./decoders.js');

class vipimodecoder extends decoder{
	constructor()
	{
		super();
		let self = this;
	}


	bigEndiantoSmallEndian_n_co(hexstring){
		let len = hexstring.length;
		let bytes = [];
		let i = 0;

		if(len %2 == 1)
			hexstring = '0' + hexstring
		
		len = hexstring.length;
		for(i = 0; i< len; i++) {
			bytes[i] = hexstring[i++] + hexstring[i];
		}

		return bytes.reverse().join("");
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

		console.log(hexstring)
		//fefe (4)68 (6)10 (8)41060038007400(Len=14) (22)Controle(81) (22)Length(16) -901f- SER-00 UNIT-2c flow(34 53) 0000 unit(2c) lastmonth(00000000) 22 43 09 23 10
		//1820 00127b 16
		for(var i= 0;i<hexlen;i++)
		{
		    packet_bigEndian.push(parseInt("0x"+hexstring[i++]+hexstring[i]));
		}

		// 1844 (4)01 (6)00 0000000000000000001900
		//1844 01240000000000000000000018

		// 0,2bytes: start 0x1844
		// 2: 1 byte: Node number
		// 3: byte: status bits

		let nodeNumber = parseInt('0x'+hexstring.substr(4, 2));
		let statusbits = parseInt('0x'+hexstring.substr(6, 2)).toString(2);

		let len = statusbits.length;
		while (len < 8) {
			statusbits = '0' + statusbits
			len = statusbits.length;
		}

		let isBattery = parseInt(statusbits[7], 2);
		let isInternalTemperature = parseInt(statusbits[2], 2);
		let numDigital = parseInt(statusbits[5]+statusbits[6], 2);
		let numAnalog = parseInt(statusbits[3]+statusbits[4], 2);
		let numTemperature = parseInt(statusbits[0]+statusbits[1], 2); // other temperatures apart from box temperature

		// console.log(nodeNumber)
		// console.log(statusbits)
		// console.log(isBattery)
		// console.log(isInternalTemperature)
		// console.log(numDigital)
		// console.log(numAnalog)
		// console.log(numTemperature)

		let ret = {}
		if(isBattery) {
			let battery = hexstring.substr(hexstring.length - 4, 4)
			// battery = self.bigEndiantoSmallEndian_n_co(battery)
			battery = parseInt('0x'+battery)
			ret['B'] = (battery/1000).toFixed(4);
		}

		if(isInternalTemperature) {
			let temp = hexstring.substr(hexstring.length - 4, 4)
			console.log(temp)
			// temp = self.bigEndiantoSmallEndian_n_co(temp);
			temp = parseInt('0x'+temp)
			ret['T1'] = temp.toFixed(4);
		}

		//1844
		//01
		//24
		//01
		//00000000
		//0000000e
		//001a
		try{
		if(numDigital > 0) {
			let digitalStatus = parseInt('0x'+hexstring.substr(8, 2)).toString(2);
			let len = digitalStatus.length;
			while (len < 8) {
				digitalStatus = '0' + digitalStatus
				len = digitalStatus.length;
			}
			console.log(`DIGITAL STATUS: ${digitalStatus}`)
			let digital1 = parseInt('0x'+hexstring.substr(10, 8));
			ret['D1'] = digital1
			ret['DS1'] = parseInt(digitalStatus[7], 2);
			if(numDigital > 1) {
				let digital2 = parseInt('0x'+hexstring.substr(18, 8));
				ret['D2'] = digital2
				ret['DS2'] = parseInt(digitalStatus[6], 2);
			}
			if(numDigital > 2) {
				let digital3 = parseInt('0x'+hexstring.substr(26, 8));
				ret['D3'] = digital3
				ret['DS3'] = parseInt(digitalStatus[5], 2);
			}
			if(numDigital > 3) {
				let digital4 = parseInt('0x'+hexstring.substr(34, 8));
				ret['D4'] = digital4
				ret['DS4'] = parseInt(digitalStatus[4], 2);
			}
		} else {
			if(numAnalog > 0) {
				let analog1 = parseInt('0x'+hexstring.substr(8, 4));
				ret['A1'] = analog1.toFixed(4);
				if(numDigital > 1) {
					let analog2 = parseInt('0x'+hexstring.substr(12, 4));
					ret['A2'] = analog2.toFixed(4);
				}
				if(numDigital > 2) {
					let analog3 = parseInt('0x'+hexstring.substr(16, 4));
					ret['A3'] = analog3.toFixed(4);
				}
				if(numDigital > 3) {
					let analog4 = parseInt('0x'+hexstring.substr(20, 4));
					ret['A4'] = analog4.toFixed(4);
				}
			}
		}
	}catch(err) {
		console.log(err)
	}

		console.log(ret)

		return ret;
	}
}


module.exports =  new vipimodecoder()