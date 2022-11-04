let Sediment = require("sediment");
const LanguageDetect = require("languagedetect");
const lngDetector = new LanguageDetect();
var natural = require("natural");
const fs = require("fs");
const storageHandler = require("./storage_handler");
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
//Random english words
const corpus = fs
  .readFileSync(wordListPath, "utf8")
  .split("\n")
  .concat(dictionary);

//Generates sentiment from tweet text and updates stored value
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
//General filtering of tweet before sending for sentiment analysis
async function filterTweet(text, symbol) {
  //Remove random links and line breaks
  var newText = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, "");
  newText = newText.replace(/[\r\n]/gm, "");
  newText = newText.replace(/\s\s+/g, " ");

  //Double check language is majority english
  if (checkLanguage(newText)) {
    //Retrieve every word
    words = newText.split(" ");
    const promises = words.map((word) => {
      if (checkWord(word)) {
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

    //Check to see if less then 20% of words in tweet is misspelt
    if (wrongWordsCount > Math.floor(0.2 * wordsCount)) {
      console.log("Majority wrong: " + newText);
    } else {
      getSentiment(newText, symbol);
    }
  }
}
//Pass in tweet text and return true if english is top hit
function checkLanguage(text) {
  languages = lngDetector.detect(text);
  if (languages[0][0] == "english") {
    return true;
  } else {
    return false;
  }
}
//Returns true for a invalid word
function checkWord(word) {
  let invalid = false;
  //creates new spellcheck with dictionary
  var spellcheck = new natural.Spellcheck(corpus);

  //check for number
  let number = /^\d$/.test(word);

  //check for special character
  var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  //Check for emoji
  const regex_emoji =
    /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/u;

  let special = format.test(word);

  if (!number && !special && word != " " && word.length > 2) {
    //If a good word to spellcheck, pass through dictionary and check
    if (!spellcheck.isCorrect(word.toLowerCase())) {
      invalid = true;
    }
  } else if (regex_emoji.test(word)) {
    invalid = true;
  }
  return invalid;
}
module.exports = {
  getSentiment,
  filterTweet,
};
