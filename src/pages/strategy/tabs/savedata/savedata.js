(function(){
	"use strict";
	
	KC3StrategyTabs.savedata = new KC3StrategyTab("savedata");
	
	KC3StrategyTabs.savedata.definition = {
		tabSelf: KC3StrategyTabs.savedata,
		text:"",
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){

		},
		tmptext:"",
		db2arr : function(){
		    var text="";
		    $(".tab_savedata .tmptextbox").empty();
		    window.KC3Database.con.tables.forEach( //access all tables
            function(table){
                  var wait=true;
                  table.toArray(function(all) { //add table data tmptext
                   $(".tab_savedata .tmptextbox").append(
                          "\""+table.name+"\":"+
                          JSON.stringify(all)+
                          ","
                        ).then(function(){
                          wait=false;
                        });
                  });
                  while(wait){}
            }
        );
        while ( text === "" ) {
          text = $(".tab_savedata .tmptextbox").text().substring(0,-1);
        }
        $(".tab_savedata .tmptextbox").empty();
        return text;
    },
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
        //save stuffs
       
        
        $(".tab_savedata .export_data").on("click", function(){
  				var blob = new Blob([this.db2arr()], {type: "application/json;charset=utf-8"});
  				saveAs(blob, "["+PlayerManager.hq.name+"] "+((new Date()).format("yyyy-mm-dd"))+".kc3db");
  			});
  			var text;
  			this.db2arr();
        alert(this.text);
       
          
		}

    
		
	};
	
})();
