import https from "https"
import { writeFileSync } from "fs"
import ms from "ms"
import { YTData, VideoData, file, Log, hookedit, sendLiveEmbed, config } from "./base"
import { channelCheck } from "./channel"

export function videoCheck(row: YTData, i: number) {
    if (!row.videoId || row.videoId == "") {
        channelCheck(row, i)
        row = config.Data[i]
    }
    https.get(`https://www.youtube.com/watch?v=${row.videoId}`, res => {
        var str = ''
        res.on('data', chunk => str += chunk).once('end', _ => {
            var Renderer = str.match(/matRenderer":{(.*?)},"u/)
            if (!Renderer) return
            var data: VideoData = JSON.parse(Renderer[0].slice(13, -3) + '}')
            if (row.author != data.ownerChannelName) {
                row.author = data.ownerChannelName
                hookedit(row)
            }
            var live = data.liveBroadcastDetails, rowTime = row.startTime
            var liveTime = new Date(live.startTimestamp).getTime() / 1000
            if (row.status == 'UPCOMING')
                if (rowTime != liveTime) {
                    row.startTime = liveTime
                    sendLiveEmbed(row, `待機台更新`, `更新開台時間`)
                }

            row.startTime = liveTime
            if (liveTime > Date.now() && liveTime < Date.now() + ms('5m')) {
                sendLiveEmbed(row, `直播即將開始`, `開台時間`, config.DiscorduserId)
            }

            if (live.isLiveNow) {
                if (row.status == 'UPCOMING') {
                    row.status = 'LIVE'
                    sendLiveEmbed(row, `正在開台`, `開台時間`, config.DiscorduserId)
                }
            } else if (live.endTimestamp) {
                if (row.status == 'LIVE') {
                    row.status = 'DEFAULT'
                    sendLiveEmbed(row, `已關台`, `關台時間`)
                }
            }
            config.Data[i] = row
            writeFileSync(file, JSON.stringify(config, null, 4), 'utf-8')
            channelCheck(row, i)
        }).on('error', e => {
            writeFileSync(`./log/${row.videoId}Error.log`, JSON.stringify(e), 'utf-8')
            Log.error(e)
        })
    })
}