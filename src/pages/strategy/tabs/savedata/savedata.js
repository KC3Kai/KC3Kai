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
		
	
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
        
        var getFullstorageData = function()
        {

          return JSON.stringify({
              absoluteswf: localStorage.absoluteswf,
              config: JSON.parse(localStorage.config),
              fleets: JSON.parse(localStorage.fleets),
              gears: JSON.parse(localStorage.gears),
              lastResource:localStorage.lastResource,
              lastUseitem: localStorage.lastUseitem,
              maps: JSON.parse(localStorage.maps),
              player: JSON.parse(localStorage.player),
              quests: JSON.parse(localStorage.quests),
              ships: JSON.parse(localStorage.ships),
              statistics: JSON.parse(localStorage.statistics)
          });//fullStorageData


        };
       	var data2blob = function(){//Save All Data to blob
          var fullDBData=Object;
          var fullStorageData="";
          var zip = new JSZip();
          var trz;
          window.KC3Database.con.transaction("r!", window.KC3Database.con.tables ,function(){
              trz = Dexie.currentTransaction;
      		    window.KC3Database.con.tables.forEach( //access all tables
                  function(table){
                    table.toArray(function(tablearray) { //add table data tmptext
                        fullDBData[table.name] = tablearray;
                    });
              });//foreach
          }).then(function(){
            alert(JSON.stringify(fullDBData));
          });//transaction
          fullStorageData = getFullstorageData(); 

          setTimeout(function() {
              while(trz.active){}
              zip.file("db.json",JSON.stringify(fullDBData));
              zip.file("storage.json",fullStorageData);
              saveAs(
                zip.generate({type:"blob"})
                , "["+PlayerManager.hq.name+"] "+((new Date()).format("yyyy-mm-dd"))+".kc3data");
          }, 3000);//setTimeout

       	};//data2blob
        
        $(".tab_savedata .export_data").on("click", function(){//the data will be saved here
  				  //saveDataToDisk();
            data2blob();
  				//saveAs(blob, "["+PlayerManager.hq.name+"] "+((new Date()).format("yyyy-mm-dd"))+".kc3db");
  			});


        $(".tab_savedata .import_file").on("change", function(event){
            if( event.target.files.length > 0 ){

              if(window.File && window.FileReader && window.FileList && window.Blob){
                reader.readAsText( event.target.files[0] );
              }else{
                alert("Unfortunately, file reading is not available on your browser.");
            }
          }
        });
       
          
		}

    
		
	};
	
})();
