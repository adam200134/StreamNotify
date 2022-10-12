import https from "https"
import { writeFileSync } from "fs"
import ms from "ms"
import { YTData, file, Log, hookedit, sendLiveEmbed, config, VideoData } from "./base"

export function channelCheck(row: YTData, i: number) {
    https.get(`https://www.youtube.com/channel/${row.channelId}/videos?view=57`, res => {
        var str = ''
        res.on('data', chunk => str += chunk).once('end', _ => {
            var data = (<YTData[]>[...new Set(str.match(/ideoRenderer":(.*?),{"thumbnailOverlayToggle/g))]
                .map(x => JSON.parse(x.slice(14, -25) + ']}')).map(x => ({
                    title: x.title.runs[0].text, videoId: x.videoId,
                    status: x.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer.style,
                    startTime: Number(x.upcomingEventData?.startTime)
                }))).filter(x => ['UPCOMING', 'LIVE'].includes(x.status) && (config.schedules || x.startTime * 1000 < Date.now() + ms('50d')))

            if (!data || !data[0]) return videoCheck(row, i)

            var video = data.sort((x, y) => x.startTime - y.startTime)[0]

            video.author = str.match(/{"channelMetadataRenderer":{"title":"(.*?)","description"/)[1]
            video.avatar = str.match(/avatar":{"thumbnails":\[{"url":"(.*?)=s48-c-k-c0x00ffffff-no-rj"/)[1]
            video.channelId = row.channelId
            video.webhookUrl = row.webhookUrl

            if (video.avatar != row.avatar || video.author != row.avatar) {
                hookedit(video)
            }

            if (video.status == 'LIVE' && row.status != 'LIVE') {
                if (video.startTime > 0) sendLiveEmbed(video, i, `正在開台`, `開台時間`, config.DiscorduserId)
                else {
                    video.startTime = Math.floor(Date.now() / 1000)
                    sendLiveEmbed(video, i, `突發直播`, `開台時間`, config.DiscorduserId)
                }

            } else if (video.status == 'UPCOMING') {
                if (row.status != 'UPCOMING') {
                    sendLiveEmbed(video, i, `新待機台`, `排定開台時間`)

                } else if (video.startTime != row.startTime) {
                    sendLiveEmbed(video, i, `待機台更新`, `更新開台時間`)
                }
            }
        })
    })
}

export function videoCheck(row: YTData, i: number) {
    if (!row.videoId) return
    https.get(`https://www.youtube.com/watch?v=${row.videoId}`, res => {
        var str = ''
        res.on('data', chunk => str += chunk).once('end', _ => {
            var Renderer = str.match(/matRenderer":{(.*?)},"u/)
            if (!Renderer) return
            var data: VideoData = JSON.parse(Renderer[0].slice(13, -3) + '}')
            var live = data.liveBroadcastDetails

            if (live.endTimestamp) {
                if (row.status != 'DEFAULT') {
                    row.startTime = live.endTimestamp
                    row.status = 'DEFAULT'
                    sendLiveEmbed(row, i, `已關台`, `關台時間`)
                }
            }
        }).on('error', e => {
            writeFileSync(`./log/${row.videoId}Error.log`, JSON.stringify(e), 'utf-8')
            Log.error(e)
        })
    })
}
