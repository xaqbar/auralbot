//
// this is the main file for auralbot
//

////////// constants //////////

const Discord = require('discord.io');
const logger = require('winston');
const fs = require("fs");
const ytdl = require("ytdl-core");
const auth = require('./auth.json');
// const abilities = {};


/* Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
*/

////////// initialize discord bot //////////

var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

//  bot.login(auth.token);

////////// log of bots abilities //////////

var abilities = {
    "music":{
        description: "This will be used to generate a music player.",
        execution: function(bot, channel){
            var query = "Out to lunch.";
            
            bot.sendMessage({to: channel, message: query});
        }
    }
    
    
    
};

////////// bot activities && status //////////

bot.on("ready", () => {
    console.log('Connected');
});

bot.on("disconnected", function(){
    console.log('Disconnected');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    
    // bot listens for messages that start with `!`
    
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        var suffix = args[1];
        var query = abilities[cmd];
        
        if (cmd == 'help'){
            var info = "Here is a helpful list:"
            bot.sendMessage({to: channelID, message: info});
        } else if (query){
                try {
                    
                    // bot.sendMessage({to: channelID, message: "Eventually this will do something..."});
                    
                    query.execution(bot, channelID, suffix);
                    
                } catch (err){
                    console.log("Could not execute: " + cmd);
                }
        } else {
            bot.sendMessage({to: channelID, message: "I totally had something for this..."});
        }
        
     }
});


