(function(){
  //inits
  var sav=false;
  $(" .processDisplay").hide();
  ConfigManager.load();
  KC3Master.init();
  KC3Meta.init("../../data/");
  KC3Meta.defaultIcon("../../assets/img/ui/empty.png");
  PlayerManager.init();
  KC3ShipManager.load();
  KC3GearManager.load();
  KC3Database.init( PlayerManager.hq.id );
  RemodelDb.init();
  KC3Translation.execute();
  WhoCallsTheFleetDb.init("../../");


  $(" .warningbtn").on("click", function(){//warningbtn
    $(" .warning").toggle();
  });

  $(" .overwrite_data").on("click", function(){//overwrite_data
    if(confirm("please close all your curruntly open kc3 panel(you could want kancolle closed too)"))
    {
      if(filename==="")
        alert("no file selected");
      else
        if(sav||confirm("You didn't backup your data! are you sure?"))
                    {
                        $(" .dataselect").hide();
                        $(" .processDisplay").show();
                        window.KC3DataBackup.loadData(filename,true," .processDisplay .processText",function(){
                            $(" .dataselect").show();
                            $(" .processDisplay").hide();
                            alert("finished!");
                            if(confirm("would you like to go to strategy room?"))
                              window.location = '../strategy/strategy.html';
                        });
                    }
    }
  });

  var filename="";
  //window.KC3DataBackup.loadData(event.target.files[0]);
  $(" .import_file").on("change", function(event){
    filename = event.target.files[0];
  });
})();
