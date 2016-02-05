(function(){
	"use strict";

	KC3StrategyTabs.icondb = new KC3StrategyTab("icondb");

	KC3StrategyTabs.icondb.definition = {
		tabSelf: KC3StrategyTabs.icondb,
        con: null,

		/* INIT
		   Prepares all data needed
		   ---------------------------------*/
		init: function(){
            this.con = new Dexie("IconCache");
		},

		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute: function(){
            var self = this;
            for (var i=0; i<500; ++i) {
                // we need a closure so obj cannot vary
                (function (){
                    var obj = $(".tab_icondb .factory .ship_item").clone();
                    $(".ship_id",obj).text(i);
                    $(".ship_name",obj).text( "loading..." );
                    obj.appendTo( ".tab_icondb .icon_list" );

                    $(".ship_img img",obj).attr("src", KC3Meta.shipIcon(i));
                    self.encodeImage(KC3Meta.shipIcon(i), function(dataURL) {
                        $(".ship_name", obj).text( dataURL );
                        $(".ship_img2 img",obj).attr("src", dataURL);
                        $(".ship_id",obj).text(String(i) + " - " + dataURL.length);
                    });
                })();

            }
		},
        encodeImage: function(url, callback) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function(){
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                var dataURL;
                canvas.height = this.height;
                canvas.width = this.width;
                ctx.drawImage(this, 0, 0);
                dataURL = canvas.toDataURL('image/png');
                callback(dataURL);
                canvas = null; 
            };
            img.src = url;
        }
    };

})();
