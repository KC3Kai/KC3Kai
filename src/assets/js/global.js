/*******************************\
|*** Global                     |
\*******************************/
/* GOOGLE ANALYTICS
-------------------------------*/
if (typeof NO_GA == "undefined") {
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-9789944-12']);
	(function() {
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		ga.src = 'https://ssl.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();
}

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
	var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date();
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var _ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

			return mask.replace(token, function ($0) {
				return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
			});
		};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

/* GET DATE IN Japan Standard TimeZone
http://stackoverflow.com/a/10088053/483704
-------------------------------*/
Date.getJstDate = function() {
	// create Date object for current location
	d = new Date();
	// convert to msec
	// add local time zone offset
	// get UTC time in msec
	utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	// create new Date object for different city
	// using supplied offset
	return new Date(utc + (3600000*9));
};

/**
 * Convert any String to UTC timestamp.
 * return Date.now() on any exception.
 */
Date.safeToUtcTime = function(date) {
	var ts = new Date(date).getTime();
	return isNaN(ts) ? Date.now() : ts;
};
/**
 * Convert String to UTC timestamp/1000.
 */
Date.toUTCseconds = function(dateStr) {
	return Math.hrdInt("floor", Date.safeToUtcTime(dateStr), 3, 1);
};
/**
 * Convert String to UTC timestamp/1000/3600.
 */
Date.toUTChours = function(dateStr) {
	return Math.hrdInt("floor", Date.safeToUtcTime(dateStr) / 3.6, 6, 1);
};

/* BASE */
/*******************************\
|*** Object                     |
\*******************************/
Object.size = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
};

/* PRIMITIVE */
/*******************************\
|*** String                     |
\*******************************/
/* String Insertion
-----------------------------------------------*/
String.prototype.insert = function (index, string) {
	if (index > 0)
		return this.substring(0, index) + string + this.substring(index, this.length);
	else
		return string + this;
};

/* String Splitting
 * Supplied Argument:
 * <Nothing>
 * Returned value:
 * Array of characters
-----------------------------------------------*/
String.prototype.toArray = function() {
	return this.split("");
};

/**
 * String.format("msg {0} is {1}", args) - convenient placeholders replacing,
 * from http://jqueryvalidation.org/jQuery.validator.format/
 *
 * @return a new string replaced with given expressions like template literals in ES6
 * @param {an Array/String..} args - the real values to be replaced with
 * notes:
 *   - in fact, NO l10n format feature like Date, Currency, Float Number
 *   - placeholders can be commented via {0:commentGoesHere} (no space)
 *   - if first parameter is Array, left params will be ignored
 *   - if param or element in Array is not String, will be auto toString
------------------------------------------------------------ */
String.prototype.format = function(params) {
	var source = this.toString();
	if (arguments.length < 1) {
		return source;
	} else if(!Array.isArray(params)) {
		params = $.makeArray(arguments);
	}
	// A-Z a-z 0-9 _ $ [more unicodes]
	var validCommentChars = "[_$\\w\\d\\xA0-\\uFFFF]*";
	$.each(params, function( i, n ) {
		source = source.replace( new RegExp("\\{" + i
			+ "(:" + validCommentChars + ")?\\}", "g"), function() {
			return n;
		});
	});
	return source;
};

/* SECONDS TO HH:MM:SS
-------------------------------*/
String.prototype.toHHMMSS = function () {
	var sec_num = parseInt(this, 10); // don't forget the second param
	var time;
	if(isNaN(sec_num)) {
		time = "--:--:--";
	} else {
		var isNeg   = sec_num < 0;

		if(isNeg) sec_num = -sec_num;

		var hours   = (Math.floor(sec_num / 3600)).toDigits(2);
		var minutes = (Math.floor((sec_num - (hours * 3600)) / 60)).toDigits(2);
		var seconds = (sec_num - (hours * 3600) - (minutes * 60)).toDigits(2);

		time    = (isNeg ? "-" : "")+hours+':'+minutes+':'+seconds;
	}
	return time;
};

