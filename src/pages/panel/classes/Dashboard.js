KC3.prototype.Dashboard  = {
	state: "waiting",
	
	/* Dashboard Initialization
	-------------------------------------------------------*/
	init :function(){
		var self = this;
		// Load theme HTML
		$.ajax({
			url: 'themes/horizontal.html',
			success: function(response){
				$("#panel-wrap").html(response);
				self.ready();
			}
		});
	},
	
	/* Document Ready
	-------------------------------------------------------*/
	ready: function(){
		var self = this;
		
		// CatBomb modal close
		$("#catBomb .closebtn").on("click", function(){
			$("#catBomb").fadeOut(500);
		});
		
		// Choose fleets
		$(".fleet-button").on("click", function(){
			$(".fleet-button").removeClass("active");
			$(this).addClass("active");
			app.Dashboard.Fleet.selectedFleet = $(this).data("id");
			app.Dashboard.Fleet.update();
		});
		
		// EqLos Formula Change
		$(".fleet-summary .summary-eqlos").on("click", function(){
			app.Config.scrollElosMode();
			self.updateElosIcon();
			self.Fleet.update();
		});
		
		// Share compo button
		$(".share-button").on('click', function(){
			window.open("../strategy/strategy.html#fleets", "kc4_strategy");
		});
		
		// Strategy Room
		$(".btn-strategy").on('click', function(){
			window.open("../strategy/strategy.html", "kc4_strategy");
		});
		
		// Take a Screenshot
		$(".btn-screenshot").on('click', function(){
			
		});
		
		// Dev-mode button to Reset IndexedDB
		$(".idfreset").on("click", function(){
			app.Logging.reset();
		});
		$(".cbomb").on("click", function(){
			self.catBomb("A", "Bjasb hdjkabhs djkhb asjdb jkfbajkd bhjka dbhcfjk awbh dukfhb wdkjhqv bfiou pwidv Bjasb hdjkabhs djkhb asjdb jkfbajkd bhjka dbhcfjk awbh dukfhb wdkjhqv bfiou pwidv");
		});
		$(".actbox").on("click", function(){
			self.messageBox("A");
		});
		$(".openpanel").on("click", function(){
			self.showPanel();
		});
	},
	
	/* Update EqLos Icon on change Formula
	-------------------------------------------------------*/
	updateElosIcon :function(){
		$(".fleet-summary .summary-eqlos .summary-icon img").attr(
			"src",
			"../../assets/img/stats/los"+app.Config.elos_mode+".png"
		);
	},
	
	/* Custom message boxes
	-------------------------------------------------------*/
	messageBox :function(message){
		$("#messageBox .title").text(message);
		$("#panel-wrap").hide();
		$("#messageBox").show();
	},
	
	/* Show CatBomb debugger screen
	-------------------------------------------------------*/
	catBomb :function(title, message){
		$("#catBomb .title").text(title);
		$("#catBomb .description").text(message);
		$("#catBomb").fadeIn(300);
	},
	
	/* Attempt to show dashboard
	-------------------------------------------------------*/
	showPanel :function(){
		if(this.state != "playing" && this.state!="dead"){
			if(app.Master.available){
				this.state = "playing";
				$("#messageBox").hide();
				$("#panel-wrap").show();
			}else{
				this.state = "dead";
				this.messageBox("Refresh the game to view this panel!");
			}
		}
	}
};