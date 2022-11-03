const axios = require("axios");
let ip = "http://localhost:3001/"; //Change to be dynamic/environment variable
module.exports = {
  sendData: async function (tweet) {
    const data = await axios
      .post(ip, { text: tweet })
      .then((res) => res.data)
      .catch((err) => {
        console.log(err); //make into better error handle
      });
  },
};
