//LIBS
const say = require('say'),
    fs = require('fs'),
    player = require('play-sound')(opts = {}),
    keypress = require('keypress'),
    child_process = require('child_process'),
    Gpio = require('onoff').Gpio;

const debug = false;
let debug_timer = null;
let button_timer = null;
let button_available = true;

let button_left, button_right, button_top, button_bottom, led;

function close_process() {
    if (debug) {
        clearInterval(debug_timer);
    }
    button_top.unexport();
    button_bottom.unexport();
    button_left.unexport();
    button_right.unexport();
    led.writeSync(0);
    led.unexport();
    console.log('Closing normally');
    process.exit();
}

if (Gpio.accessible) {
    try {
        button_left = new Gpio(27, 'in', 'both', { /*debounceTimeout: 10*/ }); // Physical right button
        button_right = new Gpio(18, 'in', 'both', { /*debounceTimeout: 10*/ }); //Physical bottom button
        button_top = new Gpio(22, 'in', 'both', { /*debounceTimeout: 10*/ }); // Physic left button
        button_bottom = new Gpio(23, 'in', 'both', { /*debounceTimeout: 10*/ }); //Physical top button
        led = new Gpio(17, 'out');
        led.writeSync(1);
        console.log("GPIO configured");
    } catch (e) {
        throw e;
        close_process();
    }
} else {
    console.log("GPIO not accessible");
}

//CONSTANTS
const VOICE_SPEED = 1;
const LIBRARY_ROOT = __dirname + '/data/';

//VARIABLES
var current_book = null;
var current_chapter = null;
var selector = 'book';
var audio = null;
var tts_proc = null;
var books = null;

function button_clicked() {
    button_available = false;
    button_timer = setTimeout(function () {
        button_available = true;
    }, 1000);
}

function init() {

    console.log("Starting...");

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

    console.log("Books library loaded!");

    // Keyboard input initialization
    /*keypress(process.stdin);
    process.stdin.on('keypress', detectArrows);
    if (process.stdin.setRawMode){
        process.stdin.setRawMode(true)
    }

    process.stdin.resume();*/


    button_left.watch(function (err, value) {
        console.log(new Date()," | button left : ", value);
        if (value == 1) {
            if (button_available) {
                button_clicked();
                if (selector == 'book') {
                    previousBook();
                } else if (selector == 'chapter') {
                    previousChapter();
                }
            }
        }
    });

    button_right.watch(function (err, value) {

        console.log(new Date()," | button right: ", value);
        if (value == 1) {
            if (button_available) {
                button_clicked();
                if (selector == 'book') {
                    nextBook();
                } else if (selector == 'chapter') {
                    nextChapter();
                }
            }
        }
    });

    button_top.watch(function (err, value) {

        console.log(new Date(), " | button top: ", value);
        if (value == 1) {
            if (button_available) {
                button_clicked();
                if (selector == 'book') {
                    openBook();
                } else if (selector == 'chapter') {
                    playChapter();
                }
            }
        }
    });

    button_bottom.watch(function (err, value) {

        console.log(new Date(), " | button bottom: ", value);
        if (value == 1) {
            if (button_available) {
                button_clicked();
                if (audio) {
                    stopChapter();
                } else if (selector == 'chapter') {
                    closeBook();
                }
            }
        }
    });

    console.log("Starting voice!");

    // Voice initialization
    tts("Bonjour Pépé !");
    setTimeout(function () {
        tts("Touche droite et gauche: Changer les livres. Touche haut: Ouvrir un livre. Touche bas: Revenir en arrière.")
        setTimeout(function () {
            tts("Liste des livres");
            current_book = 0;
            setTimeout(function () {
                sayBookTitle();
            },2000);
        }, 9000);
    }, 3000);
}

// Text-To-Speech
function tts(str) {
    //say.stop()
    //say.speak(str, null, VOICE_SPEED);
    //

    if (tts_proc) {

        tts_proc.kill('SIGINT');
    }
    tts_proc = child_process.spawn('sh', ['-c','espeak -v  mb-fr4 -s 115 "' + str + '" --stdout | aplay']);

    tts_proc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    tts_proc.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    tts_proc.on('close', (code) => {
        console.log(`Finished speaking`);
    });

}

function getDirectories() {
    return fs.readdirSync(LIBRARY_ROOT).filter(function (file) {
      return fs.statSync(LIBRARY_ROOT + file).isDirectory();
    });
}

function getFiles(book) {
    return fs.readdirSync(LIBRARY_ROOT+book+'/').filter(function (file) {
      return !fs.statSync(LIBRARY_ROOT+book+'/'+file).isDirectory();
    });
}

function sayBookTitle() {
    tts("Livre "+ (current_book+1) +":"+books[current_book].title);
}

function sayChapterTitle() {
    //tts(books[current_book].chapters[current_chapter]);
    tts("Chapitre " + (current_chapter + 1));
}

function getCurrentAbsolutePath() {
    var book = books[current_book];
    var chapter = books[current_book].chapters[current_chapter];
    return LIBRARY_ROOT + book.title + '/' + chapter;
}

function playChapter() {
    if (!audio) {
        tts("Lecture du chapitre");
        setTimeout(function () {
            audio = player.play(getCurrentAbsolutePath(), function (err) {
                if (err) {
                    console.error(err.message);
                }
            });
        }, 500);
    }
}

function stopChapter() {
    audio.kill();
    audio = null;
    tts("Liste des chapitres");
    current_chapter = 0;
    setTimeout(function () {
        sayChapterTitle();
    },2000);
    selector = 'chapter';
}

function openBook() {
    if (current_book != null) {
        tts("Liste des chapitres");
        current_chapter = 0;
        setTimeout(function () {
            sayChapterTitle();
        },2000);
        selector = 'chapter';
    }
}

function closeBook() {
    tts("Liste des livres");
    current_book = 0;
    setTimeout(function () {
        sayBookTitle();
    },2000);
    selector = 'book';
}

function nextBook() {
    current_book = current_book != null ? current_book + 1 : 0
    if (current_book == books.length) {
        current_book = 0;
    }
    sayBookTitle();
}

function previousBook() {
    current_book = current_book != null ? current_book - 1 : 0
    if (current_book < 0) {
        current_book = books.length - 1;
    }
    sayBookTitle();
}

function previousChapter() {
    current_chapter = current_chapter != null ? current_chapter - 1 : 0
    if (current_chapter < 0) {
        current_chapter = books[current_book].chapters.length - 1;
    }
    sayChapterTitle();
}

function nextChapter() {
    current_chapter = current_chapter != null ? current_chapter + 1 : 0
    if (current_chapter == books[current_book].chapters.length) {
        current_chapter = 0;
    }
    sayChapterTitle();
}

/*
function detectArrows(ch, key) {
    process.stdin.pause();
    if (key) {
        if (key.name == 'left') {
            if (selector == 'book') {
                previousBook();
            } else if (selector == 'chapter') {
                previousChapter();
            }
        } else if (key.name == 'right') {
            if (selector == 'book') {
                nextBook();
            } else if (selector == 'chapter') {
                nextChapter();
            }
        } else if (key.name == 'up') {
            if (selector == 'book') {
                openBook();
            } else if (selector == 'chapter') {
                playChapter();
            }
        } else if (key.name == 'down') {
            if (audio) {
                stopChapter();
            } else if (selector == 'chapter') {
                closeBook();
            }
        } else if (key.name == 'escape') {
            process.exit(0);
        }
    }
    process.stdin.resume();
}*/

init();

if (debug) {
    debug_timer = setInterval(function () { tts("Bonjour Pépé, comment allez-vous aujourd'hui ?"); }, 3000);
}

process.on('SIGINT', close_process);






