(function(){
	"use strict";
	
	window.KC3StrategyTab = function(name){
		this.initDone = false;
		this.name = name;
		this.error = false;
		this.htmlContents = "";
		this.loadedStyle = false;
	};
	
	KC3StrategyTab.prototype.definition = {
		init :function(){ return false; },
		execute :function(){}
	};
	
	KC3StrategyTab.prototype.showError = function(message){
		this.error = true;
		this.errorMessage = message;
	};
	
	KC3StrategyTab.prototype.loadAssets = function(callback){
		// Attempt to load CSS
		if(!this.loadedStyle){
			this.loadedStyle = true;
			var myCSS = document.createElement("link");
			myCSS.rel = "stylesheet";
			myCSS.type = "text/css";
			myCSS.href = "tabs/"+this.name+"/"+this.name+".css";
			$("head").append(myCSS);
		}
		
		// Attempt to load HTML
		if(this.htmlContents === ""){
			var self = this;
			$.ajax({
				url: "tabs/"+this.name+"/"+this.name+".html",
				success:function(contents){
					self.htmlContents = contents;
					callback();
				}
			});
		}else{
			callback();
		}
	};
	
	KC3StrategyTab.prototype.show = function(){
		$("#contentHtml").removeClass();
		$("#contentHtml").addClass("tab_"+this.name);
		$("#contentHtml").html(this.htmlContents);
		KC3Translation.execute();
	};
	
	/**
	 * Terms of callback function definitions:
	 *   "init": Invoked for the first time tab initializing, only once (for once browser refresh).
	 *   "reload": Invoked when data loading required, optional once, may many times on demand.
	 *   "execute": Invoked for rendering HTML content from scratch when each time tab shown (or switched from other tabs).
	 *   "update": Invoked when arguments or states inside tab changed and partial elements possibly updated.
	 */
	KC3StrategyTab.prototype.apply = function(forceReload){
		this.error = false;
		this.errorMessage = "";
			
		var self = this;
		this.loadAssets(function(){
			if(!self.initDone){
				self.initDone = true;
				self.definition.init();
				if(!!self.definition.reload){
					self.definition.reload();
				}
			}
			if(!self.error){
				if(!!forceReload && !!self.definition.reload){
					self.definition.reload();
				}
				self.show();
				self.definition.execute();
			}else{
				$("#contentHtml").text(self.errorMessage);
			}
			$("#contentHtml").show();
			KC3StrategyTabs.loading = false;
		});
	};
	
})();