/* SECONDS TO HH:MM:SS, ADDING CURRENT TIME
-------------------------------*/
String.prototype.plusCurrentTime = function() {
	var currentTime = new Date();
	var secondsAfterMidnight =
		3600 * currentTime.getHours() +
		60   * currentTime.getMinutes() +
		       currentTime.getSeconds();

	var secondsRemaining = parseInt(this, 10);
	var timeFinished = (secondsAfterMidnight + secondsRemaining) % 86400;
	return String(timeFinished).toHHMMSS();
};

/* hashing for integrity checks
-----------------------------------*/
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/*******************************\
|*** Number                     |
\*******************************/
(function(){
	/* Number Inclusion
	 * Supplied Argument:
	 * -- Pattern 1
	 *   <Optional x2> Boundary  (defaults: -Inf ~ Inf)
	 *   <Optional ~2> Inclusion (defaults: true, true)
	 * -- Pattern 2
	 *   <Optional>    RangeObject
	-----------------------------------------------*/
	Number.prototype.inside = function(bLeft,bRight,iLeft,iRight){
		if(bLeft instanceof Range) { return this.inside.apply(this,bLeft); }
		bLeft  = parseInt(bLeft,10);
		bRight = parseInt(bRight,10);
		iLeft  = typeof iLeft  == 'undefined' ? true : !!iLeft;
		iRight = typeof iRight == 'undefined' ? true : !!iRight;

		bLeft  = isNaN(bLeft)  ? -Infinity : bLeft ;
		bRight = isNaN(bRight) ? +Infinity : bRight;

		if(bLeft > bRight) { return this.inside(bRight,bLeft,iRight,iLeft); }
		return (
			(iLeft  ? this >= bLeft  : this > bLeft ) &&
			(iRight ? this <= bRight : this < bRight)
		);
	};

	/* Number Padding
	 * Supplied Argument:
	 * <Optional> Digits (any invalid value / less than 1, forced to 1)
	-----------------------------------------------*/
	Number.prototype.toDigits = Number.prototype.toArray = function(digits) {
		var ret = this.toString();
		try{
			if(isNaN(this)||!isFinite(this)){throw new Error("Cannot convert constants to padded array");}
			if(ret == this.toExponential()){throw new Error("Cannot convert number in exponential form");}
			if (!isFinite(digits)) { digits = undefined; }
			digits = Math.max(digits || 1,1);
			// Pad the array until
			ret = ("0").repeat(Math.max(digits - ret.length,0)) + ret; // O(1) complexity XD
		}catch(e){
			console.error(e);
		}finally{
			return ret;
		}
	};
	/* Number Shortener
	 * shortens the number up to 3 digits
	 * Supplied Argument:
	 * < Nothing >
	-----------------------------------------------*/
	var shorten = {
		expRegex : /([\+\-]?)(.+)e(.)(\d+)/,
		sgnArray : ['-','','+'],
		metPrefx : ['','k','M','G','T','P','E','Z','Y']
	};

	Number.prototype.shorten = function(decimals) {
		var ret = this.toString();
		try{
			if(isNaN(this)||!isFinite(this)){ throw ret; }
			if(Math.abs(this) < 1) {
				console.error("Cannot shorten any magnitude from negative log10");
				throw 0;
			} else if (Math.abs(this) < 1000) {
				throw this;
			} else {
				var
					sgof = shorten.expRegex.exec(this.toExponential()),
					sgch = shorten.sgnArray.indexOf(sgof[1]) - 1,
					udfg = sgof[3] == '-';

				if (!isFinite(decimals)) { decimals = undefined; }
				decimals = Math.min(Math.max(decimals || 1,1),3);

				if(ret == this.toExponential()){
					throw [sgch < 0 ? "Ng" : "Ps",(udfg ? 'Under' : 'Over') + 'flow'].join(' ');
				} else {
					ret = [Math.qckInt('floor',(sgof[1] + sgof[2]) * (1 + ("0").repeat(sgof[4] % 3)),decimals,false,true),shorten.metPrefx[ parseInt(sgof[4] / 3,10) ]].join('');
				}
			}
		}catch(errval){
			return errval;
		}finally{
			return ret;
		}
	};
	
	Number.prototype.valueBetween = function(lfs, rfs) {
		lfs = lfs === undefined ? -Infinity : lfs;
		rfs = rfs === undefined ? Infinity : rfs;
		return Math.min(Math.max(lfs, rfs), Math.max(Math.min(lfs, rfs), this));
	};
}).call(Number);

