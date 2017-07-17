(function(){
	
	class KC3Graphable {
		
		constructor(tableName, graphableItems){
			this.tableName = tableName;
			this.graphableItems = graphableItems;
			this.loadingGraph = false;
			this.ctx   = null;
			this.chart = null;
		}
		
		// Executes only on first tab visit unless refreshed
		init(){
			
		}
		
		// Executes every tab visit
		execute(){
			let self = this;
			
			// Set default filter states
			let startDate = new Date();
			let endDate = new Date();
			startDate.setDate(endDate.getDate()-30);
			$("#startDate").val(startDate.format("yyyy-mm-dd"));
			$("#endDate").val(endDate.format("yyyy-mm-dd"));
			$("#graphInterval").val(24);
			$("#startZero").prop("checked", true);
			$("#showTooltips").prop("checked", true);
			
			// User input refreshes the graph
			$(".graph_input").on("change", function(){
				self.triggerRefresh();
			});
			$(".graph_input[type=date]").off("change");
			$(".graph_input[type=date]").on("blur", function(){
				self.triggerRefresh();
			});
			
			// Presets
			$(".option_preset").on("click", function(){
				switch ($(this).data("preset")) {
					case "day":
						startDate = new Date();
						startDate.setDate(endDate.getDate()-1);
						$("#startDate").val(startDate.format("yyyy-mm-dd"));
						$("#endDate").val(endDate.format("yyyy-mm-dd"));
						$("#graphInterval").val(1);
						break;
					case "week":
						startDate = new Date();
						startDate.setDate(endDate.getDate()-7);
						$("#startDate").val(startDate.format("yyyy-mm-dd"));
						$("#endDate").val(endDate.format("yyyy-mm-dd"));
						$("#graphInterval").val(24);
						break;
					case "month":
						startDate = new Date();
						startDate.setDate(endDate.getDate()-30);
						$("#startDate").val(startDate.format("yyyy-mm-dd"));
						$("#endDate").val(endDate.format("yyyy-mm-dd"));
						$("#graphInterval").val(24);
						break;
				}
				self.triggerRefresh();
			});
			
			// Initial refresh graph onload
			this.triggerRefresh();
		}
		
		triggerRefresh(){
			if (this.loadingGraph) return false;
			this.loadingGraph = true;
			
			if (this.chart) this.chart.destroy();
			$(".graph_input").prop("disabled", true);
			$(".graph_title").text("Loading...");
			$(".loading").show();
			
			this.collectData({
				tableName: this.tableName,
				graphableItems: this.graphableItems,
				start: $("#startDate").val(),
				end: $("#endDate").val(),
				interval: $("#graphInterval").val(),
				delta: $("#deltaMode").prop("checked")
			});
		}
		
		// Get data via worker using specified filters
		collectData(filters){
			let DataCollector = new Worker(chrome.extension.getURL('library/workers/graph-data.js'));
			DataCollector.onmessage = (response) => {
				if (response.data) {
					this.refreshGraph(response.data);
				} else {
					this.loadingGraph = false;
					$(".loading").hide();
					$(".graph_title").text("Unable to render");
					$(".graph_input").prop("disabled", false);
				}
				DataCollector.terminate();
			};
			DataCollector.postMessage(Object.assign({
				url: chrome.extension.getURL(""),
				playerId: PlayerManager.hq.id
			}, filters));
		}
		
		// Re-draw the graph and date title
		refreshGraph(data){
			$(".loading").hide();
			// Show graph title dates
			$(".graph_title").text(
				new Date($("#startDate").val()).format("mmm d, yyyy")
				+" to "
				+new Date($("#endDate").val()+" 00:00:00").format("mmm d, yyyy")
			);
			
			// Ability to hide types
			this.graphableItems.dbkey.forEach(function(dbkey, ind){
				if (!$(".legend_toggle input[data-type=\""+dbkey+"\"]").prop("checked")) {
					delete data.datasets[dbkey];
				}
			});
			
			// New chart JS only accepts an array, not object
			data.datasets = Object.keys(data.datasets).map(key => data.datasets[key]);
			console.debug("Graph datasets", data.datasets);
			
			// Draw graph
			this.ctx = $("#chart").get(0).getContext("2d");
			if (this.chart) this.chart.destroy();
			this.chart = new Chart(this.ctx, {
				type: 'line',
				data: data,
				options: {
					legend: { display: false },
					tooltips: {
						enabled: $("#showTooltips").prop("checked"),
						mode: "index",
						intersect: false
					},
					scales: { yAxes: [{ ticks: { beginAtZero: $("#startZero").prop("checked") } }] }
				}
			});
			
			// Revert flags and input states
			this.loadingGraph = false;
			$(".graph_input").prop("disabled", false);
		}
	}
	
	window.KC3Graphable = KC3Graphable;
	
})();