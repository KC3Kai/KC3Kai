(function () {
    "use strict";

    const baseImgSrc = "/assets/img/ui/event_winter_2018.png",
        shipPositions = [
            {"x": 58, "y": 165, "id": 131},
            {"x": 185, "y": 165, "id": 143},
            {"x": 312, "y": 165, "id": 80},
            {"x": 440, "y": 165, "id": 62},
            {"x": 567, "y": 165, "id": 65},
            {"x": 58, "y": 245, "id": 66},
            {"x": 185, "y": 245, "id": 67},
            {"x": 312, "y": 245, "id": 69},
            {"x": 440, "y": 245, "id": 68},
            {"x": 567, "y": 245, "id": 138},
            {"x": 58, "y": 325, "id": 50},
            {"x": 185, "y": 325, "id": 452},
            {"x": 312, "y": 325, "id": 409},
            {"x": 440, "y": 325, "id": 425},
            {"x": 567, "y": 325, "id": 135},
            {"x": 58, "y": 405, "id": 485},
            {"x": 58, "y": 556, "id": 78},
            {"x": 185, "y": 556, "id": 79},
            {"x": 312, "y": 556, "id": 124},
            {"x": 440, "y": 556, "id": 125},
            {"x": 567, "y": 556, "id": 71},
            {"x": 58, "y": 636, "id": 72},
            {"x": 185, "y": 636, "id": 139},
            {"x": 312, "y": 636, "id": 168},
            {"x": 440, "y": 636, "id": 167},
            {"x": 567, "y": 636, "id": 20},
            {"x": 58, "y": 716, "id": 170},
            {"x": 185, "y": 716, "id": 410},
            {"x": 312, "y": 716, "id": 415},
            {"x": 58, "y": 869, "id": 26},
            {"x": 185, "y": 869, "id": 27},
            {"x": 312, "y": 869, "id": 70},
            {"x": 440, "y": 869, "id": 43},
            {"x": 567, "y": 869, "id": 97},
            {"x": 58, "y": 949, "id": 413},
            {"x": 185, "y": 949, "id": 414},
            {"x": 757, "y": 230, "id": 63},
            {"x": 885, "y": 230, "id": 64},
            {"x": 1012, "y": 230, "id": 61},
            {"x": 1140, "y": 230, "id": 114},
            {"x": 1267, "y": 230, "id": 113},
            {"x": 757, "y": 310, "id": 15},
            {"x": 885, "y": 310, "id": 16},
            {"x": 1012, "y": 310, "id": 49},
            {"x": 1140, "y": 310, "id": 18},
            {"x": 1267, "y": 310, "id": 486},
            {"x": 757, "y": 390, "id": 41},
            {"x": 885, "y": 390, "id": 38},
            {"x": 1012, "y": 390, "id": 40},
            {"x": 757, "y": 709, "id": 111},
            {"x": 885, "y": 709, "id": 102},
            {"x": 1012, "y": 709, "id": 103},
            {"x": 1140, "y": 709, "id": 116},
            {"x": 1267, "y": 709, "id": 77},
            {"x": 757, "y": 787, "id": 87},
            {"x": 885, "y": 787, "id": 100},
            {"x": 1012, "y": 787, "id": 22},
            {"x": 1140, "y": 787, "id": 183},
            {"x": 1267, "y": 787, "id": 421},
            {"x": 757, "y": 868, "id": 423}
        ],
        fleetNames = {
            "Kurita Fleet": {x: 673, y: 422, mark: true},
            "Suzuki Fleet": {x: 673, y: 732, mark: true},
            "Nishimura Fleet": {x: 673, y: 964},
            "Shima Fleet": {x: 1374, y: 412},
            "Ozawa Fleet": {x: 1374, y: 880, mark: true}
        };

    class ShowcaseEventList {
        constructor() {
            this.buildSettings = {};
            this.complete = function () {
            };
            this.init();
        }

        init() {
            this.baseImage = new Image();
            this.canvas = document.createElement("CANVAS");
            this.ctx = this.canvas.getContext("2d");
        }

        addShipToImage(shipPos) {
            let ids = [];
            let allShips = KC3Master.all_ships();
            for (let i in allShips) {
                if (!allShips.hasOwnProperty(i))
                    continue;
                let tempShip = KC3Master.ship(i);
                if (tempShip.kc3_bship === shipPos.id) {
                    ids.push(Number(i));
                }
            }

            let ships = KC3ShipManager.find((s) => ids.indexOf(Number(s.masterId)) !== -1 && s.lock !== 0).sort((a, b) => b.level - a.level);
            this.ctx.fillStyle = "#000";
            let txt = "-";

            if (ships.length > 0) {
                if (KC3Master.ship(ships[0].masterId).api_afterlv !== 0) {
                    let suffixesList = Object.keys(KC3Meta._shipAffix.suffixes);
                    const name = KC3Master.ship(ships[0].masterId).api_name;
                    const wctf_name = WhoCallsTheFleetDb.db["s" + ships[0].masterId].name.ja_jp;
                    let suffix = name.substring(wctf_name.length);
                    this.ctx.fillStyle = "#8c0c0c";
                    if (suffix.length) {
                        suffixesList.map((s) => {
                            suffix = suffix.replace(s.trim(), KC3Meta._shipAffix.suffixes[s.trim()]);
                        });
                        suffix = suffix.trim();
                        this.ctx.font = "400 12px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
                        this.ctx.fillText(suffix, shipPos.x + 92 - this.ctx.measureText(suffix).width, shipPos.y - 16);
                    } else {
                        this.ctx.font = "800 18px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
                        this.ctx.fillText("*", shipPos.x + 92 - this.ctx.measureText("*").width, shipPos.y - 12);
                    }

                }


                if (ships[0].level > 99) {
                    this.ctx.fillStyle = "#a97417";
                } else if (ships[0].level >= 80) {
                    this.ctx.fillStyle = "#107e57";
                } else if (ships[0].level >= 50) {
                    this.ctx.fillStyle = "#2ea6bb";
                } else {
                    this.ctx.fillStyle = "#000";
                }
                txt = ships[0].level;
            }
            this.ctx.font = "800 26px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
            this.ctx.fillText(txt, shipPos.x, shipPos.y);
        }

        fillShipLvls() {
            this.canvas.width = this.baseImage.width;
            this.canvas.height = this.baseImage.height;
            this.ctx.drawImage(this.baseImage, 0, 0, this.canvas.width, this.canvas.height);

            KC3ShipManager.load();
            for (let i in shipPositions) {
                if (!shipPositions.hasOwnProperty(i))
                    continue;
                this.addShipToImage(shipPositions[i]);
            }

            this.ctx.font = "800 32px \"Helvetica Neue\", Helvetica, Arial, sans-serif";

            for (let i in fleetNames) {
                if (!fleetNames.hasOwnProperty(i))
                    continue;
                this.ctx.fillStyle = fleetNames[i].mark ? "#000" : "#575249";
                this.ctx.fillText(i, fleetNames[i].x - this.ctx.measureText(i).width - 10, fleetNames[i].y - 10);
            }

            new KC3ImageExport(this.canvas, {
                filename: "Winter 2018 ShipList " + dateFormat(" yyyy-mm-dd"),
                method: this.buildSettings.output,
            }).export((error, result) => {
                this.complete(result || {});
                this.init();
            });
        }

        exportList() {
            this.baseImage.onload = this.fillShipLvls.bind(this);
            this.baseImage.src = baseImgSrc;
        }
    }

    window.ShowcaseEventList = ShowcaseEventList;
})();