const {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
  demuxProbe,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const Discord = require("discord.js");
const { getInfo } = require("ytdl-core");
const ytdl = require("ytdl-core");
// this can be used if needed
const { raw } = require("youtube-dl-exec");

class MusicBot {
  constructor(channel, mchannel) {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    this.mchannel = mchannel;
    this.channel = channel;
    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    this.queue = [];

    // this.connection.on('stateChange', (oldState, newState) => {
    //   console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
    // });

    this.connection.on(VoiceConnectionStatus.Ready, () => {
      // console.log("Connected to audioPlayer");
      this.connection.subscribe(this.audioPlayer);
    });

    this.audioPlayer.on("error", (error) => {
      console.error(error);
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      const play = this.queue.shift();
      if (play) {
        this.audioPlayer.play(play);
        this.mchannel.send({
          embeds: [
            new Discord.MessageEmbed()
              .setColor("DARK_VIVID_PINK")
              .setDescription(
                `Now playing: ${this.audioPlayer.state.resource.metadata.title}`
              ),
          ],
        });
      }
    });

    // this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
    //   console.log('The audio player has started playing!');
    // });

    this.connection.on(
      VoiceConnectionStatus.Disconnected,
      async (oldState, newState) => {
        try {
          await Promise.race([
            entersState(
              this.connection,
              VoiceConnectionStatus.Signalling,
              5_000
            ),
            entersState(
              this.connection,
              VoiceConnectionStatus.Connecting,
              5_000
            ),
          ]);
          // Seems to be reconnecting to a new channel - ignore disconnect
        } catch (error) {
          // Seems to be a real disconnect which SHOULDN'T be recovered from
          this.connection.destroy();
        }
      }
    );
  }

  enqueue(resource) {
    if (
      this.queue.length > 0 ||
      this.audioPlayer.state.status == AudioPlayerStatus.Playing
    ) {
      // console.log('The audio player has queued a song');
      this.queue.push(resource);
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_BUT_NOT_BLACK")
            .addField(
              "Queued: ",
              `[${resource.metadata.title}](${resource.metadata.url})`
            ),
        ],
      });
    } else {
      // console.log('The audio player attemted to start a song');
      this.audioPlayer.play(resource);
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_VIVID_PINK")
            .addField(
              "Now playing: ",
              `[${this.audioPlayer.state.resource.metadata.title}](${this.audioPlayer.state.resource.metadata.url})`
            ),
          // .setDescription(
          //   `Now playing: \`${this.audioPlayer.state.resource.metadata.title}\``
          // ),
        ],
      });
    }
  }

  async play(url) {
    const info = await getInfo(url);

    if (info) {
      const stuff = ytdl(url, { filter: "audioonly" });
      const rs = createAudioResource(stuff, {
        metadata: {
          title: info.videoDetails.title,
          url: url,
        },
      });
      this.enqueue(rs);
    }

    // if (info) {
    //   const process = raw(
    //     url,
    //     {
    //       o: "-",
    //       q: "",
    //       f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
    //       r: "100K",
    //     },
    //     { stdio: ["ignore", "pipe", "ignore"] }
    //   );
    //   if (!process.stdout) {
    //     console.error("No stdout");
    //     return false;
    //   }
    //   const stream = process.stdout;
    //   process
    //     .once("spawn", () => {
    //       demuxProbe(stream)
    //         .then((probe) => {
    //           const resource = createAudioResource(probe.stream, {
    //             metadata: {
    //               title: info.videoDetails.title,
    //             },
    //             inputType: probe.type,
    //           });
    //           this.enqueue(resource);
    //         }
    //         )
    //         .catch(console.error);
    //     })
    //     .catch(error => console.error('Error in stream process(prob skipped or stopped)'));
    //   return true;
    // } else return false;
  }

  stop() {
    this.queue = [];
    this.audioPlayer.stop(true);
    this.mchannel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setColor("FUCHSIA")
          .setDescription("Stopped and cleared queue!"),
      ],
    });
  }

  leave() {
    this.audioPlayer.stop(true);
    this.connection.destroy();
  }

  skip() {
    if (this.queue.length === 0) {
      this.audioPlayer.stop(true);
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_GOLD")
            .setDescription("Stopped because there was nothing in the queue!"),
        ],
      });
    } else {
      const resource = this.queue.shift();
      this.audioPlayer.play(resource);
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_GOLD")
            .addField(
              "Skipped and now playing: ",
              `[${this.audioPlayer.state.resource.metadata.title}](${this.audioPlayer.state.resource.metadata.url})`
            ),
        ],
      });
    }
  }
}

module.exports = {
  MusicBot,
};
