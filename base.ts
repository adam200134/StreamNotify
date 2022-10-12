import { EmbedBuilder, WebhookClient } from "discord.js";
import { writeFileSync, existsSync, readFileSync } from "fs";
import "colors"

export class Log {
    static info(message: string) {
        Log.log(message.yellow);
    }
    static warn(message: string) {
        Log.log(message.magenta);
    }
    static error(error: any) {
        Log.log(JSON.stringify(error).red);
    }
    static debug(message: any) {
        Log.log(message.green);
    }
    static data(file: string, value: any) {
        writeFileSync(`./logger/${file}.log.json`, JSON.stringify(value), 'utf-8')
    }
    static tip(message: string) {
        Log.log(message.cyan);
    }
    static log(message: any) {
        console.log(message);
    }
}
export class YTData {
    public author?= "Nemesis ch. 涅默"
    public avatar?= ""
    public channelId?= "UCFiIsVOC1p_gfTYDYXXfl4g"
    public title = ""
    public videoId = ""
    public status: 'LIVE' | 'UPCOMING' | 'DEFAULT' = 'DEFAULT'
    public startTime = null
    public webhookUrl?= ""
}
export class Config {
    private tip = true
    public DiscorduserId: string | number = ""
    public Timer: string = "5m"
    public schedules = false
    public Data: YTData[] = [new YTData()]
    constructor() {
        if (!existsSync(file)) {
            writeFileSync(file, JSON.stringify(this, null, 4), { encoding: 'utf-8' })
        }
        var config = <Config>JSON.parse(readFileSync(file, 'utf-8'));
        this.schedules = Boolean(config.schedules)
        this.tip = Boolean(config.tip)
        this.DiscorduserId = config.DiscorduserId ?? ""
        if (typeof config.Timer == 'string' && config.Timer != "") this.Timer = config.Timer
        if (Array.isArray(config.Data) && config.Data.length > 0) this.Data = config.Data
        if (config.tip) {
            Log.tip(`在 ${process.cwd()}\\${file} :`)
            Log.tip(` - 將tip的值改為 false 關閉提示`)
            Log.tip(` - 將schedules的值改為 true 啟用時間表`)
            Log.log(` - 可在Data中新增 {channelId:"YT頻道ID"} `.cyan + `(只有DD才用的到這功能)`.cyan.strikethrough)
            Log.tip(`在Discord接收直播信息 :`)
            Log.tip(` - 建立webhook並複製URL填入webhookUrl中`)
            Log.tip(` - 不建議多個頻道共用一個webhook`)
            Log.info(`注意 : webhookUrl外流可能會導致有人傳垃圾訊息給你`.underline)
            Log.debug(`\n有發現BUG 歡迎在DC私訊 "夏目#2001"`)
            Log.debug(`頻道有更新會發到這裡`)
            Log.debug(`默默的YT我已經預設好ㄌ`.underline)
        }
        return this
    }
}
export interface VideoData {
    title: {
        simpleText: string
    },
    ownerProfileUrl: string
    externalChannelId: string
    ownerChannelName: string
    liveBroadcastDetails: {
        isLiveNow: boolean
        startTimestamp: string
        endTimestamp?: string
    }
}

export const file = 'config.json'
export const config = new Config()

export function sendLiveEmbed(row: YTData, i: number, statusLable: string, timeLable: string, uid?: string | number) {
    const url = 'https://www.youtube.com/watch?v=' + row.videoId
    Log.info('頻道' + row.author + '更新狀態 : ' + statusLable)
    Log.info('標題 : ' + row.title)
    Log.info('網址 : ' + url)
    config.Data[i] = row
    writeFileSync(file, JSON.stringify(config, null, 4), 'utf-8')
    if (row.webhookUrl == '' || !row.webhookUrl.startsWith('https://discord.com/api/webhooks')) return
    const hook = new WebhookClient({ url: row.webhookUrl })
    if (!hook) return
    var eb = [new EmbedBuilder().setTitle(`${row.title}`).setURL(url).setColor('Red')
        .addFields({ name: `${row.author}`, value: `[Link](https://www.youtube.com/channel/${row.channelId})`, inline: true })
        .addFields({ name: `目前狀態`, value: `${statusLable}`, inline: true })
        .addFields({ name: `${timeLable}`, value: `<t:${row.startTime}:F>(<t:${row.startTime}:R>)` })
        .setImage(`https://i.ytimg.com/vi/${row.videoId}/maxresdefault.jpg`)]
    typeof uid == 'string' && uid != "" ? hook.send({ content: `<@${uid}>`, embeds: eb }) : hook.send({ embeds: eb })

}

export function hookedit(row: YTData) {
    if (row.webhookUrl == '' || !row.webhookUrl.startsWith('https://discord.com/api/webhooks')) return
    const hook = new WebhookClient({ url: row.webhookUrl })
    if (hook) hook.edit({ name: row.author, avatar: row.avatar })
}