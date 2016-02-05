(function(){
	"use strict";

	window.IconManager = {
        db: null,
        init: function() {
            this.db = new Dexie("IconCache");
            this.db.version(1).stores({
                icons: "++id,&shipId,timestamp,dataURL"
            });
            this.db.on("error", function(e) {
                console.error("IconManager Error");
                console.error(e.stack || e);
            });
            this.db.open();
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
        },
        getExternalShipIconLink: function(shipId) {
            return 'https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/src/assets/img/' +
                (shipId>=500?'abyss/':'ships/')+shipId+'.png';
        },
        fetchShipIcon: function(shipId, callback) {
            var url = this.getExternalShipIconLink(shipId);
            this.encodeImage(url, callback);
        },
        // force updating an icon.
        forceFetchAndStore: function(shipId,callback) {
            var self = this;
            this.fetchShipIcon(
                shipId,
                function(dataURL) {
                    self.db.icons
                        .where('shipId')
                        .equals(shipId)
                        .delete()
                        .then( function() {
                            // old entity removed
                            self.db.icons.add({
                                shipId: shipId,
                                timestamp: new Date().getTime(),
                                dataURL: dataURL
                            });
                        });
                    if (callback)
                        callback(dataURL);
                });
        },
        // supposed to return as soon as possible,
        // returns false when a resource is not found in local db
        getAsync: function(shipId,callback) {
            this.db.icons
                .where('shipId')
                .equals(shipId)
                .first( function(x) {
                    callback(x?x:false);
                });
        },
        setIconAsync: function (jqObj, shipId, empty) {
            var self = this;
            if (typeof empty === 'undefined')
                empty = KC3Meta._defaultIcon;
            jqObj.attr('src', empty);
            this.getAsync(
                shipId,
                function(x) {
                    if (x) {
                        console.log("hit:",shipId);
                        jqObj.attr('src', x.dataURL);
                    } else {
                        // try to fetch data
                        self.forceFetchAndStore(
                            shipId,
                            function(dataURL) {
                                console.log("forced:", shipId);
                                jqObj.attr('src', dataURL);
                            });
                    }
                });
            return jqObj;
        }
    };
})();
