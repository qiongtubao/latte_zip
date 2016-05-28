
		(function() {
			/* Allowed flush values; see deflate() and inflate() below for details */
		  this.Z_NO_FLUSH =        0;
		  this.Z_PARTIAL_FLUSH =   1;
		  this.Z_SYNC_FLUSH =      2;
		  this.Z_FULL_FLUSH =      3;
		  this.Z_FINISH =          4;
		  this.Z_BLOCK =           5;
		  this.Z_TREES =           6;

		  /* Return codes for the compression/decompression functions. Negative values
		  * are errors, positive values are used for special but normal events.
		  */
		  this.Z_OK =              0;
		  this.Z_STREAM_END =      1;
		  this.Z_NEED_DICT =       2;
		  this.Z_ERRNO =          -1;
		  this.Z_STREAM_ERROR =   -2;
		  this.Z_DATA_ERROR =     -3;
		  //Z_MEM_ERROR:     -4;
		  this.Z_BUF_ERROR =      -5;
		  //Z_VERSION_ERROR: -6;

		  /* compression levels */
		  this.Z_NO_COMPRESSION =        0;
		  this.Z_BEST_SPEED =            1;
		  this.Z_BEST_COMPRESSION =      9;
		  this.Z_DEFAULT_COMPRESSION =  -1;


		  this.Z_FILTERED =              1;
		  this.Z_HUFFMAN_ONLY =          2;
		  this.Z_RLE =                   3;
		  this.Z_FIXED =                 4;
		  this.Z_DEFAULT_STRATEGY =      0;

		  /* Possible values of the data_type field (though see inflate()) */
		  this.Z_BINARY =                0;
		  this.Z_TEXT =                  1;
		  //Z_ASCII:                1, // = Z_TEXT (deprecated)
		  this.Z_UNKNOWN =               2;

		  /* The deflate compression method */
		  this.Z_DEFLATED =              8;
		  //Z_NULL:                 null // Use -1 or null inline, depending on var type
		}).call(module.exports);