/* JS NATIVE CLASS */
/*******************************\
|*** Array                      |
\*******************************/
(function(){
	var
		nop  = function(){},
		over = {
			equals: [
				function(){
					console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
				},
				nop
			],
			fill: [
				function(){ delete meth.fill; },
				function(){
					console.warn("It seems that your chrome doesn't support Array.prototype.fill method.");
				}
			]
		},
		meth = {
			/*
				Comparing arrays
				http://stackoverflow.com/a/14853974/483704
			*/
			equals: {
				value: function (array) {
					// if the other array is a falsy value, return
					if (!array)
						return false;

					// compare lengths - can save a lot of time
					if (this.length != array.length)
						return false;

					for (var i = 0, l=this.length; i < l; i++) {
						// Check if we have nested arrays
						if (this[i] instanceof Array && array[i] instanceof Array) {
							// recurse into the nested arrays
							if (!this[i].equals(array[i]))
								return false;
						} else if (this[i] != array[i]) {
							// Warning - two different object instances will never be equal: {x:20} != {x:20}
							return false;
						}
					}
					return true;
				},
				configurable:true
			},

			/*
				Fill method polyfill
				https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
			*/
			fill:{
				value: function(value) {
					// Steps 1-2.
					if (this === null) {
						throw new TypeError('this is null or not defined');
					}

					var O = Object(this);

					// Steps 3-5.
					var len = O.length >>> 0;

					// Steps 6-7.
					var start = arguments[1];
					var relativeStart = start >> 0;

					// Step 8.
					var k = relativeStart < 0 ?
						Math.max(len + relativeStart, 0) :
						Math.min(relativeStart, len);

					// Steps 9-10.
					var end = arguments[2];
					var relativeEnd = end === undefined ?
						len : end >> 0;

					// Step 11.
					var last = relativeEnd < 0 ?
						Math.max(len + relativeEnd, 0) :
						Math.min(relativeEnd, len);

					// Step 12.
					while (k < last) {
						O[k] = value;
						k++;
					}

					// Step 13.
					return O;
				},
				configurable:true
			},
		};

	Object.keys(over).forEach((function(method){
		over[method][(!this.prototype[method])>>0].call(this);
	}).bind(this));
	/*jshint: validthis true*/
	Object.defineProperties(this.prototype,meth);
}).call(Array);

/** Construct a Number array contains range from N to M */
Array.numbers = function(start, end){
	var n = parseInt(start, 10), m = parseInt(end, 10);
	var i = m - n + 1, a = [];
	while(i-- > 0) a[i] = n + i;
	return a;
};

