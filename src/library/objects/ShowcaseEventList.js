(function () {
    "use strict";

    const baseImgSrc = "/assets/img/ui/operation_kita_ten-go.png",
        shipPositions = [
            {"x": 234, "y": 136, "id": 87},
            {"x": 234, "y": 198, "id": 77},
            {"x": 234, "y": 260, "id": 183},
            {"x": 234, "y": 322, "id": 49},
            {"x": 234, "y": 384, "id": 41},
            {"x": 234, "y": 446, "id": 425},
            {"x": 587, "y": 136, "id": 131},
            {"x": 587, "y": 198, "id": 139},
            {"x": 587, "y": 260, "id": 532},
            {"x": 587, "y": 322, "id": 167},
            {"x": 587, "y": 384, "id": 170},
            {"x": 587, "y": 446, "id": 20},
            {"x": 587, "y": 508, "id": 425},
            {"x": 587, "y": 570, "id": 41},
            {"x": 587, "y": 632, "id": 49}
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
                        this.ctx.fillText(suffix, shipPos.x + 77 - this.ctx.measureText(suffix).width, shipPos.y - 23);
                    } else {
                        this.ctx.font = "800 18px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
                        this.ctx.fillText("*", shipPos.x + 77 - this.ctx.measureText("*").width, shipPos.y - 19);
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
            this.ctx.font = "800 32px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
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