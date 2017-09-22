# Chekov (Check Off)

Chekov is a simple scrum bot for Slack. It first reminds users to update
their JIRA tickets, then asks them what they worked on, what they will
work on, and if they're on track to finish the sprint on time. If the last
answer is no, a follow up question will be asked to give the reasons why.

A number of configuration options are available via environment variable;
see [`env/example.env`](env/example.env) for more information.

To run the bot once, execute

```bash
. env/your.env && npm start
```

A dockerfile is also provided

```bash
docker build -t chekov .
```

```bash
docker run --env-file env/example.env chekov
```

Note you must invite bot to channel.
