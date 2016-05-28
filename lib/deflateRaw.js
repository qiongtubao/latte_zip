
		(function() {
			var utils = require("./utils/common")
				, zstream = require("./zlib/zstream")
				, zlib_deflate = require("./zlib/deflate")
				, strings = require("./utils/strings");

			var Z_NO_FLUSH      = 0;
			var Z_FINISH        = 4;

			var Z_OK            = 0;
			var Z_STREAM_END    = 1;

			var Z_DEFAULT_COMPRESSION = -1;

			var Z_DEFAULT_STRATEGY    = 0;

			var Z_DEFLATED  = 8;
			function Deflate(options) {
				this.options = utils.assign({
				    level: Z_DEFAULT_COMPRESSION,
				    method: Z_DEFLATED,
				    chunkSize: 16384,
				    windowBits: 15,
				    memLevel: 8,
				    strategy: Z_DEFAULT_STRATEGY,
				    to: ''
			  	}, options || {});
			  	var opt = this.options;

				if (opt.raw && (opt.windowBits > 0)) {
					opt.windowBits = -opt.windowBits;
				}

				else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
					opt.windowBits += 16;
				}

				this.err    = 0;      // error code, if happens (0 = Z_OK)
				this.msg    = '';     // error message
				this.ended  = false;  // used to avoid multiple onEnd() calls
				this.chunks = [];     // chunks of compressed data

				this.strm = new zstream();
				this.strm.avail_out = 0;

				var status = zlib_deflate.deflateInit2(
					this.strm,
					opt.level,
					opt.method,
					opt.windowBits,
					opt.memLevel,
					opt.strategy
				);

				if (status !== Z_OK) {
					throw new Error(msg[status]);
				}

				if (opt.header) {
					zlib_deflate.deflateSetHeader(this.strm, opt.header);
				}
			};
			(function() {
				this.push = function(data, mode) {
					var strm = this.strm;
					var strm = this.strm;
					var chunkSize = this.options.chunkSize;
					var status, _mode;

					if (this.ended) { return false; }

					_mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

					// Convert data if needed
					if (typeof data === 'string') {
						// If we need to compress text, change encoding to utf8.
						strm.input = strings.string2buf(data);
					} else {
						strm.input = data;
					}

					strm.next_in = 0;
					strm.avail_in = strm.input.length;

					do {
						if (strm.avail_out === 0) {
						  strm.output = new utils.Buf8(chunkSize);
						  strm.next_out = 0;
						  strm.avail_out = chunkSize;
						}
						status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

						if (status !== Z_STREAM_END && status !== Z_OK) {
						  this.onEnd(status);
						  this.ended = true;
						  return false;
						}
						if (strm.avail_out === 0 || (strm.avail_in === 0 && _mode === Z_FINISH)) {
						  if (this.options.to === 'string') {
						    this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
						  } else {
						    this.onData(utils.shrinkBuf(strm.output, strm.next_out));
						  }
						}
					} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

					// Finalize on the last chunk.
					if (_mode === Z_FINISH) {
						status = zlib_deflate.deflateEnd(this.strm);
						this.onEnd(status);
						this.ended = true;
						return status === Z_OK;
					}

					return true;	
				}
				this.onData = function(chunk) {
					this.chunks.push(chunk);
				}
				this.onEnd = function(status) {
					if(status === Z_OK) {
						if(this.options.to === "string") {
							this.result = this.chunks.join("");
						}else{
							this.result = utils.flattenChunks(this.chunks);
						}
					}
					this.chunks = [];
					this.err = status;
					this.msg = this.strm.msg;
				}
			}).call(Deflate.prototype);
				function deflate(input, options) {
					var deflator = new Deflate(options);
					deflator.push(input, true);
					if(deflator.err) { throw deflator.msg;}
					return deflator.result;
				}
			this.deflateRaw = function(input, options) {
				options = options || {};
				options.raw = true;
				return deflate(input, options);
			}
		}).call(module.exports);
	