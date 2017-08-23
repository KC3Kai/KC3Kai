(function () {
    "use strict";

    var imgurLimit = 0;
    var enableShelfTimer = null;

    function generateFontString(weight, px) {
        return weight + " " + px + "px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
    }

    window.ShowcaseExporter = function () {
        this.canvas = {};
        this.ctx = {};
        this.allShipGroups = {};
        this.loading = 0;
        this.isShipList = true;
        this.shipCount = 0;
        this.rowParams = {
            width: 330,
            height: 35
        };
        this.lock_plan = null;
        this.colors = {
            odd: "#e0e0e0",
            even: "#f2f2f2",
            border: "#fff",
            creditsBackground: "#fff",
            creditsFontColor: "#000",
            shipTypeHeader: "#0066cc",
            statFP: "#ff8888",
            statTP: "#00ccff",
            statAA: "#ff9900",
            statAR: "#ffcc00",
            statLK: "#66ff66",
            shipInfo: "#000",
            canvasBackground: "#efefef",
            equipGroup: "#000",
            equipType: "#000",
            equipCount: "#000",
            equipStars: "#42837f",
            equipInfo: "#000",
            equipStat: "#000",
            /* should match lock mods in light theme. see legacy.css */
            lock_modes: {
                1: "#029DD5",
                2: "#64B162",
                3: "#CCC700",
                4: "#EB9528",
                5: "#B1A2C1"
            }
        };

        this.buildSettings = {};
        this.columnCount = 5;
        this.loadingCount = 0;
        this.callback = function () {
        };
        this._statsImages = {
            fp: null,
            tp: null,
            aa: null,
            ar: null,
            as: null,
            ev: null,
            ls: null,
            dv: null,
            ht: null,
            rn: null,
            or: null
        };
        this._equipTypeImages = {};
        this._shipImages = {};
        this._otherImages = {};
        this._equipCanvases = {};
        this._equipGroupCanvases = {};
        this._paramToApi = {
            fp: "api_houg",
            tp: "api_raig",
            aa: "api_tyku",
            ar: "api_souk",
            as: "api_tais",
            ev: "api_houk",
            ls: "api_saku",
            dv: "api_baku",
            ht: "api_houm",
            rn: "api_leng",
            or: "api_distance",
            lk: "api_luck"
        };
        this._modToParam = ["fp", "tp", "aa", "ar", "lk"];
    };

    ShowcaseExporter.prototype._init = function () {
        this.canvas = document.createElement("CANVAS");
        this.ctx = this.canvas.getContext("2d");
        this.allShipGroups = {};
        var columnCount = parseInt(this.columnCount,10);
        if (isNaN(columnCount) || columnCount < 3)
            this.columnCount = 3;
        for (var i in KC3Meta._stype) {
            if (KC3Meta._stype !== "")
                this.allShipGroups[i] = [];
        }
    };

    ShowcaseExporter.prototype.complete = function () {
        (this.callback || function () {
        })();
    };

    ShowcaseExporter.prototype._drawBorders = function (canvas, ctx, rowWidth) {
        if (!canvas)
            canvas = this.canvas;
        if (!ctx)
            ctx = this.ctx;
        if (!rowWidth)
            rowWidth = this.rowParams.width;
        for (var x = rowWidth; x < canvas.width; x += rowWidth) {
            ctx.fillStyle = this.colors.border;
            for (var y = 0; y < canvas.height; y += 20) {
                ctx.fillRect(x - 1, y, 2, 10);
            }
        }
    };

    ShowcaseExporter.prototype._addCredits = function (canvasData) {
        if (!canvasData)
            canvasData = this.canvas;

        var canvas = document.createElement("CANVAS");
        var ctx = canvas.getContext("2d");

        var fontSize = 18;
        canvas.height = canvasData.height + this.rowParams.height * 2 + fontSize + 4;
        canvas.width = canvasData.width;

        ctx.fillStyle = this.colors.creditsBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvasData, 0, this.rowParams.height * 2, canvasData.width, canvasData.height);

        var created = "Made in KC3 on " + dateFormat("dd mmm yyyy");
        ctx.font = generateFontString(400, fontSize);
        ctx.fillStyle = this.colors.creditsFontColor;

        ctx.fillText(
            created,
            canvas.width - this.rowParams.height * 0.5 - ctx.measureText(created).width,
            canvas.height - 1
        );

        var x = 20;
        if (this.buildSettings.exportName) {
            ctx.fillText("HQ Lv " + PlayerManager.hq.level, x, canvas.height - 1);
            x += ctx.measureText("HQ Lv " + PlayerManager.hq.level).width + 50;
        }

        if (this.isShipList) {
            x = this._addConsumableImage(ctx, canvas, x, "medals") + 50;
            this._addConsumableImage(ctx, canvas, x, "blueprints");
        } else {
            x = this._addConsumableImage(ctx, canvas, x, "devmats") + 50;
            this._addConsumableImage(ctx, canvas, x, "screws");
        }

        var topLine = this.isShipList ? "Ship List" : "Equipment List";
        var fileName = topLine + dateFormat(" yyyy-mm-dd");
        if (this.buildSettings.exportName) {
            topLine = PlayerManager.hq.rank + " " + PlayerManager.hq.name + " " + topLine;
        }

        fontSize = 30;
        ctx.font = generateFontString(600, fontSize);

        var available = canvas.width - this.rowParams.height * 5;
        while (ctx.measureText(topLine).width > available) {
            fontSize--;
            ctx.font = generateFontString(600, fontSize);
        }

        ctx.fillText(topLine, (canvas.width - ctx.measureText(topLine).width) / 2, this.rowParams.height + fontSize / 2);

        var img = new Image();
        img.exporter = this;
        img.onload = function () {
            ctx.drawImage(
                img,
                0, 0, img.width, img.height,
                canvas.width - this.exporter.rowParams.height * 2, 0,
                this.exporter.rowParams.height * 2, this.exporter.rowParams.height * 2
            );

            ctx.drawImage(
                img,
                0, 0, img.width, img.height,
                0, 0,
                this.exporter.rowParams.height * 2, this.exporter.rowParams.height * 2
            );
            this.exporter._finish(canvas, fileName);
        };
        img.src = "/assets/img/logo/128.png";

    };

    ShowcaseExporter.prototype._addConsumableImage = function (ctx, canvas, x, type) {
        ctx.fillText(JSON.parse(localStorage.consumables)[type], x, canvas.height - 1);
        x += ctx.measureText(JSON.parse(localStorage.consumables)[type]).width + 5;
        ctx.drawImage(this._otherImages[type], x, canvas.height - 18, 18, 18);
        return x + 18;
    };

    ShowcaseExporter.prototype._loadImage = function (imageName, imageGroup, url, callback) {
        var img = new Image();
        var self = this;
        img.imageName = imageName;
        this.loadingCount++;

        img.onload = function () {
            self[imageGroup][this.imageName] = this;
            self.loadingCount--;

            if (self.loadingCount === 0)
                callback();
        };
        img.onerror = function(){
            self[imageGroup][this.imageName] = self._otherImages.empty;
            self.loadingCount--;

            if (self.loadingCount === 0)
                callback();
        };
        img.src = url;
    };

    ShowcaseExporter.prototype._loadImages = function (callback) {
        var self = this;
        this._loadImage("empty", "_otherImages", "/assets/img/ui/empty.png", function(){
            for (var i in self._statsImages) {
                if (!self._statsImages.hasOwnProperty(i))
                    continue;
                self._loadImage(i, "_statsImages", "/assets/img/stats/" + i + ".png", callback);
            }

            for (i in self._equipTypeImages) {
                if (!self._equipTypeImages.hasOwnProperty(i))
                    continue;
                self._loadImage(i, "_equipTypeImages", "/assets/img/items/" + i + ".png", callback);
            }

            for (i in self._shipImages) {
                if (!self._shipImages.hasOwnProperty(i))
                    continue;
                self._loadImage(i, "_shipImages", "/assets/img/ships/" + i + ".png", callback);
            }

            self._loadImage("medals", "_otherImages", "/assets/img/useitems/57.png", callback);
            self._loadImage("blueprints", "_otherImages", "/assets/img/useitems/58.png", callback);
            self._loadImage("screws", "_otherImages", "/assets/img/useitems/4.png", callback);
            self._loadImage("devmats", "_otherImages", "/assets/img/useitems/3.png", callback);
        });
    };

    ShowcaseExporter.prototype.cleanUp = function () {
        this.canvas = {};
        this.ctx = {};
        this.allShipGroups = {};
        this._statsImages = {};
        this._equipTypeImages = {};
        this._shipImages = {};
        this._otherImages = {};
        this._equipCanvases = {};
        this._equipGroupCanvases = {};
    };

    ShowcaseExporter.prototype._finish = function (canvas, topLine) {
        var self = this;
        new KC3ImageExport(canvas, {
            filename: topLine,
            method: this.buildSettings.output,
        }).export(function (error, result) {
            self.complete(result || {});
        });
    };

    ShowcaseExporter.prototype._heartLockAlert = function(){
        this.cleanUp();
        alert("Please heartlock your ships\\equipment or use \"Full\" mode.\nYou can read about heartlocking on wiki.");
        this.complete({});
        return false;
    };

    /* SHIP EXPORT
     ------------------------- */
    ShowcaseExporter.prototype.exportShips = function () {
        this._init();
        this.isShipList = true;
        this.rowParams = {
            width: 330,
            height: 35
        };
        if(this.buildSettings.exportMode === "light"){
            this.rowParams.width = this.rowParams.height*3;
            this.columnCount=this.columnCount*2;
        }
        if(this.buildSettings.eventLocking === true && typeof localStorage.lock_plan !== "undefined"){
            this.lock_plan = {};
            JSON.parse(localStorage.lock_plan).map((ships, lock_num) => {
                ships.map((shipId) => {
                    this.lock_plan[shipId] = lock_num + 1;
                });
            });
        }
        if(!this._getShips()){
            return;
        }
        var self = this;
        this._loadImages(function () {
            self._resizeCanvas();
            var x = 0;
            var y = 0;
            var color = self.colors.odd;
            for (var type in self.allShipGroups) {
                if (self.allShipGroups[type].length > 0) {
                    if (y >= self.canvas.height - self.rowParams.height) {
                        x += self.rowParams.width;
                        y = 0;
                    }

                    self._drawShipTypeName(x, y, type, color);
                    y += self.rowParams.height;

                    for (var j = 0; j < self.allShipGroups[type].length; j++) {
                        self._drawShip(x, y, self.allShipGroups[type][j], color);
                        y += self.rowParams.height;
                        if (y >= self.canvas.height) {
                            x += self.rowParams.width;
                            y = 0;
                        }
                    }
                    if (color === self.colors.even)
                        color = self.colors.odd;
                    else
                        color = self.colors.even;
                }
            }

            self._finalize();
        });
    };

    ShowcaseExporter.prototype._drawShipTypeName = function (x, y, type, background) {
        this.ctx.fillStyle = background;
        this.ctx.fillRect(x, y, this.rowParams.width, this.rowParams.height);

        var fontSize = 25;
        this.ctx.textBaseline = "middle";
        this.ctx.font = generateFontString(600, fontSize);
        this.ctx.fillStyle = this.colors.shipTypeHeader;
        this.ctx.fillText(KC3Meta.stype(type), x + this.rowParams.height / 2, y + (this.rowParams.height) / 2);
    };

    ShowcaseExporter.prototype._finalize = function () {
        if (this.loading !== 0)
            return;
        this._drawBorders();
        this._addCredits(null);
    };

    ShowcaseExporter.prototype._resizeCanvas = function () {
        var types = 0;
        for (var type in this.allShipGroups) {
            if (this.allShipGroups[type].length > 0)
                types++;
        }
        this.canvas.height = Math.ceil((this.shipCount + types) / this.columnCount) * this.rowParams.height;
        this.canvas.width = this.columnCount * this.rowParams.width;

        if (!this._checkFit()) {
            this.canvas.height = Math.ceil((this.shipCount + types) / this.columnCount + 1) * this.rowParams.height;
            this.canvas.width = this.columnCount * this.rowParams.width;
        }

        this._fill();
    };

    ShowcaseExporter.prototype._checkFit = function () {
        // i don't know how to make this check better
        // math....
        var x = 0;
        var y = 0;
        for (var type in this.allShipGroups) {
            if (this.allShipGroups[type].length > 0) {
                if (y >= this.canvas.height - this.rowParams.height) {
                    x += this.rowParams.width;
                    y = 0;
                }
                // drawing title
                y += this.rowParams.height;

                for (var j = 0; j < this.allShipGroups[type].length; j++) {
                    // drawing ship
                    y += this.rowParams.height;
                    if (y >= this.canvas.height) {
                        x += this.rowParams.width;
                        y = 0;
                    }
                }
            }
        }

        return !(x >= this.canvas.width && y !== 0);
    };

    ShowcaseExporter.prototype._getShips = function () {
        KC3ShipManager.load();
        var ships;
        if(this.buildSettings.exportMode !== "full") {
            ships = KC3ShipManager.find(function (s) {
                return s.lock !== 0;
            });
            if(ships.length === 0){
                return this._heartLockAlert();
            }
        } else {
            ships = KC3ShipManager.list;
        }

        for (var i in ships) {
            this.allShipGroups[ships[i].master().api_stype].push(ships[i]);
            this._shipImages[ships[i].masterId] = null;
            this.shipCount++;
        }

        for (i in this.allShipGroups) {
            if (this.allShipGroups[i].length > 0) {
                this.allShipGroups[i].sort(function (shipA, shipB) {
                    if (shipB.level !== shipA.level)
                        return shipB.level - shipA.level;
                    else
                        return shipB.masterId - shipA.masterId;
                });
            }
        }
        return true;
    };

    ShowcaseExporter.prototype._drawShip = function (x, y, ship, background) {
        this.ctx.fillStyle = background;
        this.ctx.fillRect(x, y, this.rowParams.width, this.rowParams.height);
        var xOffset = this.rowParams.height / 7;

        if(this.buildSettings.eventLocking === true){
            if(ship.sally !== 0){
                this.ctx.fillStyle = this.ctx.strokeStyle = this.colors.lock_modes[ship.sally];
                if(this.buildSettings.exportMode==="light"){
                    this.ctx.fillRect(x + this.rowParams.height * 1.2 + xOffset, y, this.rowParams.width - this.rowParams.height * 1.2 - xOffset, this.rowParams.height);
                } else {
                    this.ctx.fillRect(x + this.rowParams.height * 2,y,this.rowParams.width - this.rowParams.height * 2, this.rowParams.height);
                }
            } else if(this.lock_plan !== null && this.lock_plan[ship.rosterId]){
                this.ctx.beginPath();
                this.ctx.fillStyle = this.ctx.strokeStyle = this.colors.lock_modes[this.lock_plan[ship.rosterId]];
                var circleRadius = 5;
                this.ctx.strokeStyle = circleRadius;
                this.ctx.arc(x + this.rowParams.width - circleRadius * 2, y + this.rowParams.height / 2, circleRadius, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.stroke();
            }
        }

        this._drawStat(ship, "fp", x + xOffset, y, this.rowParams.height / 2, this.rowParams.height / 2, this.colors.statFP);
        this._drawStat(ship, "tp", x + xOffset + this.rowParams.height / 2, y, this.rowParams.height / 2, this.rowParams.height / 2, this.colors.statTP);
        this._drawStat(ship, "aa", x + xOffset + this.rowParams.height / 2, y + this.rowParams.height / 2, this.rowParams.height / 2, this.rowParams.height / 2, this.colors.statAA);
        this._drawStat(ship, "ar", x + xOffset, y + this.rowParams.height / 2, this.rowParams.height / 2, this.rowParams.height / 2, this.colors.statAR);
        this._drawStat(ship, "lk", x + xOffset + this.rowParams.height, y, this.rowParams.height / 5, this.rowParams.height, this.colors.statLK);

        this._drawIcon(x + xOffset, y, ship.masterId);

        this.ctx.font = generateFontString(400, 24);
        this.ctx.fillStyle = this.colors.shipInfo;
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
            ship.level,
            x + this.rowParams.width - this.rowParams.height * 0.5 - this.ctx.measureText(ship.level).width,
            y + this.rowParams.height / 2
        );

        if(this.buildSettings.exportMode !== "light") {
            var fontSize = 24;
            this.ctx.font = generateFontString(400, fontSize);
            while (this.ctx.measureText(ship.name()).width > this.rowParams.width - this.rowParams.height * 3.5) {
                fontSize--;
                this.ctx.font = generateFontString(400, fontSize);
            }
            this.ctx.fillStyle = this.colors.shipInfo;
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(ship.name(), x + this.rowParams.height * 2, y + this.rowParams.height / 2);
        }

    };

    ShowcaseExporter.prototype._drawIcon = function (x, y, shipId) {
        this.ctx.drawImage(
            this._shipImages[shipId],
            0, 0, this._shipImages[shipId].width, this._shipImages[shipId].height,
            x, y, this.rowParams.height, this.rowParams.height
        );
    };

    ShowcaseExporter.prototype._drawStat = function (ship, stat, x, y, w, h, color) {
        var MasterShipStat = ship.master()[this._paramToApi[stat]];
        this.ctx.fillStyle = color;
        if (stat === "lk") {
            if (MasterShipStat[0] + ship.mod[this._modToParam.indexOf(stat)] >= 50) {
                this.ctx.fillRect(x, y, w, h);
            } else if (MasterShipStat[0] + ship.mod[this._modToParam.indexOf(stat)] >= 40) {
                this.ctx.fillRect(x, y, w, h / 2);
            }
        } else if (MasterShipStat[0] + ship.mod[this._modToParam.indexOf(stat)] >= MasterShipStat[1]) {
            this.ctx.fillRect(x, y, w, h);
        }
    };

    ShowcaseExporter.prototype._fill = function () {
        this.ctx.fillStyle = this.colors.canvasBackground;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };

    /* EQUIP EXPORT
     ------------------------- */

    ShowcaseExporter.prototype.exportEquip = function () {
        this.isShipList = false;
        this.rowParams = {
            width: 350,
            height: 30
        };
        if(this.buildSettings.exportMode === "light"){
            this.rowParams.width = 250;
        }
        var gears = this._getGears();
        if(Object.keys(gears).length===0){
            return this._heartLockAlert();
        }
        var self = this;

        this._loadImages(function () {
            self._processGears(gears);
        });
    };

    ShowcaseExporter.prototype._getGears = function () {
        var allGears = JSON.parse(localStorage.gears);
        var sorted = {};
        for (var i in allGears) {
            if (this.buildSettings.exportMode !== "full" && allGears[i].lock === 0)
                continue;

            var equip = allGears[i];
            var equipMaster = KC3Master.slotitem(equip.masterId);

            var masterId = "m" + equip.masterId;
            var typeId = "t" + equipMaster.api_type[3];
            var groupId = "g" + equipMaster.api_type[0];
            if (!sorted[groupId]) {
                sorted[groupId] = {
                    name: KC3Meta.gearTypeName(0, equipMaster.api_type[0]),
                    types: {}
                };
            }

            if (!sorted[groupId].types[typeId]) {
                sorted[groupId].types[typeId] = {
                    typeId: KC3Master.slotitem(equip.masterId).api_type[3],
                    name: KC3Meta.gearTypeName(2, equipMaster.api_type[2]),
                    gears: {}
                };
                this._equipTypeImages[KC3Master.slotitem(equip.masterId).api_type[3]] = null;
            }

            if (!sorted[groupId].types[typeId].gears[masterId]) {
                sorted[groupId].types[typeId].gears[masterId] = {
                    masterId: equip.masterId,
                    name: KC3Meta.gearName(equipMaster.api_name),
                    fp: equipMaster.api_houg,
                    tp: equipMaster.api_raig,
                    aa: equipMaster.api_tyku,
                    ar: equipMaster.api_souk,
                    as: equipMaster.api_tais,
                    ev: equipMaster.api_houk,
                    ls: equipMaster.api_saku,
                    dv: equipMaster.api_baku,
                    ht: equipMaster.api_houm,
                    rn: equipMaster.api_leng,
                    or: equipMaster.api_distance,
                    "total": 0, "s0": 0,
                    "s1": 0, "s2": 0, "s3": 0, "s4": 0, "s5": 0,
                    "s6": 0, "s7": 0, "s8": 0, "s9": 0, "s10": 0
                };
            }
            sorted[groupId].types[typeId].gears[masterId]["s" + equip.stars]++;
            sorted[groupId].types[typeId].gears[masterId].total++;
        }

        return sorted;
    };

    ShowcaseExporter.prototype._processGears = function (gears) {
        var canvas = document.createElement("CANVAS");
        var ctx = canvas.getContext("2d");

        this._drawEquipGroups(gears);
        var columns = this._splitEquipByColumns(this.columnCount);
        this._fillEquipCanvas(canvas, ctx, columns);
        this._drawBorders(canvas, ctx);
        this._addCredits(canvas);
    };

    ShowcaseExporter.prototype._fillEquipCanvas = function (canvas, ctx, columns) {
        canvas.height = this._getBiggestColumn(columns);
        canvas.width = this.rowParams.width * columns.length;
        ctx.fillStyle = this.colors.odd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            var y = 0, x = i * this.rowParams.width;
            for (var j = 0; j < column.length; j++) {
                var canvasData = this._equipGroupCanvases[column[j]];
                ctx.drawImage(canvasData, x, y, canvasData.width, canvasData.height);
                y += canvasData.height;
            }
        }
    };

    ShowcaseExporter.prototype._getBiggestColumn = function (columns) {
        var maxSize = 0;
        for (var i = 0; i < columns.length; i++) {
            if (typeof columns[i] !== "object")
                continue;

            var size = 0;
            for (var j = 0; j < columns[i].length; j++) {
                size += this._equipGroupCanvases[columns[i][j]].height;
            }
            if (maxSize < size)
                maxSize = size;
        }
        return maxSize;
    };

    ShowcaseExporter.prototype._splitEquipByColumns = function (maxColumns) {
        var maxHeight = this._getMaxHeight(), totalHeight = this._getTotalHeight();
        var approxSize = Math.max(Math.ceil(totalHeight / maxColumns), maxHeight);
        var paging = this._fillEquipColumns(approxSize);

        if (paging.length > maxColumns) {
            paging = this._fixEquipPaging(approxSize, paging, maxColumns);
        }
        return paging;
    };

    ShowcaseExporter.prototype._fixEquipPaging = function (approxSize, paging, maxColumns) {
        while (paging.length > maxColumns) {
            paging = this._fillEquipColumns(approxSize++);
        }
        return paging;
    };

    ShowcaseExporter.prototype._fillEquipColumns = function (approxSize) {
        var groupIds = [];
        for (var groupId in this._equipGroupCanvases) {
            if (groupId.startsWith("g"))
                groupIds.push(parseInt(groupId.slice(1)));
        }
        groupIds.sort(function (a, b) {
            return a - b;
        });


        var newPaging = [[]];
        var size = 0;
        var column = 0;
        for (var i = 0; i < groupIds.length; i++) {
            if (size + this._equipGroupCanvases["g" + groupIds[i]].height > approxSize) {
                column++;
                newPaging.push([]);
                size = 0;
            }
            newPaging[column].push("g" + groupIds[i]);
            size += this._equipGroupCanvases["g" + groupIds[i]].height;
        }
        return newPaging;
    };

    ShowcaseExporter.prototype._getMaxHeight = function () {
        var maxHeight = 0;

        for (var groupId in this._equipGroupCanvases) {
            if (!this._equipGroupCanvases.hasOwnProperty(groupId))
                continue;
            if (this._equipGroupCanvases[groupId].height > maxHeight)
                maxHeight = this._equipGroupCanvases[groupId].height;
        }
        return maxHeight;
    };

    ShowcaseExporter.prototype._getTotalHeight = function () {
        var totalHeight = 0;

        for (var groupId in this._equipGroupCanvases) {
            if (!this._equipGroupCanvases.hasOwnProperty(groupId))
                continue;
            totalHeight += this._equipGroupCanvases[groupId].height;
        }
        return totalHeight;
    };

    ShowcaseExporter.prototype._drawEquipGroups = function (gears) {
        var groupIds = [];
        for (var groupId in gears) {
            if (groupId.startsWith("g"))
                groupIds.push(parseInt(groupId.slice(1)));
        }
        groupIds.sort(function (a, b) {
            return a - b;
        });

        var bool = true;
        for (var i = 0; i < groupIds.length; i++) {
            var canvas = document.createElement("CANVAS"), ctx = canvas.getContext("2d");
            canvas.height = this._drawEquipGroup(gears["g" + groupIds[i]]);
            canvas.width = this.rowParams.width;
            ctx.fillStyle = bool ? this.colors.odd : this.colors.even;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            bool = !bool;
            this._addEquipGroupsToCanvas(gears["g" + groupIds[i]], canvas, ctx);
            this._equipGroupCanvases["g" + groupIds[i]] = canvas;
        }
    };

    ShowcaseExporter.prototype._addEquipGroupsToCanvas = function (group, canvas, ctx) {
        function compareEquip(a, b) {
            var equipA = KC3Master.slotitem(a.slice(1)), equipB = KC3Master.slotitem(b.slice(1));
            return equipB[sortingParam] - equipA[sortingParam];
        }

        var typeCount = Object.keys(group.types).length;

        var y = 0;
        var fontSize = 20;
        ctx.font = generateFontString(600, fontSize);
        ctx.fillStyle = this.colors.equipGroup;
        ctx.fillText(group.name, (canvas.width - ctx.measureText(group.name).width) / 2, ( this.rowParams.height + fontSize) / 2);
        y += this.rowParams.height;

        for (var typeId in group.types) {
            if (typeId.startsWith("t")) {
                var type = group.types[typeId];
                if (typeCount > 1 && this.buildSettings.exportMode !== "light") {
                    y += this.rowParams.height / 2;
                    fontSize = 20;
                    ctx.font = generateFontString(500, fontSize);
                    ctx.fillStyle = this.colors.equipType;
                    ctx.fillText(type.name, (canvas.width - ctx.measureText(type.name).width) / 2, y + (this.rowParams.height + fontSize) / 2);
                    y += this.rowParams.height * 1.5;
                }

                var masterIds = [];
                for (var masterId in type.gears) {
                    if (!type.hasOwnProperty(masterId) && masterId.startsWith("m")) {
                        masterIds.push(masterId);
                    }
                }

                var sortingParam = this._paramToApi[KC3StrategyTabs.gears.definition._defaultCompareMethod[typeId]];
                if (!!sortingParam) {
                    masterIds.sort(compareEquip);
                }

                for (var i = 0; i < masterIds.length; i++) {
                    masterId = masterIds[i];
                    var canvasData = this._equipCanvases[masterId];
                    ctx.drawImage(canvasData, 0, y, canvasData.width, canvasData.height);
                    y += canvasData.height;

                }
                y += this.rowParams.height * 0.5;

                ctx.fillStyle = this.colors.border;
                for (var xPos = 0; xPos < 0 + canvas.width; xPos += 20) {
                    ctx.fillRect(xPos, y - 2, 10, 2);
                }
            }
        }
    };

    ShowcaseExporter.prototype._drawEquipGroup = function (group) {
        var typeCount = Object.keys(group.types).length;

        var height = 0;
        for (var i in group.types) {
            if (i.startsWith("t")) {
                height += this._drawEquipTypes(group.types[i]);
            }
        }
        if (typeCount > 1 && this.buildSettings.exportMode !== "light")
            height += this.rowParams.height * typeCount * 2;// + typename each
        return height + this.rowParams.height;// + groupName
    };

    ShowcaseExporter.prototype._drawEquipTypes = function (types) {
        var height = 0;

        for (var masterId in types.gears) {
            if (!types.hasOwnProperty(masterId) && masterId.startsWith("m")) {
                height += this._drawEquip(types.gears[masterId], false);
            }
        }
        return height + 0.5 * this.rowParams.height;
    };

    ShowcaseExporter.prototype._drawEquip = function (equip, fake) {
        var height;
        if (!fake) {
            height = this._drawEquip(equip, true);
        }

        var img = this._equipTypeImages[KC3Master.slotitem(equip.masterId).api_type[3]];
        var canvas = document.createElement("CANVAS"), ctx = canvas.getContext("2d");
        var x = 0, y = 0;

        if (fake === false) {
            canvas.width = this.rowParams.width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, this.rowParams.height, this.rowParams.height);
        }

        var equipMaxY = this._drawEquipInfo(equip, ctx, x, y, fake);


        var fontSize;
        for (var i = 0; i <= 10; i++) {
            var text = "";
            if (i === 0) {
                fontSize = 18;
                y += (this.rowParams.height + fontSize) / 2;
                text = "x" + equip.total;
                ctx.font = generateFontString(400, fontSize);
                ctx.fillStyle = this.colors.equipCount;
                if (!fake)
                    ctx.fillText(text, x + this.rowParams.width - this.rowParams.height * 0.3 - ctx.measureText(text).width, y);
            } else {
                fontSize = 13;
                if (equip["s" + i] === 0)
                    continue;
                y += fontSize + 2;

                ctx.fillStyle = this.colors.equipCount;
                ctx.font = generateFontString(400, fontSize);
                text = " x" + equip["s" + i];
                var xOffset = ctx.measureText(text).width;
                if (!fake)
                    ctx.fillText(text, x + this.rowParams.width - this.rowParams.height * 0.3 - ctx.measureText(text).width, y);


                text = "★" + i;
                ctx.fillStyle = this.colors.equipStars;
                ctx.font = generateFontString(600, fontSize);
                if (!fake)
                    ctx.fillText(text, x + this.rowParams.width - this.rowParams.height * 0.3 - xOffset - ctx.measureText(text).width, y);
            }
        }
        if (equipMaxY > y)
            y = equipMaxY;

        this._equipCanvases["m" + equip.masterId] = canvas;
        return y + ((this.buildSettings.exportMode !== "light") ? 5 : 0);
    };

    ShowcaseExporter.prototype._drawEquipInfo = function (equip, ctx, x, y, fake) {
        var startY = y;
        var fontSize = 13;
        ctx.font = generateFontString(400, fontSize);
        ctx.fillStyle = this.colors.equipInfo;

        /**
         * 1 - equip image
         * 0.3 - padding right
         * 1.6 - for count text and stars
         */
        var available = this.rowParams.width - this.rowParams.height * 2.9;

        var name = this._splitText(equip.name, ctx, available);
        var miltiLine = this.buildSettings.exportMode !== "light" && equip.name !== KC3Master.slotitem(equip.masterId).api_name;

        y = this._drawEquipName(name, ctx, x + 30, y, fontSize, miltiLine, fake);

        if (miltiLine) {
            name = this._splitText(KC3Master.slotitem(equip.masterId).api_name, ctx, available, "");
            y = this._drawEquipName(name, ctx, x + 30, y, fontSize, miltiLine, fake);
        }
        y = y < startY + 30 ? startY + 30 : y;
        y += 5;

        var statsY = 0;
        if(this.buildSettings.exportMode !== "light")
            statsY = this._drawEquipStats(equip, ctx, x + this.rowParams.height, y, available, fake);
        y = Math.max(statsY, y);
        if (statsY > 0)
            y += 10;
        return y;
    };

    ShowcaseExporter.prototype._drawEquipName = function (nameLines, ctx, x, y, fontSize, multiLine, fake) {
        if (nameLines.length === 1) {
            var addY = (multiLine) ? (fontSize + 2) : ((this.rowParams.height + fontSize)/2);
            if (!fake)
                ctx.fillText(nameLines[0], x, y + addY);
            y += addY + 5;
        } else {
            for (var i = 0; i < nameLines.length; i++) {
                if (!fake)
                    ctx.fillText(nameLines[i], x, y + fontSize + 2);
                y += fontSize + 5;
            }
        }
        return y + 2;
    };

    ShowcaseExporter.prototype._splitText = function (text, ctx, maxWidth, splitter) {
        if (typeof splitter === "undefined")
            splitter = " ";

        //@TODO smarter split  "ABC ( D E F )" -> ["ABC", "( D E F )"]
        var rows = [];
        var words = text.split(splitter);

        while (words.length > 0) {
            var line = [];
            var next = words.shift();
            var brokenWord;
            if (ctx.measureText(next).width >= maxWidth) {
                brokenWord = this._splitText(next, ctx, maxWidth - ctx.measureText("-").width, "");
                next = brokenWord.shift() + "-";
                words = brokenWord.concat(words);
            }
            while (ctx.measureText((line.join(splitter) + splitter + next).trim()).width < maxWidth && next !== "") {
                line.push(next);
                if (words.length > 0) {
                    next = words.shift();
                    if (ctx.measureText(next).width >= maxWidth) {
                        var remainWidth = maxWidth - ctx.measureText((line.join(splitter) + splitter + "-")).width;
                        if (remainWidth / maxWidth < 0.3) {
                            remainWidth = maxWidth;
                        }
                        brokenWord = this._splitText(next, ctx, remainWidth, "");
                        next = brokenWord.shift() + "-";
                        words.unshift(brokenWord.join(""));
                    }
                }
                else
                    next = "";
            }
            rows.push(line.join(splitter));
            if (next !== "") {
                words.unshift(next);
            }
        }

        return rows;
    };

    ShowcaseExporter.prototype._drawEquipStats = function (equip, ctx, x, y, available, fake) {
        var fontSize = 16;
        ctx.font = generateFontString(400, fontSize);
        ctx.fillStyle = this.colors.equipStat;

        var startX = x;
        var img;
        var noStats = true;

        function drawStat(img) {
            if (typeof equip[i] !== "undefined" && equip[i] !== 0) {
                noStats = false;
                if (x + img.width + 3 + ctx.measureText(equip[i]).width > startX + available) {
                    y += img.height + 5;
                    x = startX;
                }

                if (!fake)
                    ctx.drawImage(img, 0, 0, img.width, img.height, x, y, img.width, img.height);
                x += img.width + 3;
                if (!fake)
                    ctx.fillText(equip[i], x, y + (img.height + fontSize) / 2);
                x += ctx.measureText(equip[i]).width;
                x += 10;
            }
        }

        var sortingParam = KC3StrategyTabs.gears.definition._defaultCompareMethod["t" + KC3Master.slotitem(equip.masterId).api_type[3]];
        var i;
        if (!!sortingParam && sortingParam !== "overall") {
            i = sortingParam;
            img = this._statsImages[i];
            drawStat.call(this, img);
        }


        for (i in this._statsImages) {
            if (!this._statsImages.hasOwnProperty(i))
                continue;

            if (i === "or" && KC3GearManager.landBasedAircraftType3Ids.indexOf(KC3Master.slotitem(equip.masterId).api_type[3]) === -1)
                continue;

            if (sortingParam === i)
                continue;
            img = this._statsImages[i];
            drawStat.call(this, img);
        }
        if (noStats)
            return 0;

        y += img.height + 5;
        return y;
    };

})();
