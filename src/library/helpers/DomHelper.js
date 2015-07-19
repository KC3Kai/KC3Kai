(function ($) {
    "use strict";
	
    var templates = {
        recordOverlay:
                    '<div class="overlay ol_record_sorties"></div>' +
                    '<div class="overlay ol_record_expeditions"></div>' +
                    '<div class="overlay ol_record_pvp"></div>' +
                    '<div class="overlay ol_record_ownership"></div>' +
                    '<div class="overlay ol_record_maxstats"></div>' +
                    '<div class="overlay ol_record_levelup"></div>' +
                    '<div class="overlay ol_record_bgm"></div>' +
                    '<div class="overlay ol_record_experience"></div>' +
                    '<div class="overlay ol_record_name"></div>' +
                    '<div class="overlay ol_record_rank"></div>',
    };
	
    var domCache = {
        overlays: null
    };
	
    window.DomHelper = {

        init: function () {
            domCache.overlays = $(".box-game .overlays");
        },

        getTopMargin: function () {
            return parseInt(app.Config.gambox_margin, 10);
        },

        clearOverlays: function () {
            domCache.overlays.html("");
        },

        applyRecordOverlay: function (record) {
            this.clearOverlays();

            var topMargin = this.getTopMargin();
            var recordOverlay = $(templates.recordOverlay);

            recordOverlay.appendTo(domCache.overlays);

            // Sorties
            var sorties = this.injectRecordTranslations(recordOverlay, ".ol_record_sorties",
                ["SortieWinCount", "SortieLoseCount", "SortieWinRate"]);

            sorties.css("top", (topMargin + 287) + "px");

            // Expeditions
            var expeditions = this.injectRecordTranslations(recordOverlay, ".ol_record_expeditions",
                ["TotalExpeditions", "ExpeditionSuccessCount", "ExpeditionSuccessRate"]);

            expeditions.css("top", (sorties.offset().top + sorties.height() + 8) + "px");

            // PVP
            var pvp = this.injectRecordTranslations(recordOverlay, ".ol_record_pvp",
                ["PVPWinCount", "PVPLoseCount", "PVPWinRate"]);

            pvp.css("top", (topMargin + 287) + "px");

            // Ownership
            var ownership = this.injectRecordTranslations(recordOverlay, ".ol_record_ownership",
                ["FleetsOwned", "ConstructionDockCount", "RepairDockCount", "ShipGirlsOwned", "EquipmentItemCount", "FurnitureOwned", "ServerName"]);

            ownership.css("top", (topMargin + 133) + "px");

            // Max Stats
            var maxStats = this.injectRecordTranslations(recordOverlay, ".ol_record_maxstats",
                ["MaxFleetsAvailable", "MaxShipGirlsAvailable", "MaxHomeportUpgradesAvailable", "MaxEquipmentAvailable", "QuestMarkersAvailable", "ResourceSoftcapLimit"]);

            maxStats.children("p:nth(2)").css("font-size", "9px");
            maxStats.css("top", (ownership.offset().top + ownership.height() + 13) + "px");

            // Level Up Notice
            var levelUpNotice = this.injectRecordTranslations(recordOverlay, ".ol_record_levelup",
                ["LevelUpNotice"]);

            levelUpNotice.css("top", (maxStats.offset().top + maxStats.height()) + "px");

            // BGM
            var bgm = this.injectRecordTranslations(recordOverlay, ".ol_record_bgm",
                ["MainScreenBGM"]);

            bgm.css("top", (levelUpNotice.offset().top + levelUpNotice.height()) + "px");

            // Experience
            var exp = this.injectRecordTranslations(recordOverlay, ".ol_record_experience",
                ["Experience"]);

            exp.css("top", (topMargin + 198) + "px");

            // Name
            var name = this.injectRecordTranslations(recordOverlay, ".ol_record_name",
                ["Name"]);

            name.css("top", (topMargin + 120) + "px");

            // Rank
            var rank = this.injectRecordTranslations(recordOverlay, ".ol_record_rank",
                [ app.Meta.rank(record.api_rank) ]);

            rank.css("top", (topMargin + 170) + "px");
        },

        injectRecordTranslations: function (container, selector, translationKeys) {
            var elements = $(container.filter(selector));

            elements.each(function (i, element) {
                var currentElement = $(element);

                $(translationKeys).each(function (i, key) {
                    var entry = $(document.createElement("p"));

                    entry.html(app.Meta.record(key));

                    currentElement.append(entry);
                });
            });

            return elements;
        }

    };
})(window.$);