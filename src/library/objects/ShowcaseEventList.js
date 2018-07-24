(function () {
    "use strict";

    // European ships
    const baseImgSrc = "/assets/img/ui/european_ships.png",
        disclaimerHeightOffset = -1,
        lvlFontSize = 36,
        shipPositions = [
            {"x": 366, "y": 139+60.7* 0, "id": 491}, // Commandant Teste
            {"x": 366, "y": 139+60.7* 1, "id": 535}, // Luigi Torelli
            {"x": 366, "y": 139+60.7* 2, "id": 431}, // U-511
            {"x": 366, "y": 139+60.7* 3, "id": 432}, // Graf Zeppelin
            {"x": 366, "y": 139+60.7* 4, "id": 444}, // Aquila
            {"x": 366, "y": 139+60.7* 5, "id": 515}, // Ark Royal
            {"x": 366, "y": 139+60.7* 6, "id": 439}, // Warspite
            {"x": 366, "y": 139+60.7* 7, "id":  78}, // Kongou
            {"x": 366, "y": 139+60.7* 8, "id": 171}, // Bismarck
            {"x": 366, "y": 139+60.7* 9, "id": 441}, // Littorio
            {"x": 366, "y": 139+60.7*10, "id": 442}, // Roma

            {"x": 812, "y": 139+60.7* 0, "id": 511}, // Gangut
            {"x": 812, "y": 139+60.7* 1, "id": 492}, // Richelieu
            {"x": 812, "y": 139+60.7* 2, "id": 176}, // Prinz Eugen
            {"x": 812, "y": 139+60.7* 3, "id": 448}, // Zara
            {"x": 812, "y": 139+60.7* 4, "id": 449}, // Pola
            {"x": 812, "y": 139+60.7* 5, "id": 174}, // Z1
            {"x": 812, "y": 139+60.7* 6, "id": 175}, // Z3
            {"x": 812, "y": 139+60.7* 7, "id": 443}, // Libeccio
            {"x": 812, "y": 139+60.7* 8, "id": 519}, // Jervis
            {"x": 812, "y": 139+60.7* 9, "id": 516}, // Tashkent
            {"x": 812, "y": 139+60.7*10, "id": 35}   // Hibiki
        ];

    // Operation ten go/kita
    /*const baseImgSrc = "/assets/img/ui/operation_kita_ten-go.png",
        disclaimerHeightOffset = 0,
        lvlFontSize = 32,
        shipPositions = [
            {"x": 254, "y": 144, "id": 87},  // Hyuuga
            {"x": 254, "y": 209, "id": 77},  // Ise
            {"x": 254, "y": 274, "id": 183}, // Ooyodo
            {"x": 254, "y": 339, "id": 49},  // Kasumi
            {"x": 254, "y": 404, "id": 41},  // Hatsushimo
            {"x": 254, "y": 469, "id": 425}, // Asashimo

            {"x": 626, "y": 144, "id": 131}, // Yamato
            {"x": 626, "y": 209, "id": 139}, // Yahagi
            {"x": 626, "y": 274, "id": 532}, // Suzutsuki
            {"x": 626, "y": 339, "id": 167}, // Isokaze
            {"x": 626, "y": 404, "id": 170}, // Hamakaze
            {"x": 626, "y": 469, "id": 20},  // Yukikaze
            {"x": 626, "y": 534, "id": 425}, // Asashimo
            {"x": 626, "y": 599, "id": 41},  // Hatsushimo
            {"x": 626, "y": 664, "id": 49}   // Kasumi
        ];*/
    
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
                txt = ships[0].level;
                this.ctx.font = `800 ${lvlFontSize}px \"Helvetica Neue\", Helvetica, Arial, sans-serif`;
                let lvlWidth = this.ctx.measureText(txt).width;

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
                        this.ctx.fillText(suffix, shipPos.x + lvlWidth / 2, shipPos.y - 18);
                    } else {
                        this.ctx.font = "800 18px \"Helvetica Neue\", Helvetica, Arial, sans-serif";
                        this.ctx.fillText("*", shipPos.x + lvlWidth / 2, shipPos.y - 18);
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
            }
            this.ctx.font = `800 ${lvlFontSize}px \"Helvetica Neue\", Helvetica, Arial, sans-serif`;
            this.ctx.fillText(txt, shipPos.x - this.ctx.measureText(txt).width / 2, shipPos.y);
        }

        fillShipLvls() {
            this.canvas.width = this.baseImage.width;
            this.canvas.height = this.baseImage.height;
            this.ctx.drawImage(this.baseImage, 0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = "#D33";
            let size = 16;
            this.ctx.font = `800 ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
            this.ctx.shadowColor = "#222";
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            this.ctx.shadowBlur = 1;
            if(disclaimerHeightOffset >= 0) {
                const text = ["DISCLAIMER: We do not have solid evidence that these", "speculated ships will have special routing next event."];
                // size smaller than Chromium minimum font setting will be simply ignored

                for(let line of text)
                    while(this.ctx.measureText(line).width > this.canvas.width && size > 6){
                        size--;
                        this.ctx.font = `800 ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
                    }
                let yOffset = 1.25;
                for(let line of text)
                    this.ctx.fillText(line, (this.canvas.width - this.ctx.measureText(line).width) / 2 , disclaimerHeightOffset + yOffset++ * size);
            }

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