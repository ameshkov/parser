const puppeteer = require('puppeteer');
const request = require('request');
const unzip = require('unzip');
const csv2 = require('csv2');
const fs = require('fs');

/**
 * Checks websites via Chrome Puppetteer
 * 
 * @param {*} websites sites to check
 */
var processWebsitesChrome = function (websites) {

    (async () => {
        // Initializing browser
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

        try {
            for (var i = 0; i < websites.length; i++) {
                // Initializing parser tab
                const page = await browser.newPage();

                try {                
                    var site = websites[i];
                    var rank = site.rank;
                    var domainName = site.domainName;
                    var url = "http://" + domainName + "/";

                    await page.goto(url, { timeout: 60000 });
                    var coinHive = await page.evaluate(function () { return typeof CoinHive !== 'undefined'; });
                    var jseCoin = await page.evaluate(function() { return typeof jseMine !== 'undefined'; });
                    
                    var result = {
                        rank: rank,
                        domainName: domainName,
                        coinHive: coinHive,
                        jseCoin: jseCoin,
                        swData: "empty"
                    };

                    console.log(JSON.stringify(result));
                } catch (ex) {
                    console.log("Cannot load " + domainName + " due to: " + ex);
                } finally {
                    // Catching errors on page closing
                    // https://github.com/GoogleChrome/puppeteer/issues/957
                    try {
                        // Closing tab
                        await page.close();
                    } catch (ex) {
                        console.log("Cannot close page with " + domainName + " due to: " + ex);
                    }
                }
            }
        } catch (ex) {
            console.log("Error while parsing: " + ex);
        }

        await browser.close();
    })();
};

var args = process.argv.slice(2);
var start = 0;
var count = 100;
if (args.length == 2) {
    start = parseInt(args[0]);
    count = parseInt(args[1]);
}
console.log('Starting execution. Start=' + start + ' Count=' + count);

/**
 * Processes the websites
 * 
 * @param {*} websites 
 */
var processWebsites = function (websites) {
    var sites = websites.splice(start, count);
    processWebsitesChrome(sites);
};

// Top 1M Alexa from http://s3.amazonaws.com/alexa-static/top-1m.csv.zip
fs.createReadStream("top-1m.csv.zip")
    .pipe(unzip.Parse())
    .on('entry', function (entry) {
        var websites = [];

        entry.pipe(csv2()).on('data', function (data) {
            if (data && data.length === 2) {
                websites.push({
                    rank: data[0],
                    domainName: data[1]
                });
            }
        }).on('finish', function () {
            console.log('Finished loading TOP Alexa: ' + websites.length);
            processWebsites(websites);
        });
    });

// processWebsites([
//     { rank: "0", domainName: "yandex.ru" },
//     { rank: "1", domainName: "coinhive.com" },
//     { rank: "2", domainName: "baidu.com" },
//     { rank: "3", domainName: "mycrypto.guide" },
//     { rank: "4", domainName: "uptobox.com" },
//     { rank: "5", domainName: "123movies.co" },
//     { rank: "6", domainName: "sugklonistiko.gr" },
//     { rank: "7", domainName: "cinecalidad.to" }
// ]);