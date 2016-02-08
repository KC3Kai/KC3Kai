/* PictureBook.js

   Keep track of in-game picture book info

 */
(function() {
    "use strict";

    window.PictureBook = {
        load: function() {
            if (typeof localStorage.pictureBook === 'undefined')
                localStorage.pictureBook = JSON.stringify( {} );
            return JSON.parse( localStorage.pictureBook );
        },
        record: function(params,response) {
            var pb = this.load();
            // note: pdInd is a string
            var pbInd = params.api_no;
            var timestamp = new Date().getTime();
            var ids;

            if (response.api_data) {
                ids = response.api_data.api_list
                    .map( function(x) {
                        return x.api_table_id[0];
                    });
            } else {
                ids = [];
            }
            pb[pbInd] = {
                ids: ids,
                timestamp: timestamp
            };
            
            localStorage.pictureBook = JSON.stringify( pb );
        }
    };
})();
