/**
 * Class of the Track implementation.
 * It stores the url, title and thumbnail of the video.
 */
module.exports = class Track {
  constructor(url, title, thumb, length = -1) {
    this.url = url;
    this.title = title;
    this.thumb = thumb;
    this.length = length;
  }
}