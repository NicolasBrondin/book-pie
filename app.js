//LIBS
const say = require('say');
const fs = require('fs');
const player = require('play-sound')(opts = {});
const keypress = require('keypress');
const child_process = require('child_process');

//CONSTANTS
const VOICE_SPEED = 1.3;
const LIBRARY_ROOT = __dirname + '/data/';

//VARIABLES
var current_book = null;
var current_chapter = null;
var selector = 'book';
var audio = null;
var tts_proc = null;
var books = null;

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
    keypress(process.stdin);
    process.stdin.on('keypress', detectArrows);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    console.log("Starting voice!");

    // Voice initialization
    tts("Bonjour et bienvenue dans votre liseuse de livre audio");
    setTimeout(function () {
        tts("Appuyez sur les touches droites et gauches pour changer les livres et les chapitres. La touche, O, sert a ouvrir un livre ou un chapitre et la touche bas pour revenir en arriere ! ")
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
    tts_proc = child_process.spawn('sh', ['-c','espeak -v fr "' + str + '" --stdout | aplay']);

    tts_proc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    tts_proc.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
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
}

init();










