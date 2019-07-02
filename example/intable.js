const Table = require('@lvchengbin/cli-table');
const clear = require('clear');
const moment = require('moment');

const GMSL = require('..');

const sleep = (sec) => new Promise(resolve => setTimeout(resolve, sec * 1e3));

let Cookie = false;
function loadCookie() {
    const data = requireUncached('./cookie.js');
    Cookie = data.join("; ");
}

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}


const INTERVAL_UPD = 15 /** 1e3*/ ; // 15 seconds

const STYLE_DIFF = {
    color: 'yellow',
    underline: true
};
const STYLE_ERROR = {
    color: 'red',
};
const STYLE_TABLE_DEFAULT = {
    header: {
        color: 'red'
    },
    cell: {
        color: 'green'
    },
    border: {
        color: 'yellow'
    }
};
const STYLE_TABLE_ERROR = {
    header: {
        color: 'white',
        bg: 'red',
    },
    cell: {
        color: 'grey'
    },
    border: {
        color: 'blue'
    }
};


let tableData = [];
let evMainCount = 0;
let lastDate = new Date();
let lastData = {
    res: false,
    err: false,
    sleepTime: 0
};

const gmsl = new GMSL();

(async function main() {
    loadCookie();
    gmsl.setCookie(Cookie);

    // Update table frarmes (every 5 seconds)
    setInterval(() => {
        drawTable(lastData);
    }, 5e3);

    myCycle().then();
})();

async function myCycle() {
    lastData = await gmsl.getData();
    
    lastDate = new Date();

    // Calculate "Smart" time anti Google BOT
    const sleepTime = INTERVAL_UPD * ((++evMainCount % 5 == 0) ? 34 : rnd(21, 32) / 10);
    console.log("Sleep: ", sleepTime);
    lastData = {
        ...lastData,
        sleepTime
    };

    drawTable(lastData);

    // Loop
    await sleep(sleepTime);
    myCycle();
}


function drawTable({
    res,
    err = false,
    sleepTime = 0
}) {
    clear();

    console.log("\n\n");

    let diffs = [];
    const table = new Table(false, {
        style: !err ? STYLE_TABLE_DEFAULT : STYLE_TABLE_ERROR
    });
    table.setHeader(['#', 'Name', 'Battey', 'Coords', 'LastTime', 'Place Name']);

    if (res && res.length == 10) {
        let TEMP_tableData = [];
        const users = res[0];
        try {
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const data = user[1];

                const fullName = user[0][3];

                const battery = user[13] && user[13].length > 1 ? {
                    charge: !!user[13][0],
                    percent: user[13][1]
                } : {
                    charge: false,
                    percent: 0
                };

                if (!data) {
                    TEMP_tableData.push([
                        (i + 1),
                        fullName,
                        "[" + battery.percent + "%]" + (battery.charge ? "ϟ" : ""),
                        "-",
                        "-",
                        "-"
                    ]);
                    continue;
                }

                const coordinates = data && data[1].length > 1 ? {
                    lat: data[1][2].toString().padEnd(10, "0"),
                    lon: data[1][1].toString().padEnd(10, "0")
                } : {
                    lat: "00.0".padEnd(10, "0"),
                    lon: "00.0".padEnd(10, "0")
                };
                const placeName = data[4];
                const lastTime = new Date(data[2]);

                const diffTime = new Date() - lastDate;
                const timeAgo = moment(lastTime - diffTime).fromNow();

                TEMP_tableData.push([
                    (i + 1),
                    fullName,
                    "[" + battery.percent + "%]" + (battery.charge ? "ϟ" : ""),
                    "[" + coordinates.lat + " ; " + coordinates.lon + "]",
                    timeAgo,
                    placeName
                ]);
            }
        } catch (e) {
            console.log(e)
        }

        // Difference
        {
            for (let i = 0; i < tableData.length; i++) {
                if (TEMP_tableData.length <= i) continue;

                for (let j = 0; j < tableData[i].length; j++) {
                    if (TEMP_tableData[i][j] != tableData[i][j]) {
                        // table.rows[i].cells[j].style = STYLE_DIFF;
                        diffs.push([i, j]);
                    }
                }
            }
        }

        tableData = TEMP_tableData;

    } else {
        console.log(res);
    }


    for (const item of tableData) {
        table.addRow(item);
    }

    for (let [i, j] of diffs) {
        table.rows[i + 1].cells[j].style = STYLE_DIFF;
    }

    console.log(table);

    console.log("\n");

    const mTime = sleepTime - Math.round((new Date(new Date() - lastDate).getTime()) / 1e3);
    const cc = gmsl.couonter;
    const tableStatus = new Table([
        ["Counter", cc[0], cc[1], cc[2], cc[3], sleepTime, mTime]
    ]);
    tableStatus.setHeader(['Status', 'Requests', 'Bad responses', 'Request errors', 'GoogleBOT', 'Zzz', 'Timer']);

    for (let [i, j] of [
            [0, 2],
            [0, 3]
        ])
        tableStatus.rows[i + 1].cells[j].style = STYLE_ERROR;

    console.log(tableStatus);

    if (err)
        console.log("Error:", err);
}


function rnd(min, max) {
    if (max === undefined) {
        max = min
        min = 0
    }
    return Math.floor(min + Math.random() * (max + 1 - min));
}
