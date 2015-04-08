function Sortie(world, mapnum, fleetnum, stime){
	this.world = world;
	this.mapnum = mapnum;
	this.stime = stime;
	
	this.battles = [];
	this.currentBattle = {};
	
	this.fleetnum = new Fleet();
	
	this.DB_Insert();
}

Sortie.prototype.DayBattle = function(  ){
	
};

Sortie.prototype.NightBattle = function( battle_data ){
	this.currentBattle.EnterNight( battle_data );
};

Sortie.prototype.Yasen = function( BattleObj ){
	this.currentBattle.push( BattleObj );
};

Sortie.prototype.End = function(){
	
};


// Add sortie to database the moment it's initialized
Sortie.prototype.DB_Insert = function(){
	
};