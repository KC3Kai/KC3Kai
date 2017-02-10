(function () {
    "use strict";

    var imgurLimit = 0;
    var enableShelfTimer = false;

    function generateFontString(weight, px) {
        return weight + " " + px + "px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
    }

    window.ShowcaseExporter = function () {
        this.canvas = {};
        this.ctx = {};
        this.allShipGroups = {};
        this.loading = 0;
        this.shipCount = 0;
        this.rowParams = {
            width: 330,
            height: 35
        };
        this.colors = {
            odd: "#e0e0e0",
            even: "#f2f2f2"
        };
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
            or: "api_distance"
        };
    };

    ShowcaseExporter.prototype._init = function () {
        this.canvas = document.createElement("CANVAS");
        this.ctx = this.canvas.getContext("2d");
        this.allShipGroups = {};
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
            ctx.fillStyle = "#FFF";
            for (var y = 0; y < canvas.height; y += 20) {
                ctx.fillRect(x - 1, y, 2, 10);
            }
        }
    };

    ShowcaseExporter.prototype._addCredits = function (canvasData, topLine) {
        if (!canvasData)
            canvasData = this.canvas;
        if (!topLine)
            topLine = "Ship List";


        var canvas = document.createElement("CANVAS");
        var ctx = canvas.getContext("2d");

        var fontsize = 18;
        canvas.height = canvasData.height + this.rowParams.height * 2 + fontsize + 4;
        canvas.width = canvasData.width;

        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvasData, 0, this.rowParams.height * 2, canvasData.width, canvasData.height);

        var created = "Made in KC3 on " + dateFormat("dd mmm yyyy");
        ctx.font = generateFontString(400, fontsize);
        ctx.fillStyle = "#000";

        ctx.fillText(
            created,
            canvas.width - this.rowParams.height * 0.5 - ctx.measureText(created).width,
            canvas.height - 1
        );
        var x = 20;
        if (topLine.indexOf("Ship") !== -1) {
            x = this._addConsumableImage(ctx, canvas, x, "medals") + 50;
            this._addConsumableImage(ctx, canvas, x, "blueprints");
        } else {
            x = this._addConsumableImage(ctx, canvas, x, "devmats") + 50;
            this._addConsumableImage(ctx, canvas, x, "screws");
        }

        fontsize = 30;
        ctx.font = generateFontString(600, fontsize);
        ctx.fillText(topLine, (canvas.width - ctx.measureText(topLine).width) / 2, this.rowParams.height + fontsize / 2);

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
            this.exporter._finish(canvas.toDataURL("image/png"), topLine);
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
        img.src = url;
    };

    ShowcaseExporter.prototype._loadImages = function (callback) {
        for (var i in this._statsImages) {
            if (!this._statsImages.hasOwnProperty(i))
                continue;
            this._loadImage(i, "_statsImages", "/assets/img/stats/" + i + ".png", callback);
        }

        for (i in this._equipTypeImages) {
            if (!this._equipTypeImages.hasOwnProperty(i))
                continue;
            this._loadImage(i, "_equipTypeImages", "/assets/img/items/" + i + ".png", callback);
        }

        for (i in this._shipImages) {
            if (!this._shipImages.hasOwnProperty(i))
                continue;
            this._loadImage(i, "_shipImages", "/assets/img/ships/" + i + ".png", callback);
        }

        this._loadImage("medals", "_otherImages", "/assets/img/useitems/57.png", callback);
        this._loadImage("blueprints", "_otherImages", "/assets/img/useitems/58.png", callback);
        this._loadImage("screws", "_otherImages", "/assets/img/useitems/4.png", callback);
        this._loadImage("devmats", "_otherImages", "/assets/img/useitems/3.png", callback);

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

    ShowcaseExporter.prototype._finish = function (dataURL, topLine) {
        switch (parseInt(ConfigManager.ss_mode, 10)) {
            case 0:
                this._download(dataURL, topLine);
                break;
            case 1:
                this._postToImgur(dataURL, topLine);
                break;
            default:
                this._openInNewTab(dataURL, topLine);
                break;
        }
    };

    ShowcaseExporter.prototype._download = function (dataURL, topLine) {
        if (enableShelfTimer) {
            clearTimeout(enableShelfTimer);
        }
        var self = this;
        var filename = ConfigManager.ss_directory + '/' + dateFormat("yyyy-mm-dd") + '_' + topLine.replace(" ", "") + ".png";
        chrome.downloads.setShelfEnabled(false);
        chrome.downloads.download({
            url: dataURL,
            filename: filename,
            conflictAction: "uniquify"
        }, function (downloadId) {
            enableShelfTimer = setTimeout(function () {
                chrome.downloads.setShelfEnabled(true);
                enableShelfTimer = false;
                self.cleanUp();
                self.complete({downloadId: downloadId, filename: filename});
            }, 100);
        });
    };

    ShowcaseExporter.prototype._postToImgur = function (dataURL, topLine) {
        var stampNow = Math.floor((new Date()).getTime() / 1000);
        if (stampNow - imgurLimit > 10) {
            imgurLimit = stampNow;
        } else {
            this._download(dataURL, topLine);
            return false;
        }

        var self = this;
        $.ajax({
            url: 'https://api.imgur.com/3/credits',
            method: 'GET',
            headers: {
                Authorization: 'Client-ID 088cfe6034340b1',
                Accept: 'application/json'
            },
            success: function (response) {
                if (response.data.UserRemaining > 10 && response.data.ClientRemaining > 100) {
                    $.ajax({
                        url: 'https://api.imgur.com/3/image',
                        method: 'POST',
                        headers: {
                            Authorization: 'Client-ID 088cfe6034340b1',
                            Accept: 'application/json'
                        },
                        data: {
                            image: dataURL.substring(22),
                            type: 'base64'
                        },
                        success: function (response) {
                            self.complete({url: response.data.link});
                        },
                        error: function (response) {
                            self._download(dataURL, topLine);
                        }
                    });
                } else {
                    self._download(dataURL, topLine);
                }
            },
            error: function (response) {
                self._download(dataURL, topLine);
            }
        });
    };

    ShowcaseExporter.prototype._openInNewTab = function (dataURL,topLine) {
        if(dataURL.length>=2*1024*1024){
            this._download(dataURL,topLine);
        } else {
            window.open(dataURL, "_blank");
            this.complete({});
        }
    };

    /* SHIP EXPORT
     ------------------------- */
    ShowcaseExporter.prototype.exportShips = function () {
        this._init();
        this._getShips();
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

        var fontsize = 25;
        this.ctx.textBaseline = "middle";
        this.ctx.font = generateFontString(600, fontsize);
        this.ctx.fillStyle = "#0066CC";
        this.ctx.fillText(KC3Meta.stype(type), x + this.rowParams.height / 2, y + (this.rowParams.height) / 2);
    };

    ShowcaseExporter.prototype._finalize = function () {
        if (this.loading !== 0)
            return;
        this._drawBorders();
        this._addCredits();
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
        var ships = KC3ShipManager.find(function (s) {
            return s.lock !== 0;
        });

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
    };

    ShowcaseExporter.prototype._drawShip = function (x, y, ship, background) {
        this.ctx.fillStyle = background;
        this.ctx.fillRect(x, y, this.rowParams.width, this.rowParams.height);
        var xOffset = this.rowParams.height / 7;

        this._drawStat(ship.fp, x + xOffset, y, this.rowParams.height / 2, this.rowParams.height / 2, "#ff8888", background);
        this._drawStat(ship.tp, x + xOffset + this.rowParams.height / 2, y, this.rowParams.height / 2, this.rowParams.height / 2, "#00CCFF", background);
        this._drawStat(ship.aa, x + xOffset + this.rowParams.height / 2, y + this.rowParams.height / 2, this.rowParams.height / 2, this.rowParams.height / 2, "#ff9900", background);
        this._drawStat(ship.ar, x + xOffset, y + this.rowParams.height / 2, this.rowParams.height / 2, this.rowParams.height / 2, "#ffcc00", background);
        this._drawStat(ship.lk, x + xOffset + this.rowParams.height, y, this.rowParams.height / 5, this.rowParams.height / 2, "#66FF66", background);

        this._drawIcon(x + xOffset, y, ship.masterId);

        var fontSize = 24;
        this.ctx.font = generateFontString(400, fontSize);
        while (this.ctx.measureText(ship.name()).width > this.rowParams.width - this.rowParams.height * 3.5) {
            fontSize--;
            this.ctx.font = generateFontString(400, fontSize);
        }
        this.ctx.fillStyle = "#000";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(ship.name(), x + this.rowParams.height * 2, y + this.rowParams.height / 2);

        this.ctx.font = generateFontString(400, 24);
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
            ship.level,
            x + this.rowParams.width - this.rowParams.height * 0.5 - this.ctx.measureText(ship.level).width,
            y + this.rowParams.height / 2
        );

    };

    ShowcaseExporter.prototype._drawIcon = function (x, y, shipId) {
        this.ctx.drawImage(
            this._shipImages[shipId],
            0, 0, this._shipImages[shipId].width, this._shipImages[shipId].height,
            x, y, this.rowParams.height, this.rowParams.height
        );
    };

    ShowcaseExporter.prototype._drawStat = function (stat, x, y, w, h, color, background) {
        if (stat[0] >= stat[1]) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, w, h);
        } else {
            this.ctx.fillStyle = background;
            this.ctx.fillRect(x, y, w, h);
        }
    };

    ShowcaseExporter.prototype._fill = function () {
        this.ctx.fillStyle = "#efefef";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };

    /* EQUIP EXPORT
     ------------------------- */

    ShowcaseExporter.prototype.exportEquip = function () {
        var gears = this._getGears();
        var self = this;

        this._loadImages(function () {
            self._processGears(gears);
        });
    };

    ShowcaseExporter.prototype._getGears = function () {
        var allGears = JSON.parse(localStorage.gears);
        var sorted = {};
        for (var i in allGears) {
            if (allGears[i].lock === 0)
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

        var columnsCount = 5;
        var rowHeight = 30;
        var rowWidth = 350;

        this._drawEquipGroups(gears, rowWidth, rowHeight);
        var columns = this._splitEquipByColumns(columnsCount);
        this._fillEquipCanvas(canvas, ctx, columns, rowWidth);
        this._drawBorders(canvas, ctx, rowWidth);
        this._addCredits(canvas, "Equipment List");
    };

    ShowcaseExporter.prototype._fillEquipCanvas = function (canvas, ctx, columns, rowWidth) {
        canvas.height = this._getBiggestColumn(columns);
        canvas.width = rowWidth * columns.length;
        ctx.fillStyle = this.colors.odd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            var y = 0, x = i * rowWidth;
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
        var aproxSize = Math.max(Math.ceil(totalHeight / maxColumns), maxHeight);
        var paging = this._fillEquipColumns(aproxSize);

        if (paging.length > maxColumns) {
            paging = this._fixEquipPaging(aproxSize, paging, maxColumns);
        }
        return paging;
    };

    ShowcaseExporter.prototype._fixEquipPaging = function (aproxSize, paging, maxColumns) {
        while (paging.length > maxColumns) {
            paging = this._fillEquipColumns(aproxSize++);
        }
        return paging;
    };

    ShowcaseExporter.prototype._fillEquipColumns = function (aproxSize) {
        var groupIds = [];
        for (var groupId in this._equipGroupCanvases) {
            if (groupId.startsWith("g"))
                groupIds.push(parseInt(groupId.slice("1")));
        }
        groupIds.sort(function (a, b) {
            return a - b;
        });


        var newPaging = [[]];
        var size = 0;
        var column = 0;
        for (var i = 0; i < groupIds.length; i++) {
            if (size + this._equipGroupCanvases["g" + groupIds[i]].height > aproxSize) {
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

    ShowcaseExporter.prototype._drawEquipGroups = function (gears, rowWidth, rowHeight) {
        var groupIds = [];
        for (var groupId in gears) {
            if (groupId.startsWith("g"))
                groupIds.push(parseInt(groupId.slice("1")));
        }
        groupIds.sort(function (a, b) {
            return a - b;
        });

        var bool = true;
        for (var i = 0; i < groupIds.length; i++) {
            var canvas = document.createElement("CANVAS"), ctx = canvas.getContext("2d");
            canvas.height = this._drawEquipGroup(gears["g" + groupIds[i]], rowWidth, rowHeight);
            canvas.width = rowWidth;
            ctx.fillStyle = bool ? this.colors.odd : this.colors.even;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            bool = !bool;
            this._addEquipGroupsToCanvas(gears["g" + groupIds[i]], canvas, ctx, rowHeight);
            this._equipGroupCanvases["g" + groupIds[i]] = canvas;
        }
    };

    ShowcaseExporter.prototype._addEquipGroupsToCanvas = function (group, canvas, ctx, rowHeight) {
        function compareEquip(a, b) {
            var equipA = KC3Master.slotitem(a.slice(1)), equipB = KC3Master.slotitem(b.slice(1));
            return equipB[sortingParam] - equipA[sortingParam];
        }

        var typeCount = 0;
        for (var typeId in group.types) {
            typeCount++;
        }

        var y = 0;
        var fontSize = 20;
        ctx.font = generateFontString(600, fontSize);
        ctx.fillStyle = "#000";
        ctx.fillText(group.name, (canvas.width - ctx.measureText(group.name).width) / 2, ( rowHeight + fontSize) / 2);
        y += rowHeight;

        for (typeId in group.types) {
            if (typeId.startsWith("t")) {
                var type = group.types[typeId];
                if (typeCount > 1) {
                    y += rowHeight / 2;
                    fontSize = 20;
                    ctx.font = generateFontString(500, fontSize);
                    ctx.fillStyle = "#000";
                    ctx.fillText(type.name, (canvas.width - ctx.measureText(type.name).width) / 2, y + (rowHeight + fontSize) / 2);
                    y += rowHeight * 1.5;
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
                y += rowHeight * 0.5;

                ctx.fillStyle = "#FFF";
                for (var xPos = 0; xPos < 0 + canvas.width; xPos += 20) {
                    ctx.fillRect(xPos, y - 2, 10, 2);
                }
            }
        }
    };

    ShowcaseExporter.prototype._drawEquipGroup = function (group, rowWidth, rowHeight) {
        var typeCount = 0;
        for (var typeId in group.types) {
            typeCount++;
        }

        var height = 0;
        for (var i in group.types) {
            if (i.startsWith("t")) {
                height += this._drawEquipTypes(group.types[i], rowWidth, rowHeight);
            }
        }
        if (typeCount > 1)
            height += rowHeight * typeCount * 2;// + typename each
        return height + rowHeight;// + groupName
    };

    ShowcaseExporter.prototype._drawEquipTypes = function (types, rowWidth, rowHeight) {
        var height = 0;

        for (var masterId in types.gears) {
            if (!types.hasOwnProperty(masterId) && masterId.startsWith("m")) {
                height += this._drawEquip(types.gears[masterId], rowWidth, rowHeight, false);
            }
        }
        return height + 0.5 * rowHeight;
    };

    ShowcaseExporter.prototype._drawEquip = function (equip, rowWidth, rowHeight, fake) {
        var height;
        if (!fake) {
            height = this._drawEquip(equip, rowWidth, rowHeight, true);
        }

        var img = this._equipTypeImages[KC3Master.slotitem(equip.masterId).api_type[3]];
        var canvas = document.createElement("CANVAS"), ctx = canvas.getContext("2d");
        var x = 0, y = 0;

        if (fake === false) {
            canvas.width = rowWidth;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, rowHeight, rowHeight);
        }

        var equipMaxY = this._drawEquipInfo(equip, ctx, x, y, rowWidth, rowHeight, fake);


        var fontSize;
        for (var i = 0; i <= 10; i++) {
            var text = "";
            if (i === 0) {
                fontSize = 18;
                text = "x" + equip.total;
                ctx.font = generateFontString(400, fontSize);
                ctx.fillStyle = "#000";
                if (!fake)
                    ctx.fillText(text, x + rowWidth - rowHeight * 0.5 - ctx.measureText(text).width, y + (rowHeight + fontSize) / 2);
            } else {
                fontSize = 13;
                if (equip["s" + i] === 0)
                    continue;
                ctx.fillStyle = "#000";
                ctx.font = generateFontString(400, fontSize);
                text = " x" + equip["s" + i];
                var xOffset = ctx.measureText(text).width;
                if (!fake)
                    ctx.fillText(text, x + rowWidth - rowHeight * 0.5 - ctx.measureText(text).width, y + (rowHeight + fontSize) / 2);


                text = "★" + i;
                ctx.fillStyle = "#42837f";
                ctx.font = generateFontString(600, fontSize);
                if (!fake)
                    ctx.fillText(text, x + rowWidth - rowHeight * 0.5 - xOffset - ctx.measureText(text).width, y + (rowHeight + fontSize) / 2);
            }
            y += fontSize + 4;
        }
        if (equipMaxY > y)
            y = equipMaxY;

        this._equipCanvases["m" + equip.masterId] = canvas;
        return y + 5;
    };

    ShowcaseExporter.prototype._drawEquipInfo = function (equip, ctx, x, y, rowWidth, rowHeight, fake) {
        var startY = y;
        var fontSize = 13;
        ctx.font = generateFontString(400, fontSize);
        ctx.fillStyle = "#000";

        var available = rowWidth - rowHeight * 3.5;

        var name = this._splitText(equip.name, ctx, available);
        y = this._drawEquipName(name, ctx, x + 30, y, rowHeight, fontSize, fake);

        if (equip.name !== KC3Master.slotitem(equip.masterId).api_name) {
            name = this._splitText(KC3Master.slotitem(equip.masterId).api_name, ctx, available, "");
            y = this._drawEquipName(name, ctx, x + 30, y, fontSize, fontSize, fake);
        }
        y = y < startY + 30 ? startY + 30 : y;

        available = rowWidth - rowHeight * 3.5;

        y += 5;
        var statsY = this._drawEquipStats(equip, ctx, x + rowHeight, y, available, fake);
        y = Math.max(statsY, y);
        if (statsY > 0)
            y += 10;
        return y;
    };

    ShowcaseExporter.prototype._drawEquipName = function (nameLines, ctx, x, y, rowHeight, fontSize, fake) {
        if (nameLines.length === 1) {
            if (!fake)
                ctx.fillText(nameLines[0], x, y + fontSize + 2);
            y += fontSize + 5;
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

        if (text.indexOf(splitter) === -1)
            splitter = "";

        var rows = [];
        var words = text.split(splitter);

        //@TODO what if single word will be so long so it goes outside maxWidth?
        while (words.length > 0) {
            var line = [];
            var next = words.shift();
            while (ctx.measureText((line.join(splitter) + splitter + next).trim()).width < maxWidth && next !== "") {
                line.push(next);
                if (words.length > 0)
                    next = words.shift();
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
        ctx.fillStyle = "#000";

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
