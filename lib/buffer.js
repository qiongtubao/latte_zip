
		var latte_lib = require("latte_lib");
		var utf8 = latte_lib.utf8;
		
		var Buffer = Uint8Array;
		(function() {
			function checkOffset(offset, ext, length) {
			  if ((offset % 1) !== 0 || offset < 0)
			    throw new RangeError('offset is not uint');
			  if (offset + ext > length)
			    throw new RangeError('Trying to access beyond buffer length');
			}
			function checkInt(buffer, value, offset, ext, max, min) {
			  if ((value % 1) !== 0 || value > max || value < min)
			    throw TypeError('value is out of bounds');
			  if ((offset % 1) !== 0 || offset < 0)
			    throw TypeError('offset is not uint');
			  if (offset + ext > buffer.length || buffer.length + offset < 0)
			    throw RangeError('Trying to write outside buffer length');
			}
			this.slice = function(start, end) {
				var array  = Array.prototype.slice.call(this, start, end);
				return new Buffer(array);
			};
			this.readInt32LE = function(offset, noAssert) {
				if (!noAssert)
    				checkOffset(offset, 4, this.length);
				return (this[offset]) | 
				(this[offset + 1] << 8) |
				(this[offset + 2] << 16) |
				(this[offset + 3] << 24);
			}
			this.readInt16LE = function(offset, noAssert) {
				if (!noAssert)
    				checkOffset(offset, 2, this.length);
				var val = this[offset] | (this[offset + 1] << 8);
				return (val & 0x8000)? val | 0xFFFF0000 : val;
			}
			this.writeInt32LE = function(value, offset, noAssert) {
				if (!noAssert)
   					checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
				this[offset] = value;
				this[offset + 1] = (value >>> 8);
				this[offset + 2] = (value >>> 16);
				this[offset + 3] = (value >>> 24);
			}
			this.writeInt16LE = function(value, offset, noAssert) {	
				if (!noAssert)
   					checkInt(this, value, offset, 2, 0x7fff, -0x8000);		
				this[offset] = value;
				this[offset + 1] = (value >>> 8);
			}
			this.copy = function(buff, start, meStart, meEnd) {
				var meStart = meStart || 0
					, meEnd = meEnd || this.length;
				for(var i = 0,len = meEnd - meStart; i <= len; i++) {
					buff[start + i] = this[meStart + i];
				}
			}
			this.toString = function(encoding, start, end ) {
				var string = utf8.ucs2encode(this);
				return string;
			}
		}).call(Buffer.prototype);
		(function() {
			this.create = function(data) {
				if(typeof data === "string") {
					var data = utf8.ucs2decode(data);	
					var buffer = new Buffer(data.length);
					data.forEach(function(object, index) {
						buffer[index] = object;
					});
					return  buffer;
				}
			}
		}).call(Buffer);
		module.exports = Buffer;
	