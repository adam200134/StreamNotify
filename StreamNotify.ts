import { readFileSync } from "fs"
import ms from "ms"
import { config, Config, file } from "./base"
import { videoCheck } from "./video"


setInterval(YTStreamUpdate, ms(config.Timer))
YTStreamUpdate()

function YTStreamUpdate() {
    (<Config>JSON.parse(readFileSync(file, 'utf-8'))).Data
        .forEach((row, i) => videoCheck(row, i))
}