#!/bin/bash
echo "{ \"prefix\": \"-\",\
    \"token\": \"$1\",\
    \"minecraftIp\": \"ipaddresscuccli\",\
    \"minecraftPort\": \"'your-port(optional)'\",\
    \"progressEmote\": \"'<:KEKW:939654557565349939>'\"\
}" > pv/config.json

node dcbot.js