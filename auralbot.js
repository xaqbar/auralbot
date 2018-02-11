//
// This is the main file for auralbot
//

// Constants

const Discord = require(discord.io);
const logger = require('winston');
const ytdl = require("ytdl-core");
const auth = require('./auth.json');

// const bot = Discord.Client({autoReconnect: true, max_message_cache: 0});

const dm_text = "What up! Type !commands if you want to hear some tunes!";
const mention_text = "If you type !commands you can see your options!";

bot.setYoutubeKey("AIzaSyACkIMTU4y22k1vEG5ocTG_t4aqsxB-bX4")

////////// Variables //////////

// var aliases_file_path  = "";

var bot = new Discord.Client({
   token: auth.token,
   autorun: true
    });

var inform_np = true;

var now_playing = {};
var queue = {};

var stopped = false;

var text_channel = null;
var voice_channel = null;
var voice_handler = null;
var yt_api_key = null;

////////// Bot Functions //////////

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
        text_channel.sendMessage("Nothing lined up!");
    }
    
    var link_id = queue[0]["id"];
    var name = queue[0]["name"];
    var user = queue[0]["user"];
    
    now_playing["name"] = name;
    now_playing["user"] = user;
    
    if inform_np(){
        text_channel.sendMessage('Currently jamming to "' + name + '" (all thanks to ' + user + ')');
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


//////////  //////////

























// Configure logger settings

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot

var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    
    // Listen for 'ping'
    
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            
            // !ping
            
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            
            break;
            
            // Just add any case commands if you want to..
         
         }
     }
     
     if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
                                   
            case 'hi':
                bot.sendMessage({
                    to: channelID,
                    message: 'Hi! What can I help you with?'
                });
            
            break;
            
            // Just add any case commands if you want to..
         
         }
     }
});


bot.on("disconnect", event => {
	console.log("Disconnected: " + event.reason + " (" + event.code + ")");
});

bot.on("message", message => {
	if(message.channel.type === "dm" && message.author.id !== bot.user.id) { //Message received by DM
		//Check that the DM was not send by the bot to prevent infinite looping
		message.channel.sendMessage(dm_text);
	} else if(message.channel.type === "text" && message.channel.name === text_channel.name) { //Message received on desired text channel
		if(message.isMentioned(bot.user)) {
			message.reply(mention_text);
		} else {
			var message_text = message.content;
			if(message_text[0] == '!') { //Command issued
				handle_command(message, message_text.substring(1));
			}
		}
	}
});










































