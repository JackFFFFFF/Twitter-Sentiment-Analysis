const needle = require("needle");
require("dotenv").config();
var commsHandler = require("./communication_handler");
// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const token = process.env.BEARER_TOKEN;

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL = "https://api.twitter.com/2/tweets/search/stream";

// this sets up two rules - the value is the search terms to match on, and the tag is an identifier that
// will be applied to the Tweets return to show which rule they matched
// with a standard project with Basic Access, you can add up to 25 concurrent rules to your stream, and
// each rule can be up to 512 characters long
async function getAllRules() {
  const response = await needle("get", rulesURL, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 200) {
    console.log("Error:", response.statusMessage, response.statusCode);
    throw new Error(response.body);
  }

  return response.body;
}

async function deleteAllRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map((rule) => rule.id);

  const data = {
    delete: {
      ids: ids,
    },
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body);
  }

  return response.body;
}

async function setRules(rules) {
  const data = {
    add: rules,
  };

  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });
  console.log(response.body);
  if (response.statusCode !== 201) {
    throw new Error(response.body);
  }

  return response.body;
}

function streamConnect(retryAttempt) {
  const stream = needle.get(streamURL, {
    headers: {
      "User-Agent": "v2FilterStreamJS",
      Authorization: `Bearer ${token}`,
    },
    timeout: 20000,
  });
  //TODO: Erorr Handle this so it doesn't crash
  stream
    .on("data", (data) => {
      try{
        //console.log(data);
        if(data.title == 'ConnectionException'){
          console.log("Connection errored out!");
          console.log(e);
          process.exit(1);
        }else{
          const json = JSON.parse(data);
          commsHandler.sendData(json); //Send post of tweet text to server
          console.log(json);
          // A successful connection resets retry count.
          retryAttempt = 0;
        }
      }catch{
        console.log("Stream overloaded " + retryAttempt);
        setTimeout(() => {
          console.warn("A connection error occurred. Reconnecting...");
          streamConnect(++retryAttempt);
        }, 2 ** retryAttempt);
      }
      

    })
    .on("err", (error) => {
      if (error.code !== "ECONNRESET") {
        console.log(error);
        process.exit(1);
      } else {
        // This reconnection logic will attempt to reconnect when a disconnection is detected.
        // To avoid rate limits, this logic implements exponential backoff, so the wait time
        // will increase if the client cannot reconnect to the stream.
        console.log(error);
        setTimeout(() => {
          console.warn("A connection error occurred. Reconnecting...");
          streamConnect(++retryAttempt);
        }, 2 ** retryAttempt);
      }
    });

  return stream;
}
module.exports = {
  startStream: async function (rules) {
    let currentRules;

    try {
      // Gets the complete list of rules currently applied to the stream
      currentRules = await getAllRules();

      // Delete all rules. Comment the line below if you want to keep your existing rules.
      await deleteAllRules(currentRules);

      // Add rules to the stream. Comment the line below if you don't want to add new rules.
      await setRules(rules);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }

    // Listen to the stream.
    streamConnect(0);
  },
};
