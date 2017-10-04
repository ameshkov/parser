const puppeteer = require('puppeteer');
const request = require('request');
const unzip = require('unzip');
const csv2 = require('csv2');
const fs = require('fs');

console.log('Starting execution');

var processWebsites = function (websites) {

    (async () => {
        // Initializing browser
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

        // Initializing parser tab
        const page = await browser.newPage();

        for (var i = 0; i < websites.length && i < 10000; i++) {
            var site = websites[i];
            var rank = site.rank;
            var domainName = site.domainName;
            var url = "http://" + domainName + "/";

            try {
                await page.goto(url);
                var coinHive = await page.evaluate(function () { return typeof CoinHive !== 'undefined'; });
                console.log(rank + "," + domainName + "," + coinHive);
            } catch (ex) {
                console.log("Cannot load " + domainName + " due to: " + ex);
            }
        }

        await browser.close();
    })();
};

// processWebsites([
//     { rank: "0", domainName: "yandex.ru" },
//     { rank: "1", domainName: "coinhive.com" },
//     { rank: "1", domainName: "baidu.com" }
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
            processWebsites(websites);
        });
    });