let Sediment = require("sediment");
const LanguageDetect = require("languagedetect");
const lngDetector = new LanguageDetect();
const Typo = require("typo-js");
var natural = require("natural");
const fs = require("fs");
const storageHandler = require("../TwitterTradingSentiment/storage_handler");
const wordListPath = require("word-list");
const catWords = require("categorized-words");

const AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-2",
  apiVersion: "latest",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

//Simple words
const dictionary = catWords.N.concat(catWords.V)
  .concat(catWords.A)
  .concat(catWords.P)
  .concat(catWords.I)
  .concat(catWords.C);
const corpus = fs
  .readFileSync(wordListPath, "utf8")
  .split("\n")
  .concat(dictionary);

async function getSentiment(text, symbol) {
  let sentiment = Sediment.analyze(text);
  console.log(text);

  await storageHandler.retrieveObject(symbol).then((stock) => {
    if (sentiment.score > 0) {
      stock.postiveSentimentTotal++;
      stock.postiveSentimentSum += sentiment.score;
      console.log(
        "Positive sentiment about stored" +
          symbol +
          ", score:" +
          sentiment.score
      );
    } else if (sentiment.score < 0) {
      stock.negativeSentimentSum++;
      stock.negativeSentimentSum += sentiment.score;
      console.log(
        "Negative sentiment about stored" +
          symbol +
          ", score:" +
          sentiment.score
      );
    } else {
      stock.neutralSentimentSum++;
      console.log(
        "Neutral sentiment about stored" + symbol + ", score:" + sentiment.score
      );
    }
    storageHandler.storeObject(stock, true);
  });
}

async function filterTweet(text, symbol) {
  //Remove random links and line breaks
  var newText = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");
  newText = newText.replace(/[\r\n]/gm, "");
  newText = newText.replace(/\s\s+/g, " ");
  //console.log(dictionary);
  if (checkLanguage(newText)) {
    //Retrieve every word
    words = newText.split(" ");
    const promises = words.map((word) => {
      if (checkWord(word, symbol)) {
        console.log(word + " is wrong");
        return word;
      }
    });

    wrongWords = await Promise.all(promises);

    //Remove all undefineds
    wrongWords = wrongWords.filter((element) => {
      return element !== undefined;
    });
    wrongWordsCount = Object.keys(wrongWords).length;
    wordsCount = Object.keys(words).length;
    console.log(wrongWordsCount);
    console.log(Math.floor(0.25 * wordsCount));
    if (wrongWordsCount > Math.floor(0.25 * wordsCount)) {
      console.log("Majority wrong: " + newText);
    } else {
      getSentiment(newText, symbol);
    }
  }
}
function checkLanguage(text) {
  languages = lngDetector.detect(text);
  if (languages[0][0] == "english") {
    return true;
  } else {
    return false;
  }
}
//Returns true for a invalid word
function checkWord(word, symbol) {
  let invalid = false;
  var spellcheck = new natural.Spellcheck(corpus);
  //check for number
  let number = /^\d$/.test(word);
  //check for special character
  var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  const regex_emoji =
    /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/u;
  let special = format.test(word);
  if (!number && !special && word != " " && word.length > 2) {
    if (!spellcheck.isCorrect(word.toLowerCase())) {
      invalid = true;
    }
  } else if (regex_emoji.test(word)) {
    invalid = true;
  }
  return invalid;
}
function storeSentiment() {}
module.exports = {
  getSentiment,
  filterTweet,
};
