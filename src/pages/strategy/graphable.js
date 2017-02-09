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
		
		// Refresh graph button
		$("#apply_options").on("click", function(){
			if (self.loadingGraph) return false;
			self.loadingGraph = true;
			$(".graph_options input, .graph_options select, .legend_toggle input, #apply_options").prop("disabled", true);
			
			Chart.defaults.global.scaleBeginAtZero = $(this).prop("checked");
			
			$(".graph_title").text("Loading...");
			
			self.collectData({
				tableName: self.tableName,
				graphableItems: self.graphableItems,
				start: $("#startDate").val(),
				end: $("#endDate").val(),
				interval: $("#graphInterval").val()
			});
		});
		$("#apply_options").trigger("click");
	}
	
	// Get data via worker using specified filters
	collectData(filters){
		let DataCollector = new Worker(chrome.extension.getURL('library/workers/graph-data.js'));
		DataCollector.onmessage = (response) => {
			this.refreshGraph(response.data);
			DataCollector.terminate();
		};
		DataCollector.postMessage(Object.assign({
			url: chrome.extension.getURL(""),
			playerId: PlayerManager.hq.id
		}, filters));
	}
	
	// Re-draw the graph and date title
	refreshGraph(data){
		// Show graph title dates
		$(".graph_title").text(
			new Date($("#startDate").val()).format("mmm d, yyyy")
			+" to "
			+new Date($("#endDate").val()+" 00:00:00").format("mmm d, yyyy")
		);
		
		// Draw graph
		this.ctx = $("#chart").get(0).getContext("2d");
		if (this.chart) this.chart.destroy();
		this.chart = new Chart(this.ctx).Line(data);
		
		// Revert flags and input states
		this.loadingGraph = false;
		$(".graph_options input, .graph_options select, .legend_toggle input, #apply_options").prop("disabled", false);
	}
}