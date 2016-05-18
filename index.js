#! /usr/bin/env node

var config = require("./package.json");
var fs = require("fs");
var path = require("path");
var request = require("request");
var url = require("url");

var args = process.argv;
args.splice(0, 2);
var skipNext = false;
var authHeader = "";
var files = [];
var dest = "./";
for (var i = 0; i < args.length; i++) {
    if (!skipNext) {
        switch (args[i]) {
            case "-h":
            case "--help":
                console.log(config.name, "-", config.version);
                console.log(config.author);
                console.log("");
                console.log("Need to write help");
                return;
                break;
            case "-k":
            case "--key":
                authHeader = "token " + args[i + 1];
                skipNext = true;
                break;
            case "-f":
            case "--file":
                files.push(args[i + 1]);
                skipNext = true;
                break;
            case "-o":
            case "--out-dir":
                dest = args[i + 1];
                skipNext = true;
                break;
            case "-v":
            case "--version":
                console.log(config.version);
                return;
                break;
            default:
                console.log("Type imagify -h|--help for help");
                break;
        }
    } else {
        try {
            if ((args[i - 1] === "-f" || args[i - 1] === "--file") && args[i + 1].indexOf("-") < 0 && args[i - 1].indexOf("-") < 0) {
                files.push(args[i]);
            } else {
                skipNext = false;
            }
        } catch (err) {
        }
    }
}

if (files.length > 0 && authHeader !== "") {

    console.log(files.length + " pictures to optimize.");

    var download = function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    };

    for (var i = 0; i < files.length; i++) {
        console.log("Sending picture n°" + (i + 1) + ".");
        var formData = {
            data: JSON.stringify({"ultra": true}),
            image: fs.createReadStream(files[i])
        };
        request({
            method: 'POST',
            uri: 'https://app.imagify.io/api/upload/',
            headers: {
                "Authorization": authHeader
            },
            formData: formData
        }, function (err, response, body) {
            var data = JSON.parse(body);
            if (data.success) {
                console.log("File sent.");
                console.log("Downloading " + data.image + ".");
                download(data.image, path.join(dest, path.basename(url.parse(data.image).pathname)), function () {
                    console.log("Downloaded.");
                });
            } else {
                console.log(data.details);
            }
        });
    }
} else if (files.length === 0) {
    console.log("Missing files.")
    console.log("Type \"imagify -h\" for help");
} else if (authHeader === "") {
    console.log("API key is required.")
    console.log("Type \"imagify -h\" for help");
}
