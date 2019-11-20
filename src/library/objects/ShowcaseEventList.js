(function () {
    "use strict";

    const eventConfigDefs = {
        // Fall 2019 speculation
        "2019fall-nishikuma": {
            baseImgSrc: "/assets/img/ui/2019fall-nishikuma.png",
            exportFileName: "2019 Fall - Nishikuma",
            disclaimerHeightOffset: null,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            lvlFontSize: 41,
            maxBoxWidth: 149,
            shipPositions: [
                // Battle of Balikpapan
                {"x": 617+705.6*0, "y": 138+130.5* 0, "id":  56}, // Naka
                {"x": 617+705.6*0, "y": 138+130.5* 1, "id":  44}, // Murasame
                {"x": 617+705.6*0, "y": 138+130.5* 2, "id":  45}, // Yuudachi
                {"x": 617+705.6*0, "y": 138+130.5* 3, "id": 405}, // Harusame
                {"x": 617+705.6*0, "y": 138+130.5* 4, "id":  46}, // Samidare
                {"x": 617+705.6*0, "y": 138+130.5* 5, "id": 413}, // Asagumo
                {"x": 617+705.6*0, "y": 138+130.5* 6, "id": 583}, // Minegumo
                {"x": 617+705.6*0, "y": 138+130.5* 7, "id": 458}, // Umikaze
                {"x": 617+705.6*0, "y": 138+130.5* 8, "id": 459}, // Kawakaze

                // Battle of Ambon
                {"x": 617+705.6*1, "y": 138+130.5* 0, "id":  90}, // Souryuu
                {"x": 617+705.6*1, "y": 138+130.5* 1, "id":  91}, // Hiryuu

                // Battle of Badung Strait
                {"x": 617+705.6*1, "y": 138+130.5* 3, "id":  95}, // Asashio
                {"x": 617+705.6*1, "y": 138+130.5* 4, "id":  96}, // Ooshio
                {"x": 617+705.6*1, "y": 138+130.5* 5, "id":  97}, // Michishio
                {"x": 617+705.6*1, "y": 138+130.5* 6, "id":  98}, // Arashio

                // Battle of the Java Sea
                {"x": 617+705.6*2, "y": 138+130.5* 0, "id":  63}, // Nachi
                {"x": 617+705.6*2, "y": 138+130.5* 1, "id":  65}, // Haguro
                {"x": 617+705.6*2, "y": 138+130.5* 2, "id":  94}, // Sazanami
                {"x": 617+705.6*2, "y": 138+130.5* 3, "id":  16}, // Ushio
                {"x": 617+705.6*2, "y": 138+130.5* 4, "id": 457}, // Yamakaze
                {"x": 617+705.6*2, "y": 138+130.5* 5, "id": 459}, // Kawakaze
                {"x": 617+705.6*2, "y": 138+130.5* 6, "id":  56}, // Naka
                {"x": 617+705.6*2, "y": 138+130.5* 7, "id":  44}, // Murasame
                {"x": 617+705.6*2, "y": 138+130.5* 8, "id":  45}, // Yuudachi
                {"x": 617+705.6*2, "y": 138+130.5* 9, "id": 405}, // Harusame
                {"x": 617+705.6*2, "y": 138+130.5*10, "id":  46}, // Samidare
                {"x": 617+705.6*2, "y": 138+130.5*11, "id": 413}, // Asagumo
                {"x": 617+705.6*2, "y": 138+130.5*12, "id": 583}, // Minegumo

                {"x": 617+705.6*3, "y": 138+130.5* 0, "id":  55}, // Jintsuu
                {"x": 617+705.6*3, "y": 138+130.5* 1, "id":  20}, // Yukikaze
                {"x": 617+705.6*3, "y": 138+130.5* 2, "id": 186}, // Tokitsukaze
                {"x": 617+705.6*3, "y": 138+130.5* 3, "id": 190}, // Hatsukaze
                {"x": 617+705.6*3, "y": 138+130.5* 4, "id": 181}, // Amatsukaze
                {"x": 617+705.6*3, "y": 138+130.5* 5, "id":  76}, // Ryuujou
                {"x": 617+705.6*3, "y": 138+130.5* 6, "id":  62}, // Myoukou
                {"x": 617+705.6*3, "y": 138+130.5* 7, "id":  64}, // Ashigara
                {"x": 617+705.6*3, "y": 138+130.5* 8, "id":  14}, // Shikinami
                {"x": 617+705.6*3, "y": 138+130.5* 9, "id":  15}, // Akebono
                {"x": 617+705.6*3, "y": 138+130.5*10, "id":  36}, // Ikazuchi
                {"x": 617+705.6*3, "y": 138+130.5*11, "id":  37}, // Inazuma

                // Battle of the Sunda Strait
                {"x": 617+705.6*4, "y": 138+130.5* 0, "id":  53}, // Natori
                {"x": 617+705.6*4, "y": 138+130.5* 1, "id": 472}, // Asakaze
                {"x": 617+705.6*4, "y": 138+130.5* 2, "id": 473}, // Harukaze
                {"x": 617+705.6*4, "y": 138+130.5* 3, "id": 475}, // Hatakaze
                {"x": 617+705.6*4, "y": 138+130.5* 4, "id":  28}, // Satsuki
                {"x": 617+705.6*4, "y": 138+130.5* 5, "id": 481}, // Minazuki
                {"x": 617+705.6*4, "y": 138+130.5* 6, "id":  29}, // Fumizuki
                {"x": 617+705.6*4, "y": 138+130.5* 7, "id":   6}, // Nagatsuki
                {"x": 617+705.6*4, "y": 138+130.5* 8, "id":   9}, // Fubuki
                {"x": 617+705.6*4, "y": 138+130.5* 9, "id":  10}, // Shirayuki
                {"x": 617+705.6*4, "y": 138+130.5*10, "id":  32}, // Hatsuyuki
                {"x": 617+705.6*4, "y": 138+130.5*11, "id":  33}, // Murakumo

                {"x": 617+705.6*5, "y": 138+130.5* 0, "id":  70}, // Mogami
                {"x": 617+705.6*5, "y": 138+130.5* 1, "id": 120}, // Mikuma
                {"x": 617+705.6*5, "y": 138+130.5* 2, "id":  14}, // Shikinami
            ],
        },
        // Foreign ships
        "foreignShips": {
            baseImgSrc: "/assets/img/ui/foreign_ships.png",
            exportFileName: "Foreign Ship List",
            disclaimerHeightOffset: null,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            lvlFontSize: 55,
            maxBoxWidth: 215,
            shipPositions: [
                {"x": 672+744*0, "y": 328+148.5* 0, "id": 174}, // Z1
                {"x": 672+744*0, "y": 328+148.5* 1, "id": 175}, // Z3
                {"x": 672+744*0, "y": 328+148.5* 2, "id": 176}, // Prinz Eugen
                {"x": 672+744*0, "y": 328+148.5* 3, "id": 171}, // Bismarck
                {"x": 672+744*0, "y": 328+148.5* 4, "id": 432}, // Graf Zeppelin
                {"x": 672+744*0, "y": 328+148.5* 5, "id": 431}, // U-511

                {"x": 672+744*1, "y": 328+148.5* 0, "id": 575}, // Maestrale
                {"x": 672+744*1, "y": 328+148.5* 1, "id": 443}, // Libeccio
                {"x": 672+744*1, "y": 328+148.5* 2, "id": 614}, // Grecale
                {"x": 672+744*1, "y": 328+148.5* 3, "id": 589}, // Duca degli Abruzzi
                {"x": 672+744*1, "y": 328+148.5* 4, "id": 590}, // G. Garibaldi
                {"x": 672+744*1, "y": 328+148.5* 5, "id": 448}, // Zara
                {"x": 672+744*1, "y": 328+148.5* 6, "id": 449}, // Pola
                {"x": 672+744*1, "y": 328+148.5* 7, "id": 441}, // Littorio
                {"x": 672+744*1, "y": 328+148.5* 8, "id": 442}, // Roma
                {"x": 672+744*1, "y": 328+148.5* 9, "id": 444}, // Aquila
                {"x": 672+744*1, "y": 328+148.5*10, "id": 535}, // Luigi Torelli

                {"x": 672+744*2, "y": 328+148.5* 0, "id": 519}, // Jervis
                {"x": 672+744*2, "y": 328+148.5* 1, "id": 520}, // Janus
                {"x": 672+744*2, "y": 328+148.5* 2, "id": 439}, // Warspite
                {"x": 672+744*2, "y": 328+148.5* 3, "id": 571}, // Nelson
                {"x": 672+744*2, "y": 328+148.5* 4, "id": 515}, // Ark Royal

                {"x": 672+744*3, "y": 328+148.5* 0, "id": 561}, // Samuel B. Roberts
                {"x": 672+744*3, "y": 328+148.5* 1, "id": 596}, // Fletcher
                {"x": 672+744*3, "y": 328+148.5* 2, "id": 562}, // Johnston
                {"x": 672+744*3, "y": 328+148.5* 3, "id": 440}, // Iowa
                {"x": 672+744*3, "y": 328+148.5* 4, "id": 601}, // Colorado
                {"x": 672+744*3, "y": 328+148.5* 5, "id": 544}, // Gambier Bay
                {"x": 672+744*3, "y": 328+148.5* 6, "id": 433}, // Saratoga
                {"x": 672+744*3, "y": 328+148.5* 7, "id": 549}, // Intrepid

                {"x": 672+744*0, "y": 328+148.5* 9, "id": 492}, // Richelieu
                {"x": 672+744*0, "y": 328+148.5*10, "id": 491}, // Comdt. Teste

                {"x": 672+744*2, "y": 328+148.5* 9, "id": 516}, // Tashkent
                {"x": 672+744*2, "y": 328+148.5*10, "id": 511}, // Gangut

                {"x": 672+744*3, "y": 328+148.5*10, "id": 574}, // Gotland

                {"x": 654+744*0, "y": 2112+154*  0, "id": 534}, // Shinyou
                {"x": 654+744*0, "y": 2112+154*  1, "id": 162}, // Kamoi
                {"x": 654+744*1, "y": 2112+154*  0, "id":  78}, // Kongou

                {"x":      2183, "y": 2112+154*  0, "id":  35}  // Hibiki
            ],
        },
        "europeanShips": {
            baseImgSrc: "/assets/img/ui/european_ships.png",
            exportFileName: "European Ship List",
            disclaimerHeightOffset: null,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            lvlFontSize: 36,
            maxBoxWidth: 145,
            shipPositions: [
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
            ],
        },
        // Operation ten go/kita
        "operationKitaTenGo": {
            baseImgSrc: "/assets/img/ui/operation_kita_ten-go.png",
            exportFileName: "Operation Kita Ten-Go Ship List",
            disclaimerHeightOffset: 13,
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            lvlFontSize: 32,
            maxBoxWidth: 105,
            shipPositions: [
                {"x": 275, "y": 144, "id": 87},  // Hyuuga
                {"x": 275, "y": 209, "id": 77},  // Ise
                {"x": 275, "y": 274, "id": 183}, // Ooyodo
                {"x": 275, "y": 339, "id": 49},  // Kasumi
                {"x": 275, "y": 404, "id": 41},  // Hatsushimo
                {"x": 275, "y": 469, "id": 425}, // Asashimo

                {"x": 646, "y": 144, "id": 131}, // Yamato
                {"x": 646, "y": 209, "id": 139}, // Yahagi
                {"x": 646, "y": 274, "id": 532}, // Suzutsuki
                {"x": 646, "y": 339, "id": 167}, // Isokaze
                {"x": 646, "y": 404, "id": 170}, // Hamakaze
                {"x": 646, "y": 469, "id": 20},  // Yukikaze
                {"x": 646, "y": 534, "id": 425}, // Asashimo
                {"x": 646, "y": 599, "id": 41},  // Hatsushimo
                {"x": 646, "y": 664, "id": 49}   // Kasumi
            ],
        },
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
            const {fontFamily, lvlFontSize, maxBoxWidth} = this.eventConfig;
            const ids = [];
            const allShips = KC3Master.all_ships();
            for (const i in allShips) {
                if (!allShips.hasOwnProperty(i))
                    continue;
                const tempShip = KC3Master.ship(i);
                if (tempShip.kc3_bship === shipPos.id) {
                    ids.push(Number(i));
                }
            }

            const ships = KC3ShipManager.find((s) => ids.indexOf(Number(s.masterId)) !== -1 && s.lock !== 0)
                .sort((a, b) => b.level - a.level);
            this.ctx.fillStyle = "#000";

            if (ships.length > 0) {
                let lvlWidth = 0, maxIndex = 0, firstWidth = 0;
                for (let index = 0; index < ships.length; index++) {
                    this.ctx.font = `800 ${index ? lvlFontSize / 2 : lvlFontSize}px ${fontFamily}`;
                    let currentWidth = this.ctx.measureText(ships[index].level).width;

                    if (index !== 0) {
                        this.ctx.font = `800 ${lvlFontSize / 2}px ${fontFamily}`;
                        currentWidth += this.ctx.measureText(", ").width;
                    } else {
                        firstWidth = currentWidth;
                    }

                    if (lvlWidth + currentWidth > maxBoxWidth)
                        break;
                    lvlWidth += currentWidth;
                    maxIndex = index + 1;
                }

                // Show kai/kai ni status for highest level ship, this is prob most important one, in other cases it could be messy
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
                        this.ctx.font = `400 12px ${fontFamily}`;
                        this.ctx.fillText(suffix, shipPos.x - lvlWidth / 2 + firstWidth, shipPos.y - 18);
                    } else {
                        this.ctx.font = `800 18px ${fontFamily}`;
                        this.ctx.fillText("*", shipPos.x - lvlWidth / 2 + firstWidth, shipPos.y - 18);
                    }
                }

                let posOffset = 0, index = 0;
                while (index < ships.length && index < maxIndex) {
                    const ship = ships[index];
                    let text = String(ship.level);

                    if (ship.level > 99) {
                        this.ctx.fillStyle = "#a97417";
                    } else if (ship.level >= 80) {
                        this.ctx.fillStyle = "#107e57";
                    } else if (ship.level >= 50) {
                        this.ctx.fillStyle = "#2ea6bb";
                    } else {
                        this.ctx.fillStyle = "#000";
                    }

                    this.ctx.shadowColor = "#222";
                    if (index === 0) {
                        this.ctx.shadowOffsetX = 2;
                        this.ctx.shadowOffsetY = 2;
                        this.ctx.shadowBlur = 2;
                    } else {
                        this.ctx.shadowOffsetX = 1;
                        this.ctx.shadowOffsetY = 1;
                        this.ctx.shadowBlur = 1;
                    }
                    this.ctx.font = `800 ${index ? lvlFontSize / 2 : lvlFontSize}px ${fontFamily}`;

                    this.ctx.fillText(text, shipPos.x + posOffset - lvlWidth / 2, shipPos.y);
                    posOffset += this.ctx.measureText(text).width;

                    index++;

                    this.ctx.fillStyle = "#333";
                    this.ctx.font = `800 ${lvlFontSize / 3}px ${fontFamily}`;
                    if (index < ships.length && index < maxIndex) {
                        this.ctx.fillText(", ", shipPos.x + posOffset - lvlWidth / 2, shipPos.y);
                        posOffset += this.ctx.measureText(", ").width;
                    } else if (maxIndex !== ships.length) {
                        this.ctx.fillText("...", shipPos.x + posOffset - lvlWidth / 2, shipPos.y);
                    }
                }
            } else {
                this.ctx.font = `800 ${lvlFontSize}px ${fontFamily}`;
                this.ctx.fillText("-", shipPos.x - this.ctx.measureText("-").width / 2, shipPos.y);
            }
        }

        fillShipLvls() {
            const {fontFamily, disclaimerHeightOffset, shipPositions, exportFileName} = this.eventConfig;
            this.canvas.width = this.baseImage.width;
            this.canvas.height = this.baseImage.height;
            this.ctx.drawImage(this.baseImage, 0, 0, this.canvas.width, this.canvas.height);

            let size = 16;
            this.ctx.fillStyle = "#D33";
            this.ctx.font = `800 ${size}px ${fontFamily}`;
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "#fff";
            // Add disclaimer text line if necessary
            if (Number.isInteger(disclaimerHeightOffset)) {
                const text = ["DISCLAIMER: We do not have solid evidence that these",
                    "speculated ships will have special routing next event."];
                for (const line of text) {
                    // size smaller than Chromium minimum font setting will be simply ignored
                    while (this.ctx.measureText(line).width > this.canvas.width && size > 6) {
                        size--;
                        this.ctx.font = `800 ${size}px ${fontFamily}`;
                    }
                }
                let lineCnt = 0;
                for (const line of text) {
                    const x = (this.canvas.width - this.ctx.measureText(line).width) / 2,
                        y = disclaimerHeightOffset + size * lineCnt;
                    lineCnt++;
                    this.ctx.strokeText(line, x, y);
                    this.ctx.fillText(line, x, y);
                }
            }

            KC3ShipManager.load();
            for (const i in shipPositions) {
                if (!shipPositions.hasOwnProperty(i))
                    continue;
                this.addShipToImage(shipPositions[i]);
            }

            new KC3ImageExport(this.canvas, {
                filename: exportFileName + dateFormat(" yyyy-mm-dd"),
                method: this.buildSettings.output,
            }).export((error, result) => {
                this.complete(result || {});
                this.init();
            });
        }

        exportList(configName) {
            this.eventConfig = eventConfigDefs[configName] || eventConfigDefs["2019fall-nishikuma"];
            this.baseImage.onload = this.fillShipLvls.bind(this);
            this.baseImage.src = this.eventConfig.baseImgSrc;
        }
    }

    window.ShowcaseEventList = ShowcaseEventList;
})();