/*******************************\
|*** Date                       |
\*******************************/
(function(){
	var
		WeekStrings   = dateFormat.i18n.dayNames.reduce(function(ary,val){
			ary[ (val.length != 3)+0 ].push(val);
			return ary;
		},[[],[]]),
		ResetableKeys = ['Milliseconds', 'Seconds','Minutes','Hours','Date','Month'],
		ShiftableKeys = ResetableKeys.concat(['FullYear']);

	function shiftTime(key,step,clear,offset) {
		var self = this;

		if(ShiftableKeys.indexOf(key) < 0) {
			console.log(arguments);
			throw new Error("Cannot shift invalid time key ("+key+")");
		}

		clear  = !!clear;
		step   = parseInt(step,10);
		step   = (!isNaN(step) && isFinite(step)) ? (step+clear) : 1;
		offset = $.extend({},offset);

		var ki = ShiftableKeys.indexOf(key);

		if(clear) {
			this.resetTime(ResetableKeys.filter(function(k,i){return i < ki;}));
		}

		Object.keys(offset).forEach(function(k){
			if(ResetableKeys.indexOf(k) < ki &&
				['number','string'].some(function(desiredType){
					return typeof offset[k] == desiredType;
				})
			) {
				offset[k] = parseInt(offset[k],10);
				if(isNaN(offset[k]) || !isFinite(offset[k]))
					return false;

				self['setUTC'+k](self['getUTC'+k]()+(offset[k]));
			} else {
				delete offset.k;
			}
		});

		this['setUTC'+key](this['getUTC'+key]()+(step));
		return this;
	}

	Object.defineProperties(Date.prototype,{
		format: { value: function format(mask, utc) {
			return dateFormat(this, mask, utc);
		}},
		shiftHour : { get: function () { return shiftTime.bind(this,'Hours'); } },
		shiftDate : { get: function () { return shiftTime.bind(this,'Date' ); } },
		shiftWeek : { get: function () {
			return (function shiftWeek (target,lookType,step,clear,offset) {
				/* Test Object: Monday, 4 January 2016
					shiftWeek('Sun',0,false,null) => Sunday, 3 January 2016
					shiftWeek(0, +1,false,null) => Sunday, 10 January 2016
					shiftWeek('Tuesday',-1,false,null) => Tuesday, 28 December 2015
				*/
				var calibr;
				var args = Array.apply(null,arguments);
				lookType = parseInt(lookType,10);
				lookType = isFinite(lookType) && lookType || 0;

				switch(typeof target){
					case 'number':
						var check = WeekStrings.map(function(array){return array[target];})
							.filter(function(value){return typeof value == 'string';}).pop();
						if(typeof check !== 'undefined') {
							// Correct index detection

						} else {
							// Invalid index detection
							throw new RangeError(["Invalid range (",String(target),")"].join(''));
						}
					break;
					case 'undefined':
						// "Empty" argument treated as current day
						args[0] = this.getUTCDay();
						return this.shiftWeek.apply(this,args);
					default:
						if(target === null) {
							// Nullity check
							args[0] = undefined;
							return this.shiftWeek.apply(this,args);
						}

						var checkKey = parseInt(target,10);
						if(!isNaN(checkKey)) {
							// Number (on string) detection
							args[0] = checkKey;
							return this.shiftWeek.apply(this,args);
						}

						// Any type detection
						checkKey = WeekStrings.filter(function(array){return array.indexOf(target)>=0;}).pop();
						if(typeof checkKey === 'undefined') {
							// Bad string conversion variable detection
							throw new ReferenceError(["Bad week name reference (",String(target),")"].join(''));
						} else {
							target = checkKey.indexOf(target);
						}
					break;
				}

				calibr = (target - this.getDay());
				// Adjust calibrator boundary
				while(calibr >  3 && lookType <= 0) calibr -= 7;
				while(calibr < -3 && lookType >= 0) calibr += 7;
				calibr -= parseInt(calibr / 7,10) * 7 * Math.sign(lookType);

				args.splice(0,2);

				step = parseInt(step,10);
				if(isNaN(step) || !isFinite(step))
					step = 0;

				/*
				  UTCD DATE CALB
					 20   21   -1
					  2    1   +1
					  1   30  -29? => +1
					 31    1  +30? => -1
				*/
				var utcDayCalib = this.getUTCDate() - this.getDate();
				args[0] = 7 * step + calibr - (!!clear + (Math.abs(utcDayCalib) <= 1 ? utcDayCalib : -Math.sign(utcDayCalib)));
				return this.shiftDate.apply(this,args);
			}).bind(this);
		}},
		shiftMonth: { get: function () { return shiftTime.bind(this,'Month'); } },
		shiftYear : { get: function () { return shiftTime.bind(this,'FullYear'); } },
		resetTime : { value: function(clearTable) {
			var
				self = this,
				cFunc = function(){return false;};

			switch(typeof clearTable) {
				case 'number':
				case 'string':
					// Pick nth+1 element from ResetableKeys
					// Invalid >> pick all elements
					clearTable = parseInt(clearTable,10);
					clearTable = ((clearTable >= 0) && !isNaN(clearTable) && isFinite(clearTable) || ResetableKeys.length) && clearTable;

					// Provided String or Number ->
					// Pick nth+1 elements from start
					cFunc = function(x,i){
						return i <= clearTable;
					};
					break;
				default:
					// Pick any matching element from Resetable Array
					// Invalid >> pick all elements
					clearTable = ((typeof clearTable === 'object' && clearTable instanceof Array && clearTable) || ResetableKeys);

					// Provided Anything else
					// Pick any element that match the clearTable data (either value or index)
					// ['Seconds',2,3] => ['Seconds','Hours','Date']
					cFunc = function(key,ind){
						return [key,ind].some(function(val){ return clearTable.indexOf(val) >= 0; });
					};
					break;
			}

			clearTable = ResetableKeys.filter(cFunc);

			clearTable.forEach(function(k){
				self['setUTC' + k](k === 'Date' ? 1 : 0);
			});
			return this;
		}},
	});
})(Date);

/* JS NATIVE MODULE */
/*******************************\
|*** Math                       |
\*******************************/
/* STATISTICS (STANDARD DEVIATION)
 - Sample based deviation (default)
 - Population based deviation
-------------------------------*/
Math.stdev  = function(p1f /*, data*/){
	// obtain a real array for carrying data
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	var data = Array.prototype.slice.call( arguments );
	if(typeof p1f === 'boolean') {
		data.splice(0,1);
	} else {
		p1f = false;
	}
	// special handling for cases:
	// * Math.stdev( <bool>, <an array object> )
	// * Math.stdev( <an array object> )
	if (data.length > 0 && (data[0] instanceof Array)) {
		if (data.length !== 1)
			throw "Math.stdev called with unexpected form";
		data = data[0];
	}
	var args = [].map.call(data,function(val){
		return Number(val);
	});

	if(args.length <= 0)
		return 0;

	var avg;
	avg = args.reduce(function(cAve,nVal,nInd){
		return ((cAve * nInd) + nVal) / (nInd + 1);
	},0);

	return Math.sqrt(args.reduce(function(tDev,nVal,nInd){
		return tDev + Math.pow(nVal - avg,2);
	},0)/(args.length - !p1f));
};

/** LIMIT ROUNDING
 * @param command: do Math."round"(default) or "ceil" or "floor"
 * @param value: the number to be rounded
 * @param rate: how many decimal digits to be reserved
 * @param rev: if false, moving decimal point "rate" place(s) to the right,
 *             then integer will be returned
 * @param magn: if true, negative rounding behaves like positive
 * @return the rounded number
-------------------------------*/
Math.qckInt = function(command,value,rate,rev,magn) {
	if (["round","ceil","floor"].indexOf(command) < 0)
		command = null;
	command = command || "round";
	value   = value   || 0;
	rate    = rate    || 0;
	rev     = !rev;
	magn    = !!magn;

	var shift = Math.pow(10,rate);
	return (magn ? Math.sign(value) : 1) *
		Math[command]((magn ? Math.abs(value) : value) * shift) / (rev ? shift : 1);
};
/* Rounding towards left side of decimal point */
Math.hrdInt = function(command,value,rate,rev) {
	return Math.qckInt(command,value,-rate,rev);
};

/* CHROME NATIVE CLASS */
/*******************************\
|*** Storage                    |
\*******************************/
/*
	Storage JSON Conversion
	http://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage/2010994
*/
Storage.prototype.setObject = function(key, value) {
	this.setItem(key,JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
	return JSON.parse(this.getItem(key));
};

/*******************************\
|*** Element                    |
\*******************************/
(function(){
	/*jshint: validthis true*/
	Object.defineProperties(this.prototype,{
		/* ELEMENT OVERFLOW CHECK
		------------------------------------ */
		overflow:{
			get:function(){ return this.overflowHorz || this.overflowVert; },
			configurable: true
		},
		overflowHorz:{
			get:function(){ return this.scrollWidth  > this.clientWidth ; },
			configurable: true
		},
		overflowVert:{
			get:function(){ return this.scrollHeight > this.clientHeight; },
			configurable: true
		},
	});
}).call(Element);

/* USER-DEFINED CLASS */
/*******************************\
|*** Range                      |
\*******************************/
(function(){
	var base = Object.freeze([-Infinity,+Infinity,true,true]);

	function exclusiveClamp(rangeObj){
		if(rangeObj instanceof Range) {
			if(
				Math.abs(rangeObj.end - rangeObj.begin) < Number.EPSILON &&
				rangeObj.exclusive()
			) {
				rangeObj.inFirst = rangeObj.inLast = false;
			}
		} else {
			return false;
		}
	}

	window.Range = function Range(b1,b2,i1,i2){
		/*jshint: validthis true*/
		if(!(this instanceof Range)){ return new Range(b1,b2,i1,i2); } else {
			// Single Range Object
			if((b1 instanceof Range) || (typeof b1 == 'object' && b1.length == 4)){
				i2 = b1[3]; i1 = b1[2];
				b2 = b1[1]; b1 = b1[0];
			// Two Pair of Values
			} else if ([b1,b2].every(function(pair){ return typeof pair == 'object' && pair.length == 2;})) {
				i2 = b2[1]; i1 = b2[0];
				b2 = b1[1]; b1 = b1[0];
			}

			b1 = parseInt(b1,10);
			b2 = parseInt(b2,10);
			i1 = typeof i1 == 'undefined' ? base[2] : !!i1;
			i2 = typeof i2 == 'undefined' ? base[3] : !!i2;

			b1 = isNaN(b1) ? base[0] : b1;
			b2 = isNaN(b2) ? base[1] : b2;

			if(b1 > b2){
			// Swap bad ranges
				var tp;
				tp = b2; b2 = b1; b1 = tp;
				tp = i2; i2 = i1; i1 = tp;
			}

			Object.defineProperties(this,{
				begin  :{get:function(){return b1;},set:function(v){v = parseInt(v,10); b1 = isNaN(v) ? base[0] : v;}},
				end    :{get:function(){return b2;},set:function(v){v = parseInt(v,10); b2 = isNaN(v) ? base[1] : v;}},
				inFirst:{get:function(){return i1;},set:function(v){v = !!v; i1 = v;}},
				inLast :{get:function(){return i2;},set:function(v){v = !!v; i2 = v;}},

				first  :{get:function(){return this.begin;},set:function(v){this.begin=v;exclusiveClamp(this);}},
				last   :{get:function(){return this.end  ;},set:function(v){this.end  =v;exclusiveClamp(this);}},
			});
		}
	};

	Object.defineProperties(Range.prototype,{
		begin    :{get:function(){return base[0];}},
		first    :{get:function(){return base[0];}},

		last     :{get:function(){return base[1];}},
		end      :{get:function(){return base[1];}},

		inFirst  :{get:function(){return !!base[2];}},
		inLast   :{get:function(){return !!base[3];}},

		inside   :{value:function(x){return Number(x).inside(this);}},
		exclusive:{value:function( ){return this.inFirst || this.inLast;}},

		0        :{get:function(){return this.begin;}  ,set:function(v){this.begin=v;}  },
		1        :{get:function(){return this.end;}    ,set:function(v){this.end=v;}    },
		2        :{get:function(){return this.inFirst;},set:function(v){this.inFirst=v;}},
		3        :{get:function(){return this.inLast;} ,set:function(v){this.inLast=v;} },

		toJSON   :{value:function(){ return Array.apply(null,this); }},
		toString :{value:function(){
			return ("%L%B,%E%R")
				.replace("%L",this.inFirst ? '[' : '(').replace("%R",this.inLast  ? ']' : ')')
				.replace("%B",this.begin).replace("%E",this.end);
		}},
		valueOf  :{value:function(){return [this.begin,this.end,this.inFirst,this.inLast];}},
		length   :{value:4}, // for array operation
	});

})();
