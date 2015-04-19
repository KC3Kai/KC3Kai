KC3.prototype.Dashboard.Info = {
	
	fillHQInfo :function(){
		$("#hqadmiral .hqname").text( app.Player.name );
		$("#hqadmiral .hqcomm").text( app.Player.desc );
		$("#hqadmiral .hqrank").text( app.Player.rank );
		$("#hqlevel .hqlv-cur").text( app.Player.level );
		$("#hqlevel .hqexpval").css({width: (app.Player.exp[0]*90)+"px"});
		$("#hqlevel .hqexptxt span").text( app.Player.exp[1] );
		$("#material-box-6 .material-count").text(app.Player.fcoin);
	},
	
	fillCounts :function(){
		$("#material-box-1 .material-count").text(app.Player.buckets);
		$("#material-box-2 .material-count").text(app.Player._shipSlot[0]);
		$("#material-box-2 .material-max").text("/"+app.Player._shipSlot[1]);
		$("#material-box-3 .material-count").text(app.Player.torch);
		$("#material-box-4 .material-count").text(app.Player._gearSlot[0]);
		$("#material-box-4 .material-max").text("/"+app.Player._gearSlot[1]);
		$("#material-box-5 .material-count").text(app.Player.screws);
	},
	
};