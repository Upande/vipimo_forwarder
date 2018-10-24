const decoder = require('./decoders.js');

class bovedecoder extends decoder{
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

		//console.log(hexstring)
		//fefe (4)68 (6)10 (8)41060038007400(Len=14) (22)Controle(81) (22)Length(16) -901f- SER-00 UNIT-2c flow(34 53) 0000 unit(2c) lastmonth(00000000) 22 43 09 23 10
		//1820 00127b 16
		for(var i= 0;i<hexlen;i++)
		{
		    packet_bigEndian.push(parseInt("0x"+hexstring[i++]+hexstring[i]));
		}

		let boveType = hexstring.substr(6, 2)
		let boveAddress = hexstring.substr(8, 14)
		let control = hexstring.substr(22, 2)
		let length = hexstring.substr(24, 2)
		let DI0 = hexstring.substr(26, 2)
		let DI1 = hexstring.substr(28, 2)
		let ser = hexstring.substr(30, 2)
		let units = hexstring.substr(32, 2)
		let flow = hexstring.substr(34, 4)
		let unitsLastMonth = hexstring.substr(42, 2)
		let lastmonth = hexstring.substr(44, 4)

		boveAddress = self.bigEndiantoSmallEndian_n_co(boveAddress)
		flow = self.bigEndiantoSmallEndian_n_co(flow)

		let water = parseInt(flow.substr(0, 2)) + parseInt(flow.substr(2, 2)) /100

		let ret = {}

		ret['W1'] = water;

		console.log(ret)

		return ret;
	}
}


module.exports =  new bovedecoder()