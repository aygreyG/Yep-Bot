const { prefix } = require("../config.json");

module.exports = {
  commands: [
    {
      name: `${prefix}help <optional command name>`,
      description: "❓ Lists the commands and their descriptions or gives the description of the given command.",
    },
    {
      name: `${prefix}b/${prefix}blackjack`,
      description: "🃏 Starts a new blackjack game.",
    },
    {
      name: `${prefix}f/${prefix}flip <your bet> <heads/tails>`,
      description: "🪙 Flips a coin.",
    },
    {
      name: `${prefix}balance/${prefix}balance <user tag>`,
      description: "💰 Shows you your or the tagged user's balance.",
    },
    {
      name: `${prefix}l/${prefix}leaderboard`,
      description: "📋 Shows you the top 15 wealthiest user on the server.",
    },
    {
      name: `${prefix}ping`,
      description: "🏓 Pings the bot, if it's available it will answer.",
    },
    {
      name: `${prefix}mc/${prefix}minecraft <optional server ip>`,
      description:
        "🟩 Gets information about the minecraft server that is configured to this bot or tries to get information about the given server ip.",
    },
    {
      name: `${prefix}p/${prefix}play <youtube url>/<song name>`,
      description:
        "🎶 Joins your voice channel and plays the youtube url or searches for a song. If there is already a song   playing, it will be put in a queue.",
    },
    {
      name: `${prefix}search/${prefix}s <song name>`,
      description: "❔ Searches youtube and gives you 4 options to choose from.",
    },
    {
      name: `${prefix}playlist <youtube playlist url>`,
      description: "📜 Queues the given playlist.",
    },
    {
      name: `${prefix}queue/${prefix}q`,
      description: "📃 Shows you the queue.",
    },
    {
      name: `${prefix}skip/${prefix}next/${prefix}n`,
      description:
        "⏭ Skips the currently playing song, if there is no song in the queue and autoplay is enabled, plays a related  song.",
    },
    {
      name: `${prefix}autoplay/${prefix}ap`,
      description: "🔀 It enables/disables autoplay.",
    },
    {
      name: `${prefix}leave`,
      description: "⏏ Stops playback and leaves the channel.",
    },
    {
      name: `${prefix}pause`,
      description: "⏸ Pauses the playback.",
    },
    {
      name: `${prefix}resume`,
      description: "▶ Resumes the playback.",
    },
    {
      name: `${prefix}stop`,
      description: "⏹ Stops playback, sets autoplay to off and clears the queue.",
    },
    {
      name: `${prefix}del/${prefix}delete <queue index>/<song name>`,
      description: "💥 Deletes the song from the queue.",
    },
  ],
};
