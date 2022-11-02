let Sediment = require("sediment");
const LanguageDetect = require("languagedetect");
const lngDetector = new LanguageDetect();
const Typo = require("typo-js");
var dictionary = new Typo("en_US");

function getSentiment(text) {}
async function filterTweet(text, symbol) {
  //Remove random links and line breaks
  var newText = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");
  newText = newText.replace(/[\r\n]/gm, "");

  if (checkLanguage(newText)) {
    //Retrieve every word
    words = newText.split(" ");
    flag = false;
    const promises = words.map((word) => {
      if (dictionary.check(word) !== true) {
        flag = true;
        console.log(word + " is wrong");
        return word;
      }
    });
    wrongWords = await Promise.all(promises);
    if (!flag) {
      console.log("Has Spelling Errors: " + newText);
    }
  }
}
function checkLanguage(text) {
  languages = lngDetector.detect(text);
  //console.log(languages[0][0]);
  if (languages[0][0] == "english") {
    return true;
  } else {
    return false;
  }
}
function checkWord(word) {
  if (dictionary.check(word) !== true) {
    number = /^\d$/.test(char);
    if (!number) {
    }
  }
}
function storeSentiment() {}
module.exports = {
  getSentiment,
  filterTweet,
};
