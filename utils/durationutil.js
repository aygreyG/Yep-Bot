module.exports = {
  toLengthSeconds(stringduration) {
    if (stringduration) {
      const lengtharray = stringduration.split(":");
      if (lengtharray.length > 3) return -1;
      let length = 0;
      for (let i = 0; i < lengtharray.length; i++) {
        length += parseInt(lengtharray[i]) * 60 ** (lengtharray.length - 1 - i);
      }
      return length;
    }
    return -1;
  },

  toDurationString(length, strlength = 0) {
    if (length === -1) return "-1";
    const date = new Date(length * 1000).toUTCString().split(" ")[4];
    if (parseInt(date.split(":")[0]) > 0 || strlength === 3) {
      return date;
    } else if (parseInt(date.split(":")[1]) > 0 || strlength === 2) {
      return date.slice(3);
    } else return date.slice(6);
  },
};
