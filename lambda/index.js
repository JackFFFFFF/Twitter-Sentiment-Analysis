const AWS = require("aws-sdk");
// S3 setup
const bucketName = "10794948-stock-bucket";
AWS.config.update({
  region: "ap-southeast-2",
  apiVersion: "latest",
  credentials: {
    accessKeyId: "ASIA5DYSEEJ4UERIYEWN",
    secretAccessKey: "fVmftBrDn9Vqm2ffDdAN+o6rPvxZXGRISjb3l5VZ",
    sessionToken: "IQoJb3JpZ2luX2VjEBEaDmFwLXNvdXRoZWFzdC0yIkcwRQIgSQ5Nezqzvk3aUIe45z4vZyu/m/qw3yHamMBvuKiS6E0CIQDR6nklWhqvor/fSO011hkYX/ZuZicrd3b2YSuhvt3bQSq5Awj6//////////8BEAIaDDkwMTQ0NDI4MDk1MyIM7uQo/kPYZuy590c4Ko0D+nk+qfnV+7yLf2HDMBp69ezqY0NIIwpi+9ta5qwYoQ9hHUSy4yKvqaMYglWuGEcabg8naUzvqBZzuAk8rv7NGqbGic28X6tXkWxSkDnXuSV9MrXiF69DGiHBEs653g2dPitM3GIuL0ja8rOJ/+7QmNXZL4vnuQApe+LAXfpGEXnFFWlD09nTf8lnnnEwWAKEW4txtuJUmDG7zYXhf4dwIi4ytntxeZRlNwtSDqozi6GxibqmTowSuxwOoC450X2LrDaqMmbaA3gpdh7IVjRxB5R0h3d7F70TVb3rlpVxiOzKj5hei31tGPGoT8Lx+6oCucFuJQJ8TFcAS/muwKA9LChRYeHJIxeYqctVki39qKU1IyxsulLjLN8Az9TpK9ZC1kVuRVCzId7PZIgjxAhbseX6cipt8dEfnRQCw0AlWrvef45Savvc69gp6BMUNJrK+BoBBNYlp6U9z/ytR5Je0/WKMhEgLnUNpd6f5gqXSbwPcm0UU4RtTaSNLqBMOiE45Nh0Fv0MFPYHkTv7bjC2gpybBjqmATQDSn9cIFN5GJYjY5fZwE0QpLCByqV4wOyV/7jnWUX0KKbuVBFQ97aVM5komB+2D0vK/W1mR9zDOwoYDrHPNMqThvEwmb8O678JX64t4ahKo3sodaYC2hCUeuSODlke/VxN4X2d28yI5u9E5UUyqxJyfgbCBQhAzYuyTFzYFXpLzm/89+kGjN/T0bmag2MdtrmKJgdB4p0iafUhTgWhalaRAG63bk0=",
  },
});
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
const redis = require("redis");
const redisClient = redis.createClient({
  url: "redis://" + "stock-cluster-10794948.km2jzi.ng.0001.apse2.cache.amazonaws.com",
});
redisClient.connect().catch((err) => {
  console.log(err);
});

/*
s3.createBucket({ Bucket: bucketName })
  .promise()
  .then(() => console.log(`Created bucket: ${bucketName}`))
  .catch((err) => {
    // We will ignore 409 errors which indicate that the bucket already exists
    if (err.statusCode !== 409) {
      console.log(`Error creating bucket: ${err}`);
    }
  });
  */
const axios = require("axios");
const options = {
  method: "GET",
  url: "https://yahoo-finance15.p.rapidapi.com/api/yahoo/co/collections/most_actives",
  params: { start: "0" },
  headers: {
    "X-RapidAPI-Key": "9a9ba72e2fmsh96a9c4e1f101546p1e8695jsn89dd50fb4425",
    "X-RapidAPI-Host": "yahoo-finance15.p.rapidapi.com",
  },
};
async function getTickers() {
    const axios = require("axios");
    return await axios
      .request(options)
      .then(async function (response) {
        //console.log(response.data.quotes);
        var tickers = [];
        await response.data.quotes.forEach((stock) => {
          let stockJSON = {
            name: stock.longName,
            symbol: stock.symbol,
            price: stock.regularMarketPrice,
            changePercent: stock.regularMarketChangePercent,
            postiveSentimentTotal: 0,
            negativeSentimentTotal: 0,
            postiveSentimentSum: 0,
            negativeSentimentSum: 0,
            neutralSentimentSum: 0,
          };
          tickers.push(stock.symbol);
          storeObject(stockJSON, false);
        });
        return tickers;
      })
      .catch(function (error) {
        console.error(error); //More error handling and maybe relevant error message
      });
  }

async function storeObject(data, update) {
  //Create object upload promise
  const key = data.symbol;
  const s3Key = `stock-${key}`;
  const redisKey = s3Key;
  const data2 = data;
  redisClient
    .get(redisKey)
    .then((result) => {
      if (result && !update) {
        return true;
      } else {
        if (update) {
          console.log("Updated redis");
        }
        data2["source"] = "Redis Cache";
        redisClient.setEx(
          redisKey,
          3600,
          JSON.stringify({ source: "Redis Cache", ...data2 })
        );
      }
    })
    .catch((err) => {
      console.log(err); //Error handle
    });
    data["source"] = "S3 Bucket";
  const params = {
    Bucket: bucketName,
    Key: s3Key,
    ContentType: "application/json",
    Body: JSON.stringify({ source: "S3 Bucket", ...data }),
  };
  await s3
    .putObject(params)
    .promise()
    .then(() => {
      console.log(`Successfully uploaded data to ${bucketName}/${s3Key}`);
    })
    .catch((err) => {
      console.log(err, err.stack);
    });
}

exports.handler = function(event, context, callback) {
    getTickers();
}
