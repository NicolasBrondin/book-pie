//const FFplay = require("ffplay"),
const MPlayer = require('mplayer'),
UserDataManager = require('./UserDataManager.js'),
Gpio = require('onoff').Gpio;


const BOOKS_DIR = "./data/";
const VOICE_DIR = "./audio/";
const USER_DATA_FILE = "user-data.json";

const WORDS = {
    welcome: VOICE_DIR+"Bienvenue.wav",
    main_menu: VOICE_DIR+"Menu principale.wav",
    help: VOICE_DIR+"Besoin aide.wav",
    books:VOICE_DIR+"Liste des livres.wav",
    resume:VOICE_DIR+"Reprendre.wav",
    open_help: VOICE_DIR+"help.m4a",
    no_save: VOICE_DIR+"no-save.m4a",
    chapters_list: VOICE_DIR+"Liste des chapitres.wav",
    chapter: function(i){return VOICE_DIR+"Chapitre "+i+".wav"}
}

let data_manager = new UserDataManager();

let books;
var current_book = null;
var current_chapter = null;
var selector_level = 'menu';
const menu = ['resume','books','help'];
let current_menu_item = null;
var player = new MPlayer({debug: false});
let playing_time = 0;
let last_playing_time = 0;
let last_save_time = 0;
let playlist = [];
let playing = false;
let volume = 100;

let led;
let btn_left;
let btn_right;
let btn_up;
let btn_down;
let btn_vol_up;
let btn_vol_down;


function close_process() {
    /*if (debug) {
        clearInterval(debug_timer);
    }*/
    button_vol_up.unexport();
    button_vol_down.unexport();
    button_up.unexport();
    button_down.unexport();
    button_left.unexport();
    button_right.unexport();
    led.writeSync(0);
    led.unexport();
    //console.log('Closing normally');
    process.exit();
}

player.on("stop", function(){
    playing = false;
    if(playlist.length > 0){
        let item = playlist.pop();
        player.openFile(item.file);
        player.volume(volume);
        if(item.opts.seek){
            player.seek(item.opts.seek);
        }
        playing = true;
    }
})

player.on("time", function(time){
    if(selector_level === 'player'){
        if(time - last_playing_time > 2){
            playing_time = time;
            last_playing_time = time;
        }
        if(playing_time - last_save_time  > 30){
            data_manager.set_data({
                time: time
            });
            last_save_time = playing_time;
            console.log("saved");
        }
        
    }
})
fs = require('fs');

async function init(){
    
    if (Gpio.accessible) {
        try {
            button_left = new Gpio(17, 'in', 'both', { debounceTimeout: 10 }); // Physical right button
            button_right = new Gpio(27, 'in', 'both', { debounceTimeout: 10 }); //Physical bottom button
            button_up = new Gpio(22, 'in', 'both', { debounceTimeout: 10 }); // Physic left button
            button_down = new Gpio(23, 'in', 'both', { debounceTimeout: 10 }); //Physical top button
            button_vol_down = new Gpio(24, 'in', 'both', { debounceTimeout: 10 }); //Physical top button
            button_vol_up = new Gpio(25, 'in', 'both', { debounceTimeout: 10 }); //Physical top button
            led = new Gpio(18, 'out');
            led.writeSync(1);
            button_left.watch(function (err, value) {
                if (value == 0) {
                    execute_command("left");
                }
            });
            button_right.watch(function (err, value) {
                if (value == 0) {
                    execute_command("right");
                }
            });
            button_up.watch(function (err, value) {
                if (value == 0) {
                    execute_command("up");
                }
            });
            button_down.watch(function (err, value) {
                if (value == 0) {
                    execute_command("down");
                }
            });
            button_vol_up.watch(function (err, value) {
                if (value == 0) {
                    execute_command("vol+");
                }
            });
            button_vol_down.watch(function (err, value) {
                if (value == 0) {
                    execute_command("vol-");
                }
            });
            console.log("GPIO configured");
        } catch (e) {
            throw e;
            close_process();
        }
    }

    await data_manager.init(USER_DATA_FILE);
    let user_data = data_manager.get_data();
    if(user_data.volume){
        volume = user_data.volume;
        player.volume(volume);
    }
    var readline = require('readline');
    var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
    });

    rl.on('line', function(line){
        execute_command(line);
    })
    load_library();
    welcome();
    console.log(books);
}

function welcome(){
    play_sound_file(WORDS.welcome);
    open_main_menu();
}

function play_sound_file(path, opts) {
    opts = opts || {};
        if(opts.force){
            playlist = [];
        }
        playlist.push({file: path, opts: opts});
    if(!playing || opts.force) {
        let item = playlist.pop()
        player.openFile(item.file);
        player.volume(volume);
        if(item.opts.seek){
            player.seek(item.opts.seek);
        }
        playing = true;
    }
    
}

