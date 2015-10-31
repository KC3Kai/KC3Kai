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

/*******************************\
|*** Array                      |
\*******************************/
/*
Comparing arrays
http://stackoverflow.com/a/14853974/483704
*/
// Warn if overriding existing method
if(Array.prototype.equals)
	console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
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
Date.prototype.format = function (mask, utc) {
		return dateFormat(this, mask, utc);
};

/*******************************\
|*** Math                       |
\*******************************/
/* LIMIT ROUNDING
-------------------------------*/
Math.qckInt = function(command,value,rate) {
	if (["round","ceil","floor"].indexOf(command) < 0)
		command = null;
	command = command || "round";
	value   = value   || 0;
	rate    = rate    || 0;
	var shift = Math.pow(10,rate);
	return Math[command](value * shift) / shift;
};

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
