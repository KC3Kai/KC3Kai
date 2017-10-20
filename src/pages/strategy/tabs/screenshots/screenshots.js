(function(){
	"use strict";
	
	KC3StrategyTabs.screenshots = new KC3StrategyTab("screenshots");
	
	KC3StrategyTabs.screenshots.definition = {
		tabSelf: KC3StrategyTabs.screenshots,
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			KC3Database.count_screenshots(function(NumRecords){
				var itemsPerPage = 20;
				var numPages = Math.ceil(NumRecords/itemsPerPage);
				
				if(numPages > 0){
					$('.pagination').twbsPagination({
						totalPages: numPages,
						visiblePages: 9,
						onPageClick: function (event, page) {
							self.tabSelf.definition.showPage( page );
						}
					});
					$('.pagination').show();
				}else{
					$('.pagination').hide();
					$(".screenshot_list").empty();
				}
			});
		},
		
		/* SHOW PAGE
		Show single page of screenshors
		---------------------------------*/
		showPage :function( page ){
			var self = this;
			var openInNewTab = function(e) {
				window.open($(this).attr("src"));
			};
			KC3Database.get_screenshots(page, function(screenshots){
				$(".screenshot_list").empty();
				$.each(screenshots, function(i, img){
					var thumb = $(".tab_screenshots .factory .ss_thumb").clone().appendTo(".screenshot_list");
					$("img", thumb).attr("src", img.imgur).click(openInNewTab);
					$(".ss_delete", thumb).data("ssid", img.id).data("deletehash", img.deletehash)
						.click(self.deleteImage);
					$(".ss_date", thumb).text( (new Date(img.ltime*1000)).format("yyyy-mm-dd HH:MM:ss") );
				});
			});
		},
		
		/* Delete image from both local database and remote imgur.com */
		deleteImage :function(event){
			var self = this;
			if( ! confirm("Will also delete image from imgur.com (if possible),\nAre you sure?") )
				return false;
			var ssId = $(this).data("ssid");
			var deleteHash = $(this).data("deletehash");
			var deleteDbRecord = function() {
				console.log("Deleting image record from local database, id =", ssId);
				KC3Database.con.screenshots.where("id").equals(ssId)
					.delete().then(cnt => {
						console.info("Found", cnt, "image(s), deleted!");
						KC3StrategyTabs.reloadTab(undefined, true);
					}).catch(e => {
						console.error("Deleting image exception", e);
					});
			};
			if(deleteHash){
				// This way seems not work as always out of quota :(
				//window.open("https://imgur.com/delete/" + deleteHash);
				console.info("Deleting imgur image via deletehash:", deleteHash);
				Promise.resolve()
					.then(KC3ImageExport.deleteUpload.bind(null, deleteHash))
					.then(deleteDbRecord)
					.catch(e => {
						console.warn("Deleting remote image failed", e);
						if(confirm("Failed to delete image from imgur.com, still remove this record?"))
							deleteDbRecord();
					});
			} else {
				deleteDbRecord();
			}
		}
	};
	
})();
