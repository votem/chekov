# Chekov (Check Off)

Chekov is a simple scrum bot for Slack. It first reminds users to update
their JIRA tickets, then asks them what they worked on, what they will
work on, and if they're on track to finish the sprint on time. If the last
answer is no, a follow up question will be asked to give the reasons why.

A number of configuration options are available via environment variable;
see [`env/example.env`](env/example.env) for more information.

## Prerequisites

*   Node.js (tested with version 6 but others should work)
*   Administrative access to a Slack workspace for configuration
*   Docker (optional)

## Setup

To use chekov a bot must first be configured in your Slack workspace. More
information on setting up Slack bots can be found [here](https://api.slack.com/bot-users).

Once that is complete, create a new environment file by coping the example
in the `env` folder. Add the generated token to it, and configure the other
values as appropriate. Note that the bot must be invited to the desired posting
channel with `/invite @chekov` (assuming you named your bot `chekov` in Slack,
which you should; add a nice avatar of Walter Koenig while you're at it)

Finally run `npm i` to install Node.js dependencies.

## Usage

To run the bot once, execute `. env/your.env && npm start`. It will go through
its questions with the configured users, post the results, and then exit.

A `Dockerfile` is also provided. Execute `docker built -t chekov .` to build the
image, and then run it with `docker run --env-file env/your.env chekov`.

## Credits

This software was developed as an internal project at Everyone Counts, Inc.

Everyone Counts provides elegantly simple software and exceptional services to upgrade
the election process. The eLect brand offers unrivaled web-based voting products including
Voter Registration, Online Voting, and Remote Accessible Voting. The product suite
is designed to address pain points facing election officials today, including security,
accessibility, cost, and sustainability.

For more information, visit http://everyonecounts.com.