function load_library() {
    
    // Books library initialization
    books = getDirectories();
    books = books.map(function (book) {
        var title = book;
        book = {
            title: title,
            chapters: getFiles(book)
        };
        return book;
    });
}

function getDirectories() {
    return fs.readdirSync(BOOKS_DIR).filter(function (file) {
      return fs.statSync(BOOKS_DIR + file).isDirectory();
    });
}

function getFiles(book) {
    return fs.readdirSync(BOOKS_DIR+book+'/').filter(function (file) {
      return !fs.statSync(BOOKS_DIR+book+'/'+file).isDirectory() && file !== "title.m4a";
    });
}

function execute_command(command){
    switch(command){
        case "up": {
            if(selector_level === 'menu'){
                switch(menu[current_menu_item]){
                    case 'help': {play_sound_file(WORDS.open_help);break;}
                    case 'resume': {load_previous_book();break;}
                    case 'books': {open_book_list();break;}
                }
            } else if(selector_level === 'books'){
                open_book_chapters_list();
            } else if(selector_level === 'chapters'){
                play_chapter();
            } 
            
            break;
        }
        case "down": {
            if(selector_level === 'books'){
                open_main_menu();
            } else if(selector_level === 'chapters'){
                open_book_list();
            } else if(selector_level === 'player'){
                player.stop();
                open_book_chapters_list();
            }
            break;}
        case "left": {
            if(selector_level === 'menu'){
                navigate_main_menu(-1);
            } else if(selector_level === 'books') {
                navigate_book_list(-1);
            }else if(selector_level === 'chapters') {
                navigate_chapter_list(-1);
            } else if(selector_level === 'player') {
                navigate_chapter_time(-1);
            }
            break;
        }
        case "right": {
            if(selector_level === 'menu'){
                navigate_main_menu(1);
            }else if(selector_level === 'books') {
                navigate_book_list(1); 
            }else if(selector_level === 'chapters') {
                navigate_chapter_list(1);
            } else if(selector_level === 'player') {
                navigate_chapter_time(1);
            }
            break;
        }
        case "vol+": {
            volume = Math.min(100,volume+10);
            player.volume(volume);
            data_manager.set_data({
                volume: volume
            });
            break;
        }
        case "vol-": {
            volume = Math.max(60,volume-10);
            player.volume(volume);
            data_manager.set_data({
                volume: volume
            });
            break;
        }
    }
}

function open_main_menu(){
    current_menu_item === null;
    selector_level = "menu";
    
    play_sound_file(WORDS.main_menu);
}

function navigate_main_menu(direction){
    if(current_menu_item === null){
        current_menu_item = 0
    } else {
        current_menu_item = ((((current_menu_item+direction) % (menu.length))+menu.length)%menu.length);
    }
    play_sound_file(WORDS[menu[current_menu_item]]);
}

function load_previous_book(){
    let user_data = data_manager.get_data();
    if(user_data.book != null && user_data.chapter != null){
        current_book = user_data.book;
        current_chapter = user_data.chapter;
        play_chapter(user_data.time);
    } else {
        play_sound_file(WORDS.no_save);
    }
}
function open_book_list(){
    selector_level = "books";
    current_book = 0;
    play_sound_file(BOOKS_DIR+books[current_book].title+'/title.m4a');
}

function navigate_book_list(direction){
    current_book = ((((current_book+direction) % (books.length))+books.length)%books.length);
    play_sound_file(BOOKS_DIR+books[current_book].title+'/title.m4a');
}

function open_book_chapters_list(){
    selector_level = "chapters";
    current_chapter = 0;
    play_sound_file(WORDS.chapters_list);
    play_sound_file(WORDS.chapter(current_chapter+1));
}

function navigate_chapter_list(direction){
    current_chapter = ((((current_chapter+direction) % (books[current_book].chapters.length))+books[current_book].chapters.length)%books[current_book].chapters.length);
    play_sound_file(WORDS.chapter(current_chapter+1));
}

function play_chapter(time){
    playing_time = 0;
    last_playing_time = 0;
    last_save_time = 0;
    selector_level = "player";
    play_sound_file(BOOKS_DIR+"/"+books[current_book].title+"/"+books[current_book].chapters[current_chapter],{seek: time || 0});
    data_manager.set_data({
        book: current_book,
        chapter: current_chapter
    });
}

//Works but need refactoring
function navigate_chapter_time(direction){
    player.seek(parseInt(last_playing_time)+(30*direction));
    last_playing_time = parseInt(last_playing_time)+(30*direction);
    last_save_time = last_playing_time;
}
try {
    (async()=>{
        await init();
    })()
}catch(e){
    console.error(e);
}

process.on('SIGINT', close_process);