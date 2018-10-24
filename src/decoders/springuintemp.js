const decoder = require('./decoders.js');

class springuintempdecoder extends decoder{
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
		  //  console.log(i)
		 // console.log(hexstring)
		for(var i= 0;i<hexlen;i++)
		{
		    packet_bigEndian.push(parseInt("0x"+hexstring[i++]+hexstring[i]));
		}

		let statusFlags = packet_bigEndian[0];
		let bitArray = [];
		for(let i = 0; i <= 7; i++){
			let compare = (1<<i)
			bitArray[i] = ((statusFlags) & compare) >> i
		}

		let validhumiditysensor = bitArray[0];
		let validbarometricsensor = bitArray[1];
		let baromerchip = bitArray[2];
		let validdiffpressuresensor = bitArray[3];
		let diffpressuresensorcountsperpascal = bitArray[4];

		let ret = {}


		let boxtemp = hexstring.substr(22, 4)
		let boxtemp1 = parseInt('0x'+boxtemp)
		let boxtemp11 = ((boxtemp1 & 0xff00)>> 8) //+ (humidity1 & 0x00ff)<< 8
		let boxtemp111 =  (boxtemp1 & 0x00ff)<< 8
		boxtemp111+= boxtemp11
		boxtemp = boxtemp11.toString(16)
		boxtemp1 = parseInt('0x'+boxtemp)
		let boxtempfinal = boxtemp1;
		ret['T1'] = boxtempfinal.toFixed(4);


		let battery = hexstring.substr(18, 4)
		battery = self.bigEndiantoSmallEndian_n_co(battery)
		battery = parseInt('0x'+battery)
		ret['B'] = (battery/1000).toFixed(4);



		if(validbarometricsensor === 1)
		{
			let humidity = hexstring.substr(2, 4)
			let humidity1 = parseInt('0x'+humidity)
			let humidity11 = ((humidity1 & 0xff00)>> 8) 
			let humidity111 =  (humidity1 & 0x00ff)<< 8
			humidity111+= humidity11
			humidity = humidity111.toString(16)
			humidity1 = parseInt('0x'+humidity)
			let humidityfinal = 100 * humidity1 / 65535
			ret['H1'] = humidityfinal;

			let temp = hexstring.substr(6, 4)
			let temp1 = parseInt('0x'+temp)
			let temp11 = ((temp1 & 0xff00)>> 8) 
			let temp111 =  (temp1 & 0x00ff)<< 8
			temp111+= temp11
			temp = temp111.toString(16)
			temp1 = parseInt('0x'+temp)
			let tempfinal = -45 + 175 * (temp1/65535)
			ret['T4'] = tempfinal.toFixed(4);
		}

		if(validhumiditysensor === 1)
		{
			let temp = hexstring.substr(26, 4)				// this is a signed temperature. What happens for negative values?
			let temp1 = parseInt('0x'+temp)
			let temp11 = ((temp1 & 0xff00)>> 8) 
			let temp111 =  (temp1 & 0x00ff)<< 8
			temp111+= temp11
			temp = temp111.toString(16)
			temp1 = parseInt('0x'+temp)
			let tempfinal = temp1/100
			ret['T2'] = tempfinal.toFixed(4);

			let pressure = hexstring.substr(10, 8)
			pressure = self.bigEndiantoSmallEndian_n_co(pressure)
			pressure = parseInt('0x'+pressure)
			let pressurefinal = pressure/100   // convert from Pascals to hectopascals
			ret['P1'] = pressurefinal.toFixed(4);

		}

		// console.log(ret)

		return ret;
	}
}


module.exports =  new springuintempdecoder()