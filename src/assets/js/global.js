/*******************************\
|*** Global                     |
\*******************************/
/* GOOGLE ANALYTICS
-------------------------------*/
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-9789944-12']);
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = 'https://ssl.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

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

/* GET DATE IN JP
http://stackoverflow.com/a/10088053/483704
-------------------------------*/
function getJPDate() {
	// create Date object for current location
	d = new Date();
	
	// convert to msec
	// add local time zone offset
	// get UTC time in msec
	utc = d.getTime() + (d.getTimezoneOffset() * 60000);

	// create new Date object for different city
	// using supplied offset
	return new Date(utc + (3600000*9));
}

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

/*******************************\
|*** Number                     |
\*******************************/
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

/* JS NATIVE CLASS */
/*******************************\
|*** Array                      |
\*******************************/
/*
Comparing arrays
http://stackoverflow.com/a/14853974/483704
*/
Array.prototype.equals = function (array) {
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
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

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
						args[0] = this.getDay();
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
				
				args[0] = 7 * step + calibr - (!!clear + this.getUTCDate() - this.getDate());
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
	var args = [].map.call(arguments,function(val){
		return Number(val);
	});
	if(typeof p1f !== 'boolean') {
		p1f = false;
	} else {
		args.splice(0,1);
	}
	
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

/* LIMIT ROUNDING
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

