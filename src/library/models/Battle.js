function Battle( sortie_id, node_id, battle_data, server_time ){
	// Initialize battle properties
	this.sortie_id = sortie_id;
	this.node = node_id;
	this.dayBattle = battle_data;
	this.time = server_time;
	this.ngtNattle = {};
	this.rating = "";
	this.drop = -1;
}

// Players continues to night battle
Battle.prototype.EnterNight = function( battle_data ){
	// Save night battle data
	this.ngtNattle = battle_data;
};

// Battle result screen
Battle.prototype.EndBattle = function( results ){
	// Save the battle rating
	this.rating = results.api_win_rank;
	
	// Save the ship drop
	if(typeof results.api_get_ship != "undefined"){
		this.drop = results.api_get_ship.api_ship_id; 
	}else{
		this.drop = 0;
	}
	
	// Insert this battle to sortie database
	app.Database.Insert('battle', {
		sortie_id: this.sortie_id,
		node: this.node,
		dayBattle: this.dayBattle,
		ngtNattle: this.ngtNattle,
		rating: this.rating,
		drop: this.drop,
		time: this.time
	});
};