const fs = require('fs');
const cursorsjs = require("cursors-js");
const colors = require('colors');
const request = require('request');
const logo = require('asciiart-logo');
const packagejson = require('./package.json');
const SocksProxyAgent = require('socks-proxy-agent');
const WebSocket = require("ws")
let ver = packagejson.version
let stdin = process.openStdin()
let bots = [];
process.on('uncaughtException', function(err) {
	//console.log('Caught exception: ', err);
});

//This code fully belongs to mathias377.
//You can edit it but you cannot publish the edited version.
stdin.on("data", function(d) {
	let msg = d.toString().trim();
		try {
			return console.log(String(eval(msg)))
		} catch (e) {
			console.log('[ERROR]:' + e.name + ":" + e.message + "\n" + e.stack)
		}

})

request('https://raw.githubusercontent.com/mathmakgakpak/mbots-for-cursors.io/master/botupdates.json', (err, req, body) => {
	if (err) {
		console.warn(err)
	}
	body = body.replace(/\r/g, '');
	let version = JSON.parse(body).version;
	let messageOfUpdate = JSON.parse(body).message;
	let priority = JSON.parse(body).priority;

	if (version == ver) {
		console.log(`Your version is actual ${version}`.green)
	} else {
		if(priority == 0) {
			console.log(`Update your bot version. Your version is ${ver} you should update it to ${version}`.green)
			console.log(`Update messages: ${messageOfUpdate}`)
		} else if(priority == 1) {
			console.log(`Update your bot version. Your version is ${ver} you must update it to ${version}`.red)
			console.log(`Update messages: ${messageOfUpdate}`)
		}
		
	}
})

let ownProxies = true

let proxies;
if (ownProxies == true) {
	proxies = fs.readFileSync("proxy.txt").toString();
	proxies = proxies.split("\n")
} else {
	request('https://www.proxy-list.download/api/v1/get?type=socks5', (err, req, body) => {
		proxies = body.replace(/\r/g, '');
		proxies = proxies.split("\n")
	})
}
let botx;
let boty;

console.log(logo(packagejson).render());
console.log("------------------------------------------------".blue);
console.log(`To start bots type (without quotes) "startBots(count, botsPerProxy, timeout)" type "stopBots()"`)
console.log("------------------------------------------------".blue);

function startBots(count = 50, botperProxy = 1, timeout = 10) {
	if (bots.length > 0) {
		console.log("You can't start bots again.")
		return;
	}

	let i = 0;

	function func() {
		setTimeout(function() {
			bots.push(new cursorsjs.cjs({
				agent: new SocksProxyAgent("socks://" + proxies[i])
			}))
			bots[i].deployed = false
			bots[i].botid = i
			bots[i].on("close", function(undefined, bot) {
				console.log("Disconnected: " + bot.botid)
				delete bot;
				bots.sort()
				bots.pop()
			})
			bots[i].on("error", function(undefined, bot) {
				console.log("Disconnected: " + bot.botid)
				delete bot;
				bots.sort()
				bots.pop()
			})
			bots[i].on("open", function(bot) {
				bot.move(300,175)
				console.log("Connected " + bot.botid)
			})
			
			
			

			i++
			if ((bots.length - 1 < proxies.length * botperProxy) && (bots.length - 1 < count)) {
				func()
			}
		}, timeout)
	}
	func()

}

function stopBots() {
	bots.forEach(function(bot) {
		bot.ws.close()
	})
	bots = []
	bots.sort()
}

function deploy() {
	for (let i = 0; i < bots.length; i++) {
		if (bots[i].deployed == false) {
			bots[i].deployed = true
			break;
		}
	}
}

function undeploy() {
	for (let i = 0; i < bots.length; i++) {
		if (bots[i].deployed == true) {
			bots[i].deployed = false
			break;
		}
	}
}

function click(x, y) {
	bots.forEach(function(bot) {
		if (bot.deployed == true) return;
		bot.click(x, y)
	})
}

function move(x, y) {
	bots.forEach(function(bot) {
		if (bot.deployed == true) return;

		bot.move(x, y)
	})
}

function draw(x1, y1, x2, y2) {
	bots.forEach(function(bot) {
		if (bot.deployed == true) return;
		bot.draw(x1, y1, x2, y2)
	})
}

//controler
let wss = new WebSocket.Server({
	port: 8080
});

wss.on('connection', function(ws) {
	ws.on('message', function(msg) {

		let control = JSON.parse(msg)
		switch (control.eval) {
			case "move":
				if (control.x == undefined || control.y == undefined) return;
				move(control.x, control.y)
				break;
			case "click":
				if (control.x == undefined || control.y == undefined) return;
				click(control.x, control.y)
				break;
			case "draw":
				if (control.x1 == undefined || control.y1 == undefined || control.x2 == undefined || control.y2 == undefined) return;
				draw(control.x1, control.y1, control.x2, control.y2)
				break;
			case "deploy":
				deploy()
				break;
			case "undeploy":
				undeploy()
				break;
		}
	})
})