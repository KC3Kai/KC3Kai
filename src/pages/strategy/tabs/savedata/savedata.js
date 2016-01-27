(function(){
	"use strict";
	
	KC3StrategyTabs.savedata = new KC3StrategyTab("savedata");
	
	KC3StrategyTabs.savedata.definition = {
		tabSelf: KC3StrategyTabs.savedata,
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},
		tmptext:"",
	
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
        //save stuffs
       	var db2arr = function(){
  		    var text=new StringBuilder();
  		    $(".tab_savedata .tmptextbox").empty();
  		    window.KC3Database.con.tables.forEach( //access all tables
              function(table){
                    table.toArray(function(all) { //add table data tmptext
                     //$(".tab_savedata .tmptextbox").append(
                          text.Append(
                            "\""+table.name+"\":"+
                            JSON.stringify(all)+
                            ","
                          );
                    });
              }
          );
          //text = $(".tab_savedata .tmptextbox").text().substring(0,-1);
          //$(".tab_savedata .tmptextbox").empty();
          return text.ToString().substring(0,-1);
       	}
        
        $(".tab_savedata .export_data").on("click", function(){
  				alert( db2arr() );
  				var blob = new Blob([db2arr()], {type: "application/json;charset=utf-8"});
  				//saveAs(blob, "["+PlayerManager.hq.name+"] "+((new Date()).format("yyyy-mm-dd"))+".kc3db");
  			});
       
          
		}

    
		
	};
	
})();
