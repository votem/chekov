const Botkit = require('botkit');
const slack = require('@slack/client');

const Promise = require('bluebird');
const winston = require('winston');


const web = new slack.WebClient(process.env.SLACK_TOKEN);
const rtm = new slack.RtmClient(process.env.SLACK_TOKEN, {dataStore: new slack.MemoryDataStore(), autoReconnect: true});

const controller = Botkit.slackbot();
const bot = controller.spawn({ token: process.env.SLACK_TOKEN });


const TEAM_NAMES = process.env.TEAM_NAMES.split(',').sort();

const RESPONSE_TIME = parseInt(process.env.RESPONSE_TIME, 10) * 60 * 1000;


winston.info(`Team users: ${TEAM_NAMES}`);
winston.info(`Response time: ${RESPONSE_TIME} ms`);
winston.info(`Report channel: ${process.env.REPORT_CHANNEL}`);


const sayIntroduction = (user, conversation) => {
  conversation.say(`Hi ${user.profile.first_name}, it's time for your daily check-in!`);
  askUpdateJira(conversation);
  conversation.next();
};

const askUpdateJira = (conversation) => {
  conversation.ask(`If your tickets are not updated in JIRA, please do so now. Let me know when you're ready to proceed.`, (response, conversation) => {
    conversation.say(`Sweet. Let's rock this.`);
    askWhatDone(conversation);
    conversation.next();
  });
};

const askWhatDone = (conversation) => {
  conversation.ask(`What did you work on since the last check-in?`, (response, conversation) => {
    conversation.say(`Got it.`);
    askWillDo(conversation);
    conversation.next();
  }, {key: 'prev'});
};

const askWillDo = (conversation) => {
  conversation.ask(`What will you work on next?`, (response, conversation) => {
    conversation.say(`Excellent.`);
    askOnTrack(conversation);
    conversation.next();
  }, {key: 'next'});
};

const askOnTrack = (conversation) => {
  conversation.ask(`Based on what's left in JIRA, are you on track to complete your tasks this sprint?`,
    [
      {
        pattern: bot.utterances.yes,
        callback: (response, conversation) => {
          conversation.say(`Awesome! Thanks for your efforts.`);
          sayGoodbye(conversation);
          conversation.next();
        }
      },
      {
        pattern: bot.utterances.no,
        callback: (response, conversation) => {
          conversation.say(`Bummer.`);
          askIssues(conversation);
          conversation.next();
        }
      },
      {
        default: true,
        callback: (response, conversation) => {
          conversation.say(`Sorry, I only understand yes or no answers here.`)
          conversation.repeat();
          conversation.next();
        }
      }
    ]
  );
};

const askIssues = (conversation) => {
  conversation.ask(`What are your specific concerns?`, (response, conversation) => {
    conversation.say(`Ok. Your team lead will follow up soon.`);
    sayGoodbye(conversation);
    conversation.next();
  }, {key: 'issues'});
};

const sayGoodbye = (conversation) => {
  conversation.say(`All done. Have a great day!`);
  conversation.next();
};


const botStartConversation = (user) => {
  return new Promise( (resolve, reject) => {
    bot.startPrivateConversation({ user: user.id}, (error, conversation) => {
      if (!error) {
        sayIntroduction(user, conversation);
        resolve(conversation);
      } else {
        reject(error);
      }
    });
  });
};

const botConversationResults = (user, conversation) => {
  return new Promise( (resolve, reject) => {
    let responses = {};
    conversation.on('end', (conversation) => {
      responses = conversation.extractResponses();
      winston.info(`Responses for ${user.profile.real_name}: ${JSON.stringify(responses)}`);
      resolve({ user, responses });
    });
    setTimeout(() => conversation.stop(), RESPONSE_TIME);
  });
};


const slackSendMessage = (text) => {
  return new Promise( (resolve, reject) => {
    const channel = rtm.dataStore.getChannelByName(process.env.REPORT_CHANNEL);
    rtm.sendMessage(text, channel.id, () => {
      resolve();
    });
  });
};


rtm.on(slack.CLIENT_EVENTS.RTM.AUTHENTICATED, (startData) => {
  winston.info(`Logged into Slack as ${startData.self.name}`);
});


rtm.on(slack.CLIENT_EVENTS.RTM.DISCONNECT, () => {
  winston.info(`Disconnected from Slack`);
});


rtm.on(slack.CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {

  bot.startRTM(Promise.coroutine(function* () {

    const promises = [];
    for (const name of TEAM_NAMES) {
      const user = rtm.dataStore.getUserByName(name);
      winston.info(`Starting conversation with ${user.profile.real_name}`);
      const conversation = yield botStartConversation(user);
      const resultsPromise = botConversationResults(user, conversation);
      promises.push(resultsPromise);
    }
    const results = yield Promise.all(promises);

    winston.info(`All responses received, generating report.`);
    const texts = [`Today's Scrum Report`, `>>>`];
    for (const result of results) {
      texts.push(`*${result.user.profile.real_name}*`);
      if (result.responses.prev) texts.push('• Yesterday: ' + result.responses.prev);
      if (result.responses.next) texts.push('• Today: ' + result.responses.next);
      if (result.responses.issues) texts.push('• ISSUES: ' + result.responses.issues);
    }
    const report = texts.join('\n');
    const channel = rtm.dataStore.getChannelByName(process.env.REPORT_CHANNEL);
    yield slackSendMessage(report, channel);


    bot.closeRTM();
    rtm.disconnect();

    process.exit();

  }));

});


rtm.start();
