/*
TabResources.js
By: dragonjet

Resources tab with jistory graph.
*/

var TabResources = {
	active: false,
	ctx :{},
	chart :{},
	
	/* onReady, initialize
	--------------------------------------------*/
	init :function(){
		if(this.active) return false; this.active = true;
		
		Chart.defaults.global.scaleBeginAtZero = true;
	},
	
	/* Show the page
	--------------------------------------------*/
	show :function(){
		var self = this;
		// Get latest resource records
		database.transaction("rw", database.resource, function(){
			database.resource
				.orderBy("id")
				.reverse()
				.limit(14)
				.toArray(function(ResourceRecords){
					self.ctx = $("#myChart").get(0).getContext("2d");
					self.chart = self.draw(ResourceRecords);
				});
		}).catch(function(error){ console.error(error); });
	},
	
	/* Draw the graph
	--------------------------------------------*/
	draw :function(records){
		var times = [];
		var fuel = [];
		var ammo = [];
		var steel = [];
		var baux = [];
		var d;
		records.reverse();
		
		var prevDay = 0;
		for(i in records){
			d = new Date(records[i].time);
			// if(d.getDate() == prevDay){ return false; }
			// prevDay = d.getDate();
			times.push(d.ddmmhh());
			fuel.push(records[i].rsc1);
			ammo.push(records[i].rsc2);
			steel.push(records[i].rsc3);
			baux.push(records[i].rsc4);
		}
		
		return new Chart(this.ctx).Line({
			labels: times,
			datasets: [
				this.dataset("Fuel", "0,153,0", "AAFFAA", fuel),
				this.dataset("Ammo", "153,153,0", "999900", ammo),
				this.dataset("Steel", "153,153,153", "999999", steel),
				this.dataset("Bauxite", "255,153,51", "FF9933", baux)
			]
		}, {});
	},
	
	/* Build a dataset
	--------------------------------------------*/
	dataset :function(label, color1, color2, dataList){
		return {
			label: label,
			fillColor: "rgba(225,225,225,0)",
			strokeColor: "rgba("+color1+",1)",
			pointColor: "rgba("+color1+",1)",
			pointStrokeColor: "#"+color2,
			pointHighlightFill: "#"+color2,
			pointHighlightStroke: "rgba("+color1+",1)",
			data: dataList
		};
	},
	
	dummy:""
};