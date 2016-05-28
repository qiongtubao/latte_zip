		var latte_lib = require("latte_lib");
		var Async = latte_lib.async;
		/**
		 * Uint8Arrry
		 * @param {[type]} buffer [description]
		 */
		var  Buffer = require("latte_lib/zip/buffer")
		 , InflateRaw = require("latte_lib/zip/inflateRaw").inflateRaw
		 , DeflateRaw = require("latte_lib/zip/deflateRaw").deflateRaw;
		function Zip(buffer) {
			this.buffer = buffer || "";
			//buffer.slice = Array.prototype.slice.bind(buffer);
			this.getEntries();
					
		};
		(function() {
			this.getEntries = function() {
				var self = this;
				var entries = self.entries = [];
				var files = self.files = {};
				var entries0102 = self.entries0102 = [];
				var tmp = 0;
				var buffer = self.buffer;
				while(tmp < buffer.length) {
					if(buffer[tmp] !== 0x50 || buffer[tmp+1] !== 0x4B) {
						tmp++;
						continue;
					}
					if(buffer[tmp+2] === 0x03 && buffer[tmp+3] === 0x04) {
						var entry = {};
						tmp = self.getEntry0304(tmp, entry);
						entries.push(entry);
					}else if(buffer[tmp+2] === 0x01 && buffer[tmp+3] === 0x02) {
						var entry = {};
						tmp = self.getEntry0102(tmp, entry);
						entries0102.push(entry);
					}else{
						tmp++;
						continue;
					}
				}
			}
			this.getEntry0304 = function(tmp, entry) {
				var self = this;
				var buffer = self.buffer;
				entry.begin = tmp;
				
				tmp += 4;
				//4~6解压缩所需版本(\x14\x00) version needed to extract       2 bytes
				entry.unzipVersion = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//6~8通用比特标志位(置比特0位=加密;置比特1位=使用压缩方式6,并使用8k变化目录,否则使用4k变化目录;置比特2位=使用压缩方式6,并使用3个ShannonFano树对变化目录输出编码,否则使用2个ShannonFano树对变化目录输出编码,其它比特位未用)  
				//(\x00\x00) general purpose bit flag        2 bytes
				entry.generalPurpose = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//8~10压缩方式(0=不压缩,1=缩小,2=以压缩因素1缩小,3=以压缩因素2缩小,4=以压缩因素3缩小,5=以压缩因素4缩小,6=自展)
				//(\x08\x00)
				entry.compressionWay = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//10~12文件最后修改时间
				entry.lastModifyTime = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//12~14文件最后修改日期
				entry.lastModifyDate = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//14~18,32位校验码
				entry.crc32 = buffer.slice(tmp,tmp+4);
				tmp += 4;
				//18~22压缩文件大小
				entry.cfileSize = buffer.slice(tmp,tmp+4).readInt32LE(0);
				tmp += 4;
				//22~26未压缩文件大小
				entry.fileSize = buffer.slice(tmp,tmp+4).readInt32LE(0);
				tmp += 4;
				//26~28文件名长
				entry.fileNameSize = buffer.slice(tmp,tmp+2).readInt16LE(0);
				tmp += 2;
				//28~30扩展段长
				entry.extraFieldSize = buffer.slice(tmp,tmp+2).readInt16LE(0);
				tmp += 2;
				//31~30+entry.fileNameSize文件名
				entry.fileName = buffer.slice(tmp,tmp+entry.fileNameSize).toString();
				tmp += entry.fileNameSize;
				//30+fileNameSize~30+fileNameSize+extraFieldSize扩展段
				var b20a2 = buffer.slice(tmp,tmp+2);
				var extraFieldSize = entry.extraFieldSize;
				if(extraFieldSize > 0) {
					entry.extraField = buffer.slice(tmp,tmp+extraFieldSize);
				} else extraFieldSize = 0;
				if(b20a2[0] === 0x20 && b20a2[1] === 0xA2) {
					tmp += 2;
					var tg = buffer.slice(tmp,tmp+2).readInt16LE(0);
					tmp += 2;
					tmp += tg;
				} else tmp += extraFieldSize;
				entry.cfile = buffer.slice(tmp,tmp+entry.cfileSize);
				tmp += entry.cfileSize;
				entry.end = tmp;
				return tmp;

			}
			this.getEntry0102 = function(tmp, entry) {
				var self = this;
				var buffer = self.buffer;
				entry.begin = tmp;
				tmp += 4;
				//4	2	Version made by
				entry.versionMadeBy = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//解压缩所需版本(\x14\x00)  6	2	Version needed to extract (minimum)
				entry.unzipVersion = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//通用比特标志位(置比特0位=加密;置比特1位=使用压缩方式6,并使用8k变化目录,否则使用4k变化目录;置比特2位=使用压缩方式6,并使用3个ShannonFano树对变化目录输出编码,否则使用2个ShannonFano树对变化目录输出编码,其它比特位未用)  
				//(\x00\x00) 8	2	General purpose bit flag
				entry.generalPurpose = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//压缩方式(0=不压缩,1=缩小,2=以压缩因素1缩小,3=以压缩因素2缩小,4=以压缩因素3缩小,5=以压缩因素4缩小,6=自展)
				//(\x08\x00)10	2	Compression method
				entry.compressionWay = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//文件最后修改时间12	2	File last modification time
				entry.lastModifyTime = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//文件最后修改日期14	2	File last modification date
				entry.lastModifyDate = buffer.slice(tmp,tmp+2);
				tmp += 2;
				//32位校验码16	4	CRC-32
				entry.crc32 = buffer.slice(tmp,tmp+4);
				tmp += 4;
				//压缩文件大小20	4	Compressed size
				entry.cfileSize = buffer.slice(tmp,tmp+4).readInt32LE(0);
				tmp += 4;
				//未压缩文件大小24	4	Uncompressed size
				entry.fileSize = buffer.slice(tmp,tmp+4).readInt32LE(0);
				tmp += 4;
				//文件名长28	2	File name length (n)
				var n = entry.fileNameSize = buffer.slice(tmp,tmp+2).readInt16LE(0);
				tmp += 2;
				//扩展段长30	2	Extra field length (m)
				var m = entry.extraFieldSize = buffer.slice(tmp,tmp+2).readInt16LE(0);
				tmp += 2;
				//32	2	File comment length (k)
				var k = entry.fileCommentSize = buffer.slice(tmp,tmp+2).readInt16LE(0);
				tmp += 2;
				//34	2	Disk number where file starts
				var k = entry.diskNumStarts = buffer.slice(tmp,tmp+2).readInt16LE(0);
				tmp += 2;
				//36	2	Internal file attributes
				entry.internalFileAttrs = buffer.slice(tmp,tmp+2).readInt16LE(0);
				tmp += 2;
				//38	4	External file attributes
				entry.externalFileAttrs = buffer.slice(tmp,tmp+4).readInt32LE(0);
				tmp += 4;
				//42	4	Relative offset of local file header. This is the number of bytes between the start of the first disk on which the file occurs, and the start of the local file header. This allows software reading the central directory to locate the position of the file inside the ZIP file.
				entry.offsetOfHeader = buffer.slice(tmp,tmp+4).readInt32LE(0);
				tmp += 4;
				//46	n	File name
				entry.fileName = buffer.slice(tmp,tmp+n).toString();
				tmp += n;
				//46+n	m	Extra field
				entry.extraField = buffer.slice(tmp,tmp+m);
				tmp += m;
				//46+n+m	k	File comment
				entry.fileComment = buffer.slice(tmp,tmp+k).toString();
				tmp += k;
				entry.end = tmp;
				return tmp;
			}
			this.getEntry = function(fileName, type) {
				type = type || "";
				var self = this;
				var entries = self["entries"+ type];
				var entry = undefined;
				for(var i = 0, len = entries.length; i < len; i++) {
					if(fileName === entries[i].fileName) {
						entry = entries[i];
						break;
					}
				}
				return entry;
			}
			function arrayLikeToString(array) {
			    // Performances notes :
			    // --------------------
			    // String.fromCharCode.apply(null, array) is the fastest, see
			    // see http://jsperf.com/converting-a-uint8array-to-a-string/2
			    // but the stack is limited (and we can get huge arrays !).
			    //
			    // result += String.fromCharCode(array[i]); generate too many strings !
			    //
			    // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
			    var chunk = 65536;
			    var result = [],
			        len = array.length,
			        type = "uint8array",
			        k = 0,
			        canUseApply = true;
			      try {
			         switch(type) {
			            case "uint8array":
			               String.fromCharCode.apply(null, new Uint8Array(0));
			               break;
			            case "nodebuffer":
			               String.fromCharCode.apply(null, nodeBuffer(0));
			               break;
			         }
			      } catch(e) {
			         canUseApply = false;
			      }

			      // no apply : slow and painful algorithm
			      // default browser on android 4.*
			      if (!canUseApply) {
			         var resultStr = "";
			         for(var i = 0; i < array.length;i++) {
			            resultStr += String.fromCharCode(array[i]);
			         }
			    	return resultStr;
			    }
			    while (k < len && chunk > 1) {
			        try {
			            if (type === "array" || type === "nodebuffer") {
			                result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
			            }
			            else {
			                result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
			            }
			            k += chunk;
			        }
			        catch (e) {
			            chunk = Math.floor(chunk / 2);
			        }
			    }
			    return result.join("");
			}
			var Buffer = require("./buffer")
				, crc = require("./crc32");
				var replaceBuf = function(begin, end, buf, buf2) {
					var buffer =  new Buffer(buf.length - (end - begin) + buf2.length);
					for(var i = 0; i < buffer.length; i++) {
						if(i < begin) {
							buffer[i] = buf[i];
						}else if(i >= begin && i < begin + buf2.length) {
							buffer[i] = buf2[i - begin];
						}else if(i >= begin + buf2.length) {
							buffer[i] = buf[i - buf2.length + (end-begin)];
						}
					}
					return buffer;
				};
			this.updateEntry = function(fileName, data, callback) {
				var self = this;
				self.toEntryBuf(fileName, data, function(err, buf) {
					var entry = self.getEntry(fileName);
					var begin = 0, end = 0;
					if(entry) {
						begin = entry.begin;
						end = entry.end;
					}
					self.buffer =  replaceBuf(begin, end, self.buffer, buf);
					self.zip();
				});
			}
			this.zip = function(fileComment, comment) {
				fileComment = fileComment || "";
				comment = comment || "";
				var self = this;
				self.getEntries();
				var entries0102 = [];
				for(var i = 0; i < self.entries.length; i++) {
					var entry = self.entries[i];
					var n = entry.fileNameSize;
					var m = 0;
					var k = fileComment.length;
					var entry0102 = new Buffer(46+n+m+k);
					entries0102.push(entry0102);
					entry0102[0] = 0x50;
					entry0102[1] = 0x4B;
					entry0102[2] = 0x01;
					entry0102[3] = 0x02;
					//Version made by
					entry0102[4] = 0x2D;
					entry0102[5] = 0x00;
					//Version needed to extract (minimum) 14 00
					entry0102[6] = entry.unzipVersion[0];
					entry0102[7] = entry.unzipVersion[1];
					//8	2	General purpose bit flag 06 00
					entry0102[8] = entry.generalPurpose[0];
					entry0102[9] = entry.generalPurpose[1];
					//10	2	Compression method 08 00
					entry0102[10] = entry.compressionWay[0];
					entry0102[11] = entry.compressionWay[1];
					//12	2	File last modification time 00 00
					entry0102[12] = entry.lastModifyDate[0];
					entry0102[13] = entry.lastModifyDate[1];
					//14	2	File last modification date 21 00
					entry0102[14] = entry.lastModifyDate[0];
					entry0102[15] = entry.lastModifyDate[1];
					//16	4	CRC-32
					entry0102[16] = entry.crc32[0];
					entry0102[17] = entry.crc32[1];
					entry0102[18] = entry.crc32[2];
					entry0102[19] = entry.crc32[3];
					//20	4	Compressed size cfileSize
					entry0102.writeInt32LE(entry.cfileSize,20);
					//24	4	Uncompressed size fileSize
					entry0102.writeInt32LE(entry.fileSize,24);
					//28	2	File name length (n)
					entry0102.writeInt16LE(n,28);
					//30	2	Extra field length (m)
					entry0102.writeInt16LE(m,30);
					//32	2	File comment length (k)
					entry0102.writeInt16LE(k,32);
					//34	2	Disk number where file starts
					entry0102.writeInt16LE(0,34);
					//36	2	Internal file attributes
					entry0102[36] = 0x00;
					entry0102[37] = 0x00;
					//38	4	External file attributes
					entry0102[38] = 0x00;
					entry0102[39] = 0x00;
					entry0102[40] = 0x00;
					entry0102[41] = 0x00;
					//42	4	Relative offset of local file header. This is the number of bytes between the start of the first disk on which the file occurs, and the start of the local file header. This allows software reading the central directory to locate the position of the file inside the ZIP file.
					entry0102.writeInt32LE(entry.begin,42);
					//46	n	File name
					var fileNameBuf = Buffer.create(entry.fileName);
					for(var j=0; j<n; j++) {
						entry0102[46+j] = fileNameBuf[j];
					}
					//46+n	m	Extra field
					//46+n+m	k	File comment
					var fileCommentBuf =  Buffer.create(fileComment);
					for(var j=0; j<k; j++) {
						entry0102[46+n+m+j] = fileCommentBuf[j];
					}
				}
				//0506 After all the central directory entries comes the end of central directory record, which marks the end of the ZIP file:
				var entry0506 = new Buffer(22+comment.length);
				// 0	4	End of central directory signature = 0x06054b50
				entry0506[0] = 0x50;
				entry0506[1] = 0x4B;
				entry0506[2] = 0x05;
				entry0506[3] = 0x06;
				// 4	2	Number of this disk
				entry0506[4] = 0x00;
				entry0506[5] = 0x00;
				//6	2	Disk where central directory starts
				entry0506[6] = 0x00;
				entry0506[7] = 0x00;
				//8	2	Number of central directory records on this disk,entries0102.length
				entry0506.writeInt16LE(entries0102.length,8);
				//10	2	Total number of central directory records
				entry0506.writeInt16LE(entries0102.length,10);
				//12	4	Size of central directory (bytes)
				var entries0102Size = 0;
				for(var i=0; i<entries0102.length; i++) {
					entries0102Size += entries0102[i].length;
				}
				entry0506.writeInt32LE(entries0102Size,12);
				//16	4	Offset of start of central directory, relative to start of archive
				var entriesSize = 0;
				
				for(var i=0; i<self.entries.length; i++) {
					entriesSize = entriesSize + self.entries[i].end - self.entries[i].begin;
				}
				entry0506.writeInt32LE(entriesSize,16);
				//20	2	Comment length (n)
				entry0506.writeInt16LE(comment.length,20);
				//22	n	Comment
				var commentBuf = new Buffer(comment);
				for(var i=0; i<commentBuf.length; i++) {
					entry0506[22+i] = commentBuf[i];
				}
				
				//重新组合buffer
				var lenbuf1 = 0;
				lenbuf1 += entriesSize;

				for(var i=0; i<entries0102.length; i++) {
					var entry0102 = entries0102[i];
					lenbuf1 += entry0102.length;
				}
				lenbuf1 += entry0506.length;
				var buffer1 = new Buffer(lenbuf1);
				var targetStart = 0;
				for(var i=0; i<self.entries.length; i++) {
					self.buffer.copy(buffer1,targetStart,self.entries[i].begin,self.entries[i].end);
					targetStart = targetStart + self.entries[i].end - self.entries[i].begin;
				}

				for(var i=0; i<entries0102.length; i++) {
					var entry0102 = entries0102[i];
					entry0102.copy(buffer1,targetStart);
					targetStart += entry0102.length;
				}
				entry0506.copy(buffer1,targetStart);
				self.buffer = buffer1;
				self.getEntries();
			}
			var zlib = require("./lib");
			this.toEntryBuf = function(fileName, fileBuf, callback) {
				var c32Num = crc.crc32(fileBuf);
				var fileLength = fileBuf.length;
				var fileName = Buffer.create(fileName);
				//var array = [173,146,205,78,195,48,12,199,207,188,69,228,251,234,110,147,16,66,205,118,153,144,118,155,80,121,0,147,184,31,106,27,71,73,128,238,237,9,92,216,164,49,118,192,55,127,253,253,179,229,106,59,79,163,122,231,16,123,113,26,150,69,9,138,157,17,219,187,86,195,75,253,180,120,0,21,19,57,75,163,56,214,112,228,8,219,205,221,183,85,207,60,82,202,141,177,235,125,84,89,201,69,13,93,74,254,17,49,154,142,39,138,133,120,118,57,211,72,152,40,101,55,180,232,201,12,212,50,174,202,242,30,195,169,6,92,82,86,123,171,33,236,237,26,84,125,244,124,203,4,105,154,222,240,78,204,219,196,46,93,24,132,60,39,118,150,237,194,135,220,31,82,159,247,82,53,133,150,147,6,43,230,144,195,17,201,251,34,75,3,94,227,90,221,206,245,251,230,56,113,34,75,137,208,72,224,235,84,95,21,127,99,45,255,243,92,231,21,63,76,243,136,31,18,134,87,145,225,148,168,194,179,215,216,124,2];

				var data = DeflateRaw(fileBuf);
				
				var eb = new Buffer(30+fileName.length+data.length);
				eb[0] = 0x50;
				eb[1] = 0x4B;
				eb[2] = 0x03;
				eb[3] = 0x04;
				//4~5解压缩所需版本(\x14\x00)
				eb[4] = 0x14;
				eb[5] = 0x00;
				//6~7通用比特标志位(置比特0位=加密;置比特1位=使用压缩方式6,并使用8k变化目录,否则使用4k变化目录;置比特2位=使用压缩方式6,并使用3个ShannonFano树对变化目录输出编码,否则使用2个ShannonFano树对变化目录输出编码,其它比特位未用)  
				//(\x00\x00)
				eb[6] = 0x06;
				eb[7] = 0x00;
				//8~9解压缩所需版本(\x08\x00)
				eb[8] = 0x08;
				eb[9] = 0x00;
				//10~11文件最后修改时间
				eb[10] = 0x00;
				eb[11] = 0x00;
				//12~13文件最后修改日期
				eb[12] = 0x21;
				eb[13] = 0x00;
				//14~17,32位校验码
				eb.writeInt32LE(c32Num,14);
				//18~21压缩文件大小
				eb.writeInt32LE(data.length,18);
				//22~25未压缩文件大小
				eb.writeInt32LE(fileLength,22);
				//26~27File name length
				eb.writeInt16LE(fileName.length,26);
				//28~29Extra field length
				eb.writeInt16LE(0,28);
				//30 file name
				for(var i=0; i<fileName.length; i++) {
					eb[i+30] = fileName[i];
				}
				//Extra field
				for(var i=0; i<data.length; i++) {
					eb[i+30+fileName.length] = data[i];
				}
				
				callback(null,eb);
				
			}
			this.getFile = function(fileName, callback) {
				var self = this;
				var data = InflateRaw(self.getEntry(fileName).cfile);
				var utf8 = require("latte_lib/utf8");
				var c = utf8.ucs2encode(data);
				callback(null, c);
				//var data = inflateRaw(self.getEntry(fiileName).cfile);
				
			}
		}).call(Zip.prototype);
		(function() {
			this.create = function(data) {
				return  new Zip(data);
			}
		}).call(module.exports);
	