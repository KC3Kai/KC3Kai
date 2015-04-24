KC3.prototype.Dashboard.Info = {
	
	admiral :function(){
		$(".hq_info .admiral_name").text( app.Player.name );
		$(".hq_info .admiral_comm").text( app.Player.desc );
		$(".hq_info .admiral_rank").text( app.Player.rank );
		$(".level .level_value").text( app.Player.level );
		$(".level .exp_val").css({width: (app.Player.exp[0]*90)+"px"});
		$(".level .exp_text span").text( app.Player.exp[1] );
		$(".material-box-6 .material_count").text(app.Resources.fcoin);
	},
	
	materials :function(){
		$(".material-box-1 .material_count").text(app.Resources.buckets);
		$(".material-box-2 .material_count").text(app.Ships.count());
		$(".material-box-2 .material_max").text("/"+app.Ships.max);
		$(".material-box-3 .material_count").text(app.Resources.torch);
		$(".material-box-4 .material_count").text(app.Gears.count());
		$(".material-box-4 .material_max").text("/"+app.Gears.max);
		$(".material-box-5 .material_count").text(app.Resources.screws);
	},
	
};