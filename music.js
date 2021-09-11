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

class Track {
  constructor(url, title, thumb) {
    this.url = url;
    this.title = title;
    this.thumb = thumb;
  }
}

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
    this.autoplay = false;
    // console.log(this.autoplay);

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

    this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
      // info.related_videos
      // if (this.autoplay) {
      //   const info = await getInfo(play);
      //   if (info.related_videos[0]) {
      //     console.log(info.related_videos[])
      //   }
      // }
    });

    this.audioPlayer.on("stateChange", async (oldState, newState) => {
      if (newState.status == AudioPlayerStatus.Idle) {
        const play = this.queue.shift();
        if (play) {
          const stuff = ytdl(play.url, {
            filter: "audioonly",
            highWaterMark: 1 << 26,
            dlChunkSize: 1 << 25,
          });
          const rs = createAudioResource(stuff, {
            metadata: {
              title: play.title,
              url: play.url,
            },
          });
          this.audioPlayer.play(rs);
          this.mchannel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("DARK_VIVID_PINK")
                .setThumbnail(play.thumb)
                .addField("Now playing: ", `[${play.title}](${play.url})`),
            ],
          });
        } else if (this.autoplay) {
          if (oldState.status == AudioPlayerStatus.Playing) {
            const info = await getInfo(oldState.resource.metadata.url);
            let rand = Math.floor(Math.random() * 10);
            let maxtry = 15;
            while (
              info.related_videos[rand].title.toLowerCase().includes("live") &&
              maxtry != 0
            ) {
              rand = Math.floor(Math.random() * 10);
              maxtry--;
            }
            const track = new Track(
              "https://www.youtube.com/watch?v=" + info.related_videos[rand].id,
              info.related_videos[rand].title,
              info.related_videos[rand].thumbnails[
                info.related_videos[rand].thumbnails.length - 1
              ].url
            );
            const stuff2 = ytdl(track.url, { filter: "audioonly" });
            const rs2 = createAudioResource(stuff2, {
              metadata: {
                title: track.title,
                url: track.url,
              },
            });
            this.audioPlayer.play(rs2);
            this.mchannel.send({
              embeds: [
                new Discord.MessageEmbed()
                  .setColor("DARK_VIVID_PINK")
                  .setThumbnail(track.thumb)
                  .addField("Now playing: ", `[${track.title}](${track.url})`),
              ],
            });
          }
        }
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

  enqueue(track) {
    // const stuff = ytdl(url, { filter: "audioonly" });
    // const rs = createAudioResource(stuff, {
    //   metadata: {
    //     title: info.videoDetails.title,
    //     url: url,
    //   },
    // });
    if (
      this.queue.length > 0 ||
      this.audioPlayer.state.status == AudioPlayerStatus.Playing
    ) {
      // console.log('The audio player has queued a song');
      this.queue.push(track);
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_BUT_NOT_BLACK")
            .setThumbnail(track.thumb)
            .addField("Queued: ", `[${track.title}](${track.url})`),
        ],
      });
    } else {
      // console.log('The audio player attemted to start a song');
      const stuff = ytdl(track.url, { filter: "audioonly" });
      const resource = createAudioResource(stuff, {
        metadata: {
          title: track.title,
          url: track.url,
        },
      });
      this.audioPlayer.play(resource);
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_VIVID_PINK")
            .setThumbnail(track.thumb)
            .addField("Now playing: ", `[${track.title}](${track.url})`),
          // .setDescription(
          //   `Now playing: \`${this.audioPlayer.state.resource.metadata.title}\``
          // ),
        ],
      });
    }
  }

  //TODO: managing livestreams and debugging the random stops in resources
  async play(url) {
    try {
      const info = await getInfo(url);

      if (info) {
        if (info.videoDetails.isLiveContent) {
          this.mchannel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("RED")
                .setDescription("Live content is not implemented yet!"),
            ],
          });
          return;
        }
        const track = new Track(
          url,
          info.videoDetails.title,
          info.videoDetails.thumbnails[
            info.videoDetails.thumbnails.length - 1
          ].url
        );
        this.enqueue(track);
      }
    } catch (e) {
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("RED")
            .setDescription("Couldn't find video!"),
        ],
      });
      console.error("no video found");
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
    this.autoplay = false;
    this.audioPlayer.stop(true);
    this.connection.destroy();
  }

  async autoPlay() {
    // console.log(this.autoplay);
    this.autoplay = !this.autoplay;
    this.mchannel.send({
      embeds: [
        new Discord.MessageEmbed()
          .setColor("DARK_GREEN")
          .setDescription(
            this.autoplay ? "Autoplay is on!" : "Autoplay is off!"
          ),
      ],
    });
    // if (this.audioPlayer.state.status === AudioPlayerStatus.Playing && this.autoplay) {
    //   const info = await getInfo(this.audioPlayer.state.resource.metadata.url);
    //   const track = new Track("https://www.youtube.com/watch?v=" + info.related_videos[0].id, info.related_videos[0].title, info.related_videos[0].thumbnails[info.related_videos[0].thumbnails.length-1]);
    //   this.enqueue(track);
    // }
  }

  skip() {
    if (this.queue.length === 0 && !this.autoplay) {
      this.audioPlayer.stop(true);
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_GOLD")
            .setDescription("Stopped because there was nothing in the queue!"),
        ],
      });
    } else {
      this.audioPlayer.stop(true);
      // this.mchannel.send({
      //   embeds: [
      //     new Discord.MessageEmbed()
      //       .setColor("DARK_GOLD")
      //       .addField(
      //         "Skipped and now playing: ",
      //         `[${this.audioPlayer.state.resource.metadata.title}](${this.audioPlayer.state.resource.metadata.url})`
      //       ),
      //   ],
      // });
    }
  }

  pause() {
    this.audioPlayer.pause(true);
  }

  resume() {
    this.audioPlayer.unpause();
  }

  async queuePrint() {
    if (this.queue.length === 0) {
      const embed = new Discord.MessageEmbed()
        .setColor("RED")
        .setDescription("The queue is empty!");
      this.mchannel.send({ embeds: [embed] });
    } else {
      const embed = new Discord.MessageEmbed()
        .setColor("WHITE")
        .setDescription("The queue is:");
      let queueNum = 1;
      this.queue.forEach((track) => {
        embed.addField(queueNum.toString(), `[${track.title}](${track.url})`);
        queueNum++;
      });
      this.mchannel.send({ embeds: [embed] });
    }
  }
}

module.exports = {
  MusicBot,
};
