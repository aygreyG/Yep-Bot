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
const { exec } = require("youtube-dl-exec");
const ytsr = require("ytsr");
const fs = require("fs");
const ytpl = require("ytpl");

/**
 * Class of the Track implementation.
 * It stores the url, title and thumbnail of the video.
 */
class Track {
  constructor(url, title, thumb) {
    this.url = url;
    this.title = title;
    this.thumb = thumb;
  }
}

/**
 * Class of the musicBot implementation.
 * This includes all the methods that are needed, (play, stop, pause... etc).
 *
 */
class MusicBot {
  /**
   * Creates a new MusicBot.
   * @param {Discord.VoiceChannel} channel
   * @param {Discord.TextBasedChannels} mchannel
   */
  constructor(channel, mchannel) {
    // Automatically joins the voice channel on creation
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    this.mchannel = mchannel;
    this.channel = channel;
    // creates a new audio player for itself
    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    // This queue contains all the unused tracks
    this.queue = [];
    this.autoplay = false;
    this.repeat = false;
    this.skip = false;

    // this.connection.on('stateChange', (oldState, newState) => {
    //   console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
    // });

    // When the connection is ready it subscribes to the audioplayer
    this.connection.on(VoiceConnectionStatus.Ready, () => {
      // console.log("Connected to audioPlayer");
      this.connection.subscribe(this.audioPlayer);
    });

    this.audioPlayer.on("error", (error) => {
      console.error(error);
    });

    // This is responsible for autoplay and playing the next song in the queue
    this.audioPlayer.on("stateChange", async (oldState, newState) => {
      if (
        oldState.status == AudioPlayerStatus.Idle &&
        newState.status == AudioPlayerStatus.Playing
      ) {
        this.skip = false;
      }
      if (newState.status == AudioPlayerStatus.Idle) {
        // console.log(oldState.status + "\n" + this.repeat + "  " + this.skip);
        if (this.repeat && !this.skip) {
          if (oldState.status == AudioPlayerStatus.Playing) {
            const track = new Track(
              oldState.resource.metadata.url,
              oldState.resource.metadata.title,
              oldState.resource.metadata.thumb
            );

            this.playTrack(track);
            return;
          }
        }
        this.skip = false;
        const play = this.queue.shift();
        if (play) {
          this.playTrack(play);

          this.mchannel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("DARK_VIVID_PINK")
                .setThumbnail(play.thumb)
                .addField("Now playing: ", `[${play.title}](${play.url})`),
            ],
          });
        } else if (this.autoplay) {
          // if it was playing and there is no more song in the queue,
          // then it gets the last song's related_videos and creates a new track
          // (tries 15 times to find a track from the first 6 videos
          //  that is less than 15 mins long and is not a live version)
          if (oldState.status == AudioPlayerStatus.Playing) {
            const info = await getInfo(oldState.resource.metadata.url);
            let rand = Math.floor(Math.random() * 5);
            let maxtry = 15;
            while (
              (info.related_videos[rand].isLive ||
                info.related_videos[rand].title
                  .toLowerCase()
                  .includes("live") ||
                info.related_videos[rand].length_seconds > 900) &&
              maxtry != 0
            ) {
              rand = Math.floor(Math.random() * 5);
              maxtry--;
            }
            const track = new Track(
              "https://www.youtube.com/watch?v=" + info.related_videos[rand].id,
              info.related_videos[rand].title,
              info.related_videos[rand].thumbnails[
                info.related_videos[rand].thumbnails.length - 1
              ].url
            );

            this.playTrack(track);

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

    // if it disconnects it checks if it might have been because of a channel change
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

  /**
   * It queues or plays the track depending on the state of the queue.
   * @param {Track} track The track that needs to be queued.
   */
  enqueue(track, embed = true) {
    if (
      this.queue.length > 0 ||
      this.audioPlayer.state.status == AudioPlayerStatus.Playing
    ) {
      this.queue.push(track);
      if (embed) {
        this.mchannel.send({
          embeds: [
            new Discord.MessageEmbed()
              .setColor("DARK_BUT_NOT_BLACK")
              .setThumbnail(track.thumb)
              .addField("Queued: ", `[${track.title}](${track.url})`),
          ],
        });
      }
    } else {
      this.playTrack(track);

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

  /**
   * Makes a resource from the track and plays it.
   * @param {Track} track
   * @returns If it can't play the song.
   */
  playTrack(track) {
    const process = exec(
      track.url,
      {
        o: "-",
        q: "",
        f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio",
        r: "100K",
      },
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    if (!process.stdout) {
      console.error("No stdout");
      return;
    }
    const stream = process.stdout;
    process
      .once("spawn", () => {
        demuxProbe(stream)
          .then((probe) => {
            const resource = createAudioResource(probe.stream, {
              metadata: {
                title: track.title,
                url: track.url,
                thumb: track.thumb,
              },
              inputType: probe.type,
            });
            this.audioPlayer.play(resource);
          })
          .catch(console.error);
      })
      .catch((error) => {
        // if it wasn't a skip then it should send a message to let people know
        if (!error.shortMessage.includes("ERR_STREAM_PREMATURE_CLOSE")) {
          this.mchannel.send({
            embeds: [
              new Discord.MessageEmbed()
                .setColor("RED")
                .setTitle("Playback error!")
                .setDescription(
                  "Music playback stopped unexpectedly, please try again!"
                ),
            ],
          });
          console.error("Playback error: \n" + error.message);
        }
        // if it was a skip it shouldn't spam to the console
        else
          console.error(
            `Guild name: ${this.channel.guild.name}. Error in stream process(probably skipped or stopped)`
          );
      });
  }

  /**
   * Gets info about the given url and if it is playable then tries to queue it.
   * @param {String} url The URL of the video that needs to be played.
   * @returns If the url is not playable.
   */
  async playUrl(url) {
    try {
      const info = await getInfo(url);

      if (info) {
        // console.log("eljut ide");
        // fs.writeFile("./info.json","Data\n" + JSON.stringify(info.videoDetails), "utf8",() => console.log("Written to info file!"));
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
  }

  /**
   * Searches for a playlist with ytpl, and queues the songs.
   * @param {string} searchString The playlist's url or a song's url that's in a playlist.
   * @param {string} id The id of the user who called this function.
   */
  async playlistSearch(searchString, id) {
    try {
      const playlist = await ytpl(searchString);
      // fs.writeFile("./playlist.json", JSON.stringify(playlist), "utf8", () => console.log("playlist written"));
      const embed = new Discord.MessageEmbed()
        .setColor("BLURPLE")
        .setThumbnail(playlist.bestThumbnail.url)
        .setTitle("**Choose what you would like to do with this playlist:**")
        .setDescription(
          playlist.title + ", song count: " + playlist.estimatedItemCount
        )
        .addFields([
          { name: "1", value: "Queue all songs" },
          {
            name: "2",
            value: "Choose a song from the playlist (not implemented yet)",
          },
          { name: "X", value: "Cancel" },
        ]);

      const row = new Discord.MessageActionRow().addComponents([
        new Discord.MessageButton()
          .setCustomId("1")
          .setLabel("1")
          .setStyle("PRIMARY"),
        new Discord.MessageButton()
          .setCustomId("2")
          .setLabel("2")
          .setStyle("PRIMARY")
          .setDisabled(true),
        new Discord.MessageButton()
          .setCustomId("X")
          .setLabel("X")
          .setStyle("DANGER"),
      ]);

      const msg = await this.mchannel.send({
        embeds: [embed],
        components: [row],
      });

      const collector = msg.createMessageComponentCollector({
        componentType: "BUTTON",
        time: 60000,
      });

      collector.on("collect", (i) => {
        if (i.user.id === id) {
          switch (i.customId) {
            case "X":
              const cancEmbed = new Discord.MessageEmbed()
                .setColor("DARK_RED")
                .setDescription("You cancelled.");
              i.reply({ embeds: [cancEmbed], ephemeral: true });
              break;
            case "1":
              const queueEmbed = new Discord.MessageEmbed()
                .setColor("DARK_GREEN")
                .setDescription("Playlist is queued.");
              i.reply({ embeds: [queueEmbed], ephemeral: false });
              if (
                this.queue.length > 0 ||
                this.audioPlayer.state.status == AudioPlayerStatus.Playing
              ) {
                playlist.items.forEach((item) => {
                  this.enqueue(
                    new Track(
                      item.url.split("&list")[0],
                      item.title,
                      item.bestThumbnail.url
                    ),
                    false
                  );
                });
              } else {
                playlist.items.forEach((item, index) => {
                  if (index == 0) {
                    // console.log(item.url.split("&list")[0]);
                    this.enqueue(
                      new Track(
                        item.url.split("&list")[0],
                        item.title,
                        item.bestThumbnail.url
                      ),
                      false
                    );
                  } else {
                    // console.log(item.url.split("&list")[0]);
                    this.queue.push(
                      new Track(
                        item.url.split("&list")[0],
                        item.title,
                        item.bestThumbnail.url
                      )
                    );
                  }
                });
              }
              break;
            case "2":
              collector.stop("two");
              break;
            default:
              break;
          }
          collector.stop();
        } else {
          const cantEmbed = new Discord.MessageEmbed()
            .setColor("RED")
            .setDescription("You can't choose now!");
          i.reply({ embeds: [cantEmbed], ephemeral: true });
        }
      });

      collector.on("end", (collected, reason) => {
        row.components.forEach((component) => {
          component.setDisabled(true);
        });
        msg.edit({ components: [row] });
        if (reason === "two") {
          //TODO: uj row es stb...
          embed.spliceFields(0, 3);
          embed.addField("Not yet implemented", "Sadge");
          msg.edit({ embeds: [embed] });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Searches for a song and if it was a play command it queues it,
   * if it was a search command it gives you 4 options to choose from.
   * @param {String} searchString The title of the song to search for.
   * @param {Boolean} queueIt True if it should be autoqueued, false otherwise.
   */
  async searchTrack(searchString, queueIt, id) {
    try {
      // setting up a filter to use as a url
      const filters1 = await ytsr.getFilters(searchString);
      const filter1 = filters1.get("Type").get("Video");
      // const filters2 = await ytsr.getFilters(filter1.url);
      // const filter2 = filters2.get("Sort by").get("View count");
      // If you want your search to be sorted by view count, you can uncomment the previous two lines and change the ytsr url to the filter2 url.
      // getting 15 videos
      const videos = await ytsr(filter1.url, {
        limit: 15,
      });

      // if it was a play command it should queue it automatically
      if (videos.items.length > 0 && queueIt) {
        const track = new Track(
          videos.items[0].url,
          videos.items[0].title,
          videos.items[0].bestThumbnail.url
        );
        this.enqueue(track);
        // if it was a search it should give you options to choose from (now it is 4 options)
      } else if (videos.items.length > 0 && !queueIt && id != undefined) {
        const searchEmbed = new Discord.MessageEmbed()
          .setColor("AQUA")
          .setTitle("**Choose a song that is good for you!**");

        let mindex = 0;
        let notLiveVideos = [];
        videos.items.some((vid) => {
          if (!vid.isLive && !vid.isUpcoming) {
            const dur = vid.duration.split(":");
            if (dur.length == 3 && parseInt(dur[0]) > 3) {
              return;
            }
            searchEmbed.addField(
              (++mindex).toString(),
              `[${vid.title}](${vid.url})`
            );
            notLiveVideos.push(vid);
          }
          if (mindex === 4) return true;
        });

        const row = new Discord.MessageActionRow();
        for (let i = 1; i <= mindex; i++) {
          row.addComponents([
            new Discord.MessageButton()
              .setCustomId(String(i))
              .setLabel(String(i))
              .setStyle("PRIMARY"),
          ]);
        }
        row.addComponents([
          new Discord.MessageButton()
            .setCustomId("X")
            .setLabel("X")
            .setStyle("DANGER"),
        ]);

        const msg = await this.mchannel.send({
          embeds: [searchEmbed],
          components: [row],
        });

        const collector = msg.createMessageComponentCollector({
          componentType: "BUTTON",
          time: 60000,
        });

        collector.on("collect", (i) => {
          if (i.user.id === id) {
            switch (i.customId) {
              case "X":
                const cancEmbed = new Discord.MessageEmbed()
                  .setColor("DARK_RED")
                  .setDescription("You cancelled this search.");
                i.reply({ embeds: [cancEmbed], ephemeral: true });
                break;
              default:
                const num = parseInt(i.customId) - 1;
                const track = new Track(
                  notLiveVideos[num].url,
                  notLiveVideos[num].title,
                  notLiveVideos[num].bestThumbnail.url
                );
                this.enqueue(track);
                const playEmbed = new Discord.MessageEmbed()
                  .setColor("GREEN")
                  .setDescription(`You choose: ${num + 1}. ${track.title}`);
                i.reply({ embeds: [playEmbed], ephemeral: true });
                break;
            }
            collector.stop();
          } else {
            const cantEmbed = new Discord.MessageEmbed()
              .setColor("RED")
              .setDescription("You can't pick a song now!");
            i.reply({ embeds: [cantEmbed], ephemeral: true });
          }
        });

        collector.on("end", (collected, reason) => {
          row.components.forEach((component) => {
            component.setDisabled(true);
          });
          msg.edit({ components: [row] });
        });
      }
    } catch (e) {
      console.error(e);
      const errEmbed = new Discord.MessageEmbed()
        .setColor("RED")
        .setDescription(
          "Couldn't find music, or there was an error looking it up."
        );
      this.mchannel.send({ embeds: [errEmbed] });
    }
  }

  /**
   * Stops the playback, clears the queue and turns off autoplay.
   */
  stop() {
    this.autoplay = false;
    this.repeat = false;
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

  /**
   * Destroys the musicbot.
   */
  leave() {
    this.autoplay = false;
    this.queue = [];
    this.audioPlayer.stop(true);
    this.connection.destroy();
  }

  /**
   * Turns on or off autoplay.
   */
  autoPlay() {
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
  }

  /**
   * Skips or stops the playback depending on the state of the queue.
   */
  skipMusic() {
    this.skip = true;
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
    }
  }

  pause() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("YELLOW")
            .setThumbnail(this.audioPlayer.state.resource.metadata.thumb)
            .addField(
              "Paused:",
              `[${this.audioPlayer.state.resource.metadata.title}](${this.audioPlayer.state.resource.metadata.url})`
            ),
        ],
      });
      this.audioPlayer.pause(true);
    }
  }

  resume() {
    this.audioPlayer.unpause();
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("DARK_NAVY")
            .setThumbnail(this.audioPlayer.state.resource.metadata.thumb)
            .addField(
              "Resumed:",
              `[${this.audioPlayer.state.resource.metadata.title}](${this.audioPlayer.state.resource.metadata.url})`
            ),
        ],
      });
    }
  }

  /**
   * Sends an embed which contains the queue to the assigned message channel.
   */
  async queuePrint() {
    if (this.queue.length === 0) {
      const embed = new Discord.MessageEmbed()
        .setColor("RED")
        .setDescription("The queue is empty!");
      this.mchannel.send({ embeds: [embed] });
    } else {
      const embed = new Discord.MessageEmbed()
        .setColor("WHITE")
        .setTitle("**The queue is:**");
      const maxnum = 5;
      if (this.queue.length > maxnum) {
        let allpages = Math.ceil(this.queue.length / maxnum);
        let currpage = 1;
        embed.setFooter({ text: `Page: ${currpage}/${allpages}` });

        const row = new Discord.MessageActionRow().addComponents([
          new Discord.MessageButton()
            .setCustomId("1")
            .setLabel("PREVIOUS")
            .setStyle("SUCCESS"),
          new Discord.MessageButton()
            .setCustomId("2")
            .setLabel("NEXT")
            .setStyle("SUCCESS"),
          new Discord.MessageButton()
            .setCustomId("X")
            .setLabel("X")
            .setStyle("DANGER"),
        ]);

        let index = 0;
        for (const track of this.queue) {
          if (index + 1 <= maxnum) {
            embed.addField(
              (index + 1).toString(),
              `[${track.title}](${track.url})`
            );
            index++;
          } else break;
        }

        const msg = await this.mchannel.send({
          embeds: [embed],
          components: [row],
        });

        const collector = msg.createMessageComponentCollector({
          componentType: "BUTTON",
          time: 90000,
        });

        collector.on("collect", (i) => {
          switch (i.customId) {
            case "1":
              if (currpage == 1) {
                const nolessEmbed = new Discord.MessageEmbed()
                  .setColor("DARK_RED")
                  .setDescription("There is no previous page!");
                i.reply({
                  embeds: [nolessEmbed],
                  ephemeral: true,
                });
              } else {
                allpages = Math.ceil(this.queue.length / maxnum);
                currpage--;
                embed.setFields([]);
                embed.setFooter({ text: `Page: ${currpage}/${allpages}` });
                index = 0;
                for (const track of this.queue) {
                  if (
                    index + 1 - (currpage - 1) * maxnum <= maxnum &&
                    index + 1 - (currpage - 1) * maxnum > 0
                  ) {
                    embed.addField(
                      (index + 1).toString(),
                      `[${track.title}](${track.url})`
                    );
                  }
                  index++;
                }
                msg.edit({ embeds: [embed] });
                i.deferReply();
                i.deleteReply();
              }
              break;
            case "2":
              if (currpage == allpages) {
                const nopagesEmbed = new Discord.MessageEmbed()
                  .setColor("DARK_RED")
                  .setDescription("There are no more pages!");
                i.reply({
                  embeds: [nopagesEmbed],
                  ephemeral: true,
                });
              } else {
                allpages = Math.ceil(this.queue.length / maxnum);
                currpage++;
                // embed.spliceFields(0, this.queue.length - currpage * maxnum);
                embed.setFields([]);
                embed.setFooter({ text: `Page: ${currpage}/${allpages}` });
                index = 0;
                for (const track of this.queue) {
                  if (
                    index + 1 - (currpage - 1) * maxnum <= maxnum &&
                    index + 1 - (currpage - 1) * maxnum > 0
                  ) {
                    embed.addField(
                      (index + 1).toString(),
                      `[${track.title}](${track.url})`
                    );
                  }
                  index++;
                }
                msg.edit({ embeds: [embed] });
                i.deferReply();
                i.deleteReply();
              }
              break;
            case "X":
              i.deferReply();
              i.deleteReply();
              collector.stop();
              break;
            default:
              break;
          }
        });

        collector.on("end", (collected, reason) => {
          row.components.forEach((component) => {
            component.setDisabled(true);
          });
          msg.edit({ components: [row] });
        });
      } else {
        this.queue.forEach((track, index) => {
          embed.addField(
            (index + 1).toString(),
            `[${track.title}](${track.url})`
          );
        });
        this.mchannel.send({ embeds: [embed] });
      }
    }
  }

  /**
   *
   * @param {string} mystring
   * @param {Boolean} isIndex
   */
  deleteFromQueue(mystring, isIndex = false) {
    let deleted = Track;
    if (isIndex) {
      if (parseInt(mystring) <= this.queue.length && parseInt(mystring) > 0) {
        deleted = this.queue[parseInt(mystring) - 1];
        this.queue.splice(parseInt(mystring) - 1, 1);
      }
    } else {
      let index = -1;
      const mystring1 = mystring.toLowerCase();
      let tracktitle = "";
      this.queue.forEach((track) => {
        tracktitle = track.title.toLowerCase();
        if (tracktitle.includes(mystring1)) {
          if (index == -1) {
            index = this.queue.indexOf(track);
          }
        }
      });
      if (index != -1) {
        deleted = this.queue[index];
        this.queue.splice(index, 1);
      }
    }
    if (deleted.title != undefined || deleted.url != undefined) {
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("GREEN")
            .addField(
              "**Succesfully deleted from queue:**",
              `[${deleted.title}](${deleted.url})`
            )
            .setThumbnail(deleted.thumb),
        ],
      });
    }
  }

  /**
   * Turns on and off the repeat function.
   */
  repeatChange() {
    if (this.repeat) {
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("YELLOW")
            .setDescription("Repeat is now disabled!"),
        ],
      });
      this.repeat = false;
    } else {
      this.mchannel.send({
        embeds: [
          new Discord.MessageEmbed()
            .setColor("WHITE")
            .setDescription("Repeat is now enabled!"),
        ],
      });
      this.repeat = true;
    }
  }
}

module.exports = {
  MusicBot,
};
