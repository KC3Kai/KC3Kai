/*
TabDummy.js
By: dragonjet

Dummy tab for those with no dedicated wrapper script yet.
*/

var TabDummy = {
	active: false,
	init :function(){
		if(this.active) return false; this.active = true;
	},
	show :function(){}
};