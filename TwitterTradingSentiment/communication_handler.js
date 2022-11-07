const axios = require("axios");
let ip = "http://" + process.env.SERVER_IP + "/";
module.exports = {
  sendData: async function (tweet) {
    const data = await axios
      .post(ip, { text: tweet })
      .then((res) => console.log(res.data))
      .catch((err) => {
        if (err.response) {
          console.log(err.response);
        }
      });
  },
};
