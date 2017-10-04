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

        for (var i = 0; i < websites.length; i++) {
            // Initializing parser tab
            const page = await browser.newPage();

            var site = websites[i];
            var rank = site.rank;
            var domainName = site.domainName;
            var url = "http://" + domainName + "/";

            try {
                await page.goto(url, { timeout: 10000 });
                var coinHive = await page.evaluate(function () { return typeof CoinHive !== 'undefined'; });
                console.log(rank + "," + domainName + "," + coinHive);
            } catch (ex) {
                console.log("Cannot load " + domainName + " due to: " + ex);
            }

            // Closing tab
            await page.close();
        }

        await browser.close();
    })();
};

/**
 * Downloads website's content
 * 
 * @param {*} site Site object (rank, domainName)
 */
var downloadWebsite = function (site) {
    var url = "http://" + site.domainName + "/";

    return new Promise(function (resolve, reject) {
        request({
            url: url,
            timeout: 10000
        }, function (error, res, body) {
            if (!error && res.statusCode == 200 && body) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

/**
 * Parses all the websites and looks for miner's code there
 * 
 * @param {*} websites 
 */
var processWebsitesHttp = function (websites) {

    (async () => {
        for (var i = start; i < websites.length && i < (start + count); i++) {
            var site = websites[i];

            try {
                var body = await downloadWebsite(site);
                var coinHive = body.indexOf("coin-hive.com") >= 0 ||
                    body.indexOf("CoinHive") >= 0;
                console.log(site.rank + "," + site.domainName + "," + coinHive);
            } catch (ex) {
                console.log("Cannot process " + site.domainName + " due to: " + ex);
            }
        }
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

// processWebsitesHttp([
//     { rank: "0", domainName: "yandex.ru" },
//     { rank: "1", domainName: "coinhive.com" },
//     { rank: "2", domainName: "baidu.com" },
//     { rank: "3", domainName: "mycrypto.guide" },
//     { rank: "4", domainName: "uptobox.com" },
//     { rank: "5", domainName: "123movies.co" },
//     { rank: "6", domainName: "sugklonistiko.gr" },
//     { rank: "7", domainName: "cinecalidad.to" }
// ]);

// Downloading top 1 million Alexa websites
request.get('http://s3.amazonaws.com/alexa-static/top-1m.csv.zip')
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
            var sites = websites.splice(start, count);
            processWebsitesChrome(sites);
        });
    });