FROM node

#Setting environment variables (overridden when using docker run)
#ENV AWS_ACCESS_KEY_ID=YYTOKEN
#ENV AWS_SECRET_ACCESS_KEY=XXTOKEN
#ENV AWS_SESSION_TOKEN=ZZTOKEN
#ENV BEARER_TOKEN=YY
#ENV SECRET=YY
#ENV TWITTER_API=YY

#Setting up directory 
COPY . /TwitterSentimentAnalysis

WORKDIR /TwitterSentimentAnalysis

#Installing all the node modules needed
RUN npm install 

RUN npm install axios

RUN npm install express

RUN npm install needle

RUN npm install aws-sdk

RUN npm install dotenv

RUN npm install languagedetect

RUN npm install natural

RUN npm install fs

RUN npm install word-list

RUN npm install categorized-words

RUN npm install sediment

RUN npm install redis

RUN npm install -g pm2@3.2.4
#Exposing port 3000 as default port for localhost
EXPOSE 3000

#Utilizing npm start command for express application
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
