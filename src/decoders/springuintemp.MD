The datapacket consists of 19 bytes:

0: 1 byte, Status/flags
1-2: 2 bytes, unsigned humidity of the humidity sensor
3-4: 2 bytes, unsigned temperature of the humidity sensor
5-8: 4 bytes, unsigned pressure of the barometric pressure sensor
9-10: 2 bytes, unsigned battery voltage
11-12: 2 bytes, signed box temperature
13-14: 2 bytes, signed barometer temperature
15-16: 2 bytes, signed differential pressure sensor pressure
17-18: 2 bytes, signed differential pressure sensor temperature

Byte 0: Status/flags:
These are 8 bits: b7...b0, b7 is the most significant bit, b0 the least significant bit.
b7, b6, b5: reserved

b4: if this bit is 1, the differential pressure sensor is a 500Pa range model and the factor is 60 counts/Pascal
    if this bit is 0, the differential pressure sensor is a 125Pa range model and the factor is 240 counts/Pascal

b3: if this bit is 1, the reading of the differential pressure sensor is valid
    if this bit is 0 the reading of the differential pressure sensor is NOT valid

b2: if this bit is 1, the barometer chip is a BMP280 model
    if this bit is 0, the barometer chip is a NPA201 model -- no longer used, because the BMP280 offers better precision

b1: if this bit is 1, the reading of the barometric sensor is valid
    if this bit is 0, the reading of the barometric sensor is NOT valid

b0: if this bit is 1, the reading of the humidity sensor is valid
    if this bit is 0, the reading of the humidity sensor is NOT valid
    

Byte 1-2: 2 bytes, unsigned humidity of the humidity sensor
Convert this value to %RH using the following formula: %RH = 100 * value / (2^16 -1)
This value is valid, only if b0 is 1

3-4: 2 bytes, unsigned temperature of the humidity sensor
Convert this value to a temperature using the following formula: T (degrees Celcius) = -45 + 175 * value / (2^16 -1)
This value is valid, only if b0 is 1

5-8: 4 bytes, unsigned pressure of the barometric pressure sensor
This is the barometric pressure in Pascals. Usually barometric pressure is given in hectoPascals, therefore the value has to be divided by 100 to get a value in hectoPascals. Note that in meteorology, this value is converted to the sea-level equivalent.
This value is valid, only if b1 is 1

9-10: 2 bytes, unsigned battery voltage
Battery voltage in milliVolts. Note that the RHTPdP uses a 3.6V Lithium battery, which stays at 3.5-3.6V for a very long time and then suddenly drops. The device stops functioning at around 2.8V and the differential pressure sensor (if present) at around 3.0V.

11-12: 2 bytes, signed box temperature
Box temperature in degrees Celcius. This value is indicative at best.

13-14: 2 bytes, signed barometer temperature
Temperature reported by the barometric pressure sensor. This value is in centidegrees Celcius. To get a value in degrees Celcius, divide by 100.
This value is valid, only if b1 is 1

15-16: 2 bytes, signed differential pressure sensor pressure
Differential pressure reported by the connected differential pressure sensor.
If b4 is 1: divide by 60 to get the value in Pascal. The range is +-500Pa
If b4 is 0: divide by 240 to get the value in Pascal. The range is +- 125Pa
This value is valid, only if b3 is 1.

17-18: 2 bytes, signed differential pressure sensor temperature
Temperature reported by the connected differential pressure sensor. This value is in centidegrees Celcius. To get a value in degrees Celcius, divide by 100.
This value is valid, only if b3 is 1.