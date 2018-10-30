const decoder = require('./decoders.js');

class vipimoweatherdecoder extends decoder{
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
		let rainvalue = parseInt('0x'+hexstring.substr(6, 8)).toString(2);
		let temp = parseInt('0x'+hexstring.substr(14, 8)).toString(2);
		let bmp_temp = parseInt('0x'+hexstring.substr(22, 8)).toString(2);
		let sht_temp = parseInt('0x'+hexstring.substr(30, 8)).toString(2);
		let hum = parseInt('0x'+hexstring.substr(38, 8)).toString(2);
		let pressure = parseInt('0x'+hexstring.substr(46, 8)).toString(2);
		let battery = hexstring.substr(hexstring.length - 4, 4)
			

		let ret = {}
		battery = parseInt('0x'+battery)
		ret['B'] = (battery/1000).toFixed(4);

		// what units
		pressure = parseInt('0x'+pressure)
		pressure = ~(pressure+1)  // from twos complement
		ret['P1'] = pressure

		temp = parseInt('0x'+temp)
		temp = ~(temp+1)  // from twos complement
		ret['T1'] = temp/1000

		bmp_temp = parseInt('0x'+bmp_temp)
		bmp_temp = ~(bmp_temp+1)  // from twos complement
		ret['T2'] = bmp_temp/1000

		sht_temp = parseInt('0x'+sht_temp)
		sht_temp = ~(sht_temp+1)  // from twos complement
		ret['T3'] = sht_temp/1000

		hum = parseInt('0x'+hum)
		hum = ~(hum+1)  // from twos complement
		ret['H1'] = hum


		console.log(ret)

		return ret;
	}
}


module.exports =  new vipimoweatherdecoder()