/* GoalTemplateManager.js

   Manages goal-templates for leveling tab.

*/

(function() {
    "use strict";

    /*

      Data Format:

      localStorage.goalTemplates
      array of templates

      template:
      { stype: <array of ship types> (e.g. ["DD","CL"..])
               (ship type should be normalized (all in uppercase))
               ("*" is a ship type wildcard)
      , map: [<world#>,<map#>]
      , rank: <E,D,C,B,A,S,SS> = <1,2,3,4,5,6,7>
      , flagship: true / false
      , mvp: true / false
      , enable: true / false
      }

     */

    window.GoalTemplateManager = {
        validSTypes: [],
        enSTypeMeta: {},

        initValidSTypes: function() {
            this.enSTypeMeta = KC3Translation.getJSONWithOptions(KC3Meta.repo, "stype", false, "en", false, true);
            console.assert(this.enSTypeMeta['0'] === "", "stype should start with element 0: ''");
            delete this.enSTypeMeta['0'];
            this.validSTypes = Object.keys(this.enSTypeMeta).map(id => this.enSTypeMeta[id]);
        },
        load: function() {
            if(this.validSTypes.length === 0) {
                this.initValidSTypes();
            }
            return JSON.parse(localStorage.goalTemplates || "[]");
        },
        save: function(t) {
            if (Array.isArray(t))
                localStorage.goalTemplates = JSON.stringify(t);
            else
                console.error("Data to be saved is not an array", t);
        },
        newTemplate: function() {
            return {
                stype: ["*"],
                map: [3,2],
                rank: 6,
                flagship: true,
                mvp: true,
                baseExp: 0,
                enable: true
            };
        },
        // parse ship type query
        parseSType: function(raw) {
            var self = this;
            var parsed = raw
                .split(",")
                .map(function(x) { return x.trim(); } )
                .filter( function(x) { return x.length > 0; } )
                .map( function(x) { return x.toUpperCase(); } );
            // TODO: remove invalid & duplicate
            var shipTypes = [];

            if (parsed.indexOf("*") != -1)
                shipTypes.push("*");

            $.each(self.validSTypes , function(i,stype) {
                if (parsed.indexOf(stype) != -1)
                    shipTypes.push(stype);
            });

            // TODO: make sure "*" is handled properly
            return shipTypes;
        },
        // return a string representation of stype query
        showSType: function(stypes) {
            function translate(x) {
                return x === "*"? "Any":x;
            }
            return stypes.length === 0 ? "<Empty>" : stypes.map(translate).join(",");
        },
        showInputSType: function(stypes) {
            return stypes.join(",");
        },
        applyTemplate: function(grindData, template) {
            var result = grindData.slice();
            result[1] = template.map[0];
            result[2] = template.map[1];
            result[4] = template.rank;
            result[5] = template.flagship?1:0;
            result[6] = template.mvp?1:0;
            result[7] = template.baseExp||0;
            return result;
        },
        mapShipTypeAbbrs2Ids: function(stypeAbbrs) {
            return (stypeAbbrs || []).map(stype => this.validSTypes.indexOf(stype) + 1);
        },
        checkShipType: function(stypeId, template) {
            if (template.stype.indexOf("*") != -1)
                return true;
            var stypeIds = this.mapShipTypeAbbrs2Ids(template.stype);
            return stypeIds.indexOf(stypeId) != -1;
        }
    };

})();
