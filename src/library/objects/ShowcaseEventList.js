(function () {
    "use strict";

    const baseImgSrc = "/assets/img/ui/operation_kita_ten-go.png",
        shipPositions = [
            {"x": 254, "y": 144, "id": 87},
            {"x": 254, "y": 209, "id": 77},
            {"x": 254, "y": 274, "id": 183},
            {"x": 254, "y": 339, "id": 49},
            {"x": 254, "y": 404, "id": 41},
            {"x": 254, "y": 469, "id": 425},

            {"x": 626, "y": 144, "id": 131},
            {"x": 626, "y": 209, "id": 139},
            {"x": 626, "y": 274, "id": 532},
            {"x": 626, "y": 339, "id": 167},
            {"x": 626, "y": 404, "id": 170},
            {"x": 626, "y": 469, "id": 20},
            {"x": 626, "y": 534, "id": 425},
            {"x": 626, "y": 599, "id": 41},
            {"x": 626, "y": 664, "id": 49}
        ];

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
                    this.ctx.shadowBlur = 0;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 0;
                    let suffixesList = Object.keys(KC3Meta._shipAffix.suffixes);
                    const name = KC3Master.ship(ships[0].masterId).api_name;
                    const wctf_ship = WhoCallsTheFleetDb.db["s" + ships[0].masterId];
                    const wctf_name = wctf_ship ? wctf_ship.name.ja_jp : "";
                    let suffix = name.substring(wctf_name.length);
                    this.ctx.fillStyle = "#8c0c0c";
                    if (suffix.length) {
                        suffixesList.map((s) => {
                            suffix = suffix.replace(s.trim(), KC3Meta._shipAffix.suffixes[s.trim()]);
                        });
                        suffix = suffix.trim();
                        this.ctx.font = "400 12px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
                        this.ctx.fillText(suffix, shipPos.x + 70 - this.ctx.measureText(suffix).width, shipPos.y - 26);
                    } else {
                        this.ctx.font = "800 18px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
                        this.ctx.fillText("*", shipPos.x + 70 - this.ctx.measureText("*").width, shipPos.y - 22);
                    }

                }

                this.ctx.shadowOffsetX = 2;
                this.ctx.shadowOffsetY = 2;
                this.ctx.shadowBlur = 2;

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
            this.ctx.font = "800 32px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
            this.ctx.fillText(txt, shipPos.x, shipPos.y);
        }

        fillShipLvls() {
            this.canvas.width = this.baseImage.width;
            this.canvas.height = this.baseImage.height;
            this.ctx.drawImage(this.baseImage, 0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = "#DDD";
            this.ctx.font = "800 12px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
            this.ctx.shadowColor = "#222";
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.shadowBlur = 3;
            this.ctx.fillText("DISCLAIMER: This is all speculation and we do not have solid evidence that these ships" +
                " will have special routing next event.", 5, 15);

            KC3ShipManager.load();
            for (let i in shipPositions) {
                if (!shipPositions.hasOwnProperty(i))
                    continue;
                this.addShipToImage(shipPositions[i]);
            }

            new KC3ImageExport(this.canvas, {
                filename: "Operation Kita Ten-Go shiplist" + dateFormat(" yyyy-mm-dd"),
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