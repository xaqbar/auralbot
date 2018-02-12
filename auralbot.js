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

const dm_text = "What up! Type !commands if you want to hear some tunes!";
const mention_text = "If you type !commands you can see your options!";


////////// Variables //////////

var aliases_file_path  = "aliases.json";

//var bot = new Discord.Client({token: auth.token, autorun: true});

var inform_np = true;


var now_playing = {};
var queue = {};

var stopped = false;

var bot_token = auth.token;
var server_name = "An Environment";
var text_channel_name = "aural_pleasure";
var voice_channel_name = "AuralBot's Proving Ground";

/*
var server_name = null;
var text_channel = null;
var voice_channel = null;
*/
var voice_handler = null;
var yt_api_key = null;


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


bot.setYoutubeKey = function(key){
    yt_api_key = key;
}

bot.on("ready", () => {

    //// CURRENTLY WORKING HERE ////

    /*
    var server = bot.guilds.find("name", server_name);
    if(server === null) throw "Ack! That server (" + server_name + ") seems to be a figment of your imagination!"
    
    var voice_channel = server.channels.find(chn => chn.name === voice_channel_name && chn.type === "voice");
    if(voice_channel === null) throw "Ack! That channel (" + voice_channel + ") seems to be a figment of your imagination!";
    */

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

////////// bot initialization //////////
/*
bot.run = function(server_name, text_channel, voice_channel, aliases_file_path, bot_token) {
    // aliases_file_path = aliases_path;
    
    bot.on("ready", () => {
        var server = bot.guilds.find("name", server_name);
        if(server == null) throw "Ack! That server (" + server_name + ") seems to be a figment of your imagination!"
        
        var voice_channel = server.channels.find(chn => chn.name === voice_channel && chn.type === "voice");
        if(voice_channel === null) throw "Ack! That channel (" + voice_channel + ") seems to be a figment of your imagination!";
        
        text_channel = server.channels.find(chn => chn.name === text_channel && chn.type === "text");
        if(text_channel === null) throw "Ack! That channel (" + text_channel + ") seems to be a figment of your imagination!";
        
        voice_channel.join().then(connection => {voice_connection = connection;}).catch(console.error);
        
        fs.access(aliases_file_path, fs.F_OK, (err) => {
           if(err) {
               aliases = {};
           } else {
               try {
                   aliases = JSON.parse(fs.readFileSync(aliases_file_path));
               } catch(err) {
                   aliases = {};
               }
           }
        });
        
        bot.user.setGame();
        console.log("Connection established, you cool cat.");
    });
    
    bot.login(bot_token);
}
*/

////////// bot functions //////////

// check if queue is empty

function is_queue_empty() {
	return queue.length === 0;
}

// check if the bot is playing music

function is_bot_playing() {
	return voice_handler !== null;
}

// play the next song in the queue

function play_next_song() {
    if(is_queue_empty()){
        text_channel_name.sendMessage("Nothing lined up!");
    }
    
    var link_id = queue[0]["id"];
    var name = queue[0]["name"];
    var user = queue[0]["user"];
    
    now_playing["name"] = name;
    now_playing["user"] = user;
    
    if (inform_np){
        text_channel_name.sendMessage('Currently jamming to "' + name + '" (all thanks to ' + user + ')');
    }
    
    var audio_stream = ytdl("https://www.youtube.com/watch?v=" + link_id);
    voice_handler = voice_connection.playStream(audio_stream);
    
    voice_handler.once("end", reason => {
        voice_handler = null;
        bot.user.setGame();
        if(!stopped && !is_queue_empty()){
            play_next_song();
        }
    });
    
    queue.splice(0,1);
}

// add a song to the queue

function add_to_queue(video, message, mute=false){
    
    if(aliases.hasOwnProperty(video.toLowerCase())) {
        video = aliases[video.toLowerCase()];
    }
    
    var link_id = get_link_id(video);
    
    ytdl.getInfo("https://www.youtube.com/watch?v=" + link_id, (error, info) => {
        if(error){
            message.reply("Sorry dude, unfortunately the requested video (" + link_id + ") cannot be played.");
            console.log("Error (" + link_id + "): " + error);
        } else {
                queue.push({Title: info["name"], id: link_id, user: message.author.username});
                if (!mute) {
                    message.reply('"' + info["title"] + '" has been added to the queue.');
                }
                if (!stopped && !is_bot_playing && queue.length === 1){
                    play_next_song();
                }
        }
    });
}


// search command

function search_command(command_name){
    for(var i = 0; i < commands.length; i++){
        if(commands[i].command == command_name.toLowerCase()){
            return commands[i];
        }
    }
    
    return false;
}

// handle command

function handle_command(message, text){
    var params = text.split(" ");
    var command = seach_command(params[0]);
    
    if(command) {
        if(params.length - 1 < command.parameters.length){
            messagege.reply("Ohp, not enough parameters!");   
        } else {
            command.execute(message, params);
        }
    }
}

// search video

function search_video(message, query){
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, (error, response, body) => {
        var json = JSON.parse(body);
        if ("error" in json) {
            message.reply("Ohp! An error occurred: " + json.error.errors[0].message + " " + json.error.errors[0].reason);
        } else if(json.items.length === 0) {
            message.reply("Ack! Couldn't find a video matching your search!");
        } else {
            add_to_queue(json.items[0].id.link_id, message);
        }
    })
}

// queue playlist

function queue_playlist(playlistID, message, pageToken = ''){
        request("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + playlistID + "&key=" + yt_api_key + "&pageToken=" + pageToken, (error, response, body) => {
            var json = JSON.parse(body);
            if("error" in json) {
                message.reply("Ohp! An error occurred: " + json.error.errors[0].message + " - " + json.error.errors[0].reason);
            } else if(json.items.length === 0) {
                message.reply("Alas, your playlist is empty!")
            } else {
                for (var i = 0; i < json.items.length; i++){
                    add_to_queue(json.items[i].snippet.resourceID.videoId, message, true)
                }
                if (json.nextpageToken == null) {
                    return;
                }
                queue_playlist(playlistId, message, json.nextpageToken)
            }
        });
}














