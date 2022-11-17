FROM denoland/deno:latest

EXPOSE 3000

WORKDIR /app

USER deno

COPY deps.ts .
RUN deno cache deps.ts

ADD . .

RUN deno cache main.ts

CMD ["run", "--allow-net", "--allow-env=DISCORD_TOKEN,DISCORD_CHANNEL,DISCORD_GUILD,DISCORD_OWNER", "main.ts"]