(function(){
	
	const PluginDepends = [
		'localization'
	];
	
	const PluginSettings = [
		{
			id: "onlinetl_source",
			name: "Source URL",
			type: "long_text"
		}
	];
	
	const PluginLoaded = function(){
		const source = ConfigManager.onlinetl_source;
		const language = ConfigManager.language;
		
		KC3Translation.checkOnlineTranslations = function(filename){
			const self = this;
			this.loadTranslationFile('custom', function(local){
				$.ajax({
					url: source + '/' + language + '/custom.json',
					dataType: 'JSON',
					success: function(online){
						self.compareOnlineTranslations(local.fileVersions, online.fileVersions);
					}
				});
			});
		};
		
		KC3Translation.compareOnlineTranslations = function(localVersions, onlineVersions){
			const self = this;
			Object.keys(localVersions).map(function(key) {
				// Local is different from online version
				if (localVersions[key] !== onlineVersions[key]) {
					self.loadTranslationFile(key, function(){
						
					});
				}
			});
		};
		
	};
	
	KC3Plugins.registerPlugin('online-translation', PluginDepends, PluginSettings, PluginLoaded);
	
	KC3Plugins.registerHook.Game('online-translation', function(){
		KC3Translation.checkOnlineTranslations();
	});
	
})();