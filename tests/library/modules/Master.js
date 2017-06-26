/* globals api_start2: true */
QUnit.module("Master Module", function(){ localStorage.clear(); });

QUnit.test("Module > Master > Saving", function( assert ) {
	var x = $.extend(true, {}, KC3Master);
	
	x.init(api_start2.api_data);
	
	assert.strictEqual( x.ship(1).api_name, "睦月", "Testing Ship 1: Mutsuki" );
	assert.strictEqual( x.slotitem(1).api_name, "12cm単装砲", "Testing Equipment 1: 12cm Gun" );
	assert.strictEqual( x.stype(2).api_name, "駆逐艦", "Testing Stype 2: Destroyer" );
	
	assert.ok( localStorage.raw, "Checking if saved on localStorage" );
});

QUnit.test("Module > Master > Loading", function( assert ) {
	var x = $.extend(true, {}, KC3Master);
	
	x.load();
	
	assert.strictEqual( x.ship(1).api_name, "睦月", "Testing Ship 1: Mutsuki" );
	assert.strictEqual( x.slotitem(1).api_name, "12cm単装砲", "Testing Equipment 1: 12cm Gun" );
	assert.strictEqual( x.stype(2).api_name, "駆逐艦", "Testing Stype 2: Destroyer" );
});
