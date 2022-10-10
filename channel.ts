import https from "https"
import { writeFileSync } from "fs"
import ms from "ms"
import { YTData, file, Log, hookedit, sendLiveEmbed, config } from "./base"


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

            if (!data || !data[0]) return
            var video = data.sort((x, y) => x.startTime! - y.startTime!)[0]

            video.author = str.match(/{"channelMetadataRenderer":{"title":"(.*?)","description"/)[1]
            video.avatar = str.match(/avatar":{"thumbnails":\[{"url":"(.*?)-c-k-c0x00ffffff-no-rj"/)[1]
            video.channelId = row.channelId
            if (video.startTime == null) video.startTime = Date.now()
            if (!row.videoId) row.videoId == video.videoId
            video.webhookUrl = row.webhookUrl ?? ""
            if (video.avatar != row.avatar) hookedit(video)
            if (row.videoId != video.videoId) {
                if (video.status == 'LIVE' && row.status != 'LIVE') sendLiveEmbed(video, `突發直播`, `開台時間`, config.DiscorduserId)
                else if (video.status == 'UPCOMING' && row.status == 'DEFAULT') sendLiveEmbed(video, `新待機台`, `排定開台時間`)
                config.Data[i] = video
                writeFileSync(file, JSON.stringify(config, null, 4), 'utf-8')
            }
        }).on('error', e => {
            writeFileSync(`./log/${row.channelId}Error.log`, JSON.stringify(e), 'utf-8')
            Log.error(e)
        })
    })
}