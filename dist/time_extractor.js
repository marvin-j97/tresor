"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TimeUnit;
(function (TimeUnit) {
    TimeUnit["ms"] = "ms";
    TimeUnit["sec"] = "sec";
    TimeUnit["min"] = "min";
    TimeUnit["hour"] = "hour";
    TimeUnit["day"] = "day";
})(TimeUnit || (TimeUnit = {}));
const timeValues = {
    ms: 1,
    sec: 1000,
    min: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000
};
const timeAliases = {
    ms: TimeUnit.ms,
    milli: TimeUnit.ms,
    millisecond: TimeUnit.ms,
    milliseconds: TimeUnit.ms,
    s: TimeUnit.sec,
    sec: TimeUnit.sec,
    secs: TimeUnit.sec,
    second: TimeUnit.sec,
    seconds: TimeUnit.sec,
    m: TimeUnit.min,
    min: TimeUnit.min,
    mins: TimeUnit.min,
    minute: TimeUnit.min,
    minutes: TimeUnit.min,
    h: TimeUnit.hour,
    hour: TimeUnit.hour,
    hours: TimeUnit.hour,
    d: TimeUnit.day,
    day: TimeUnit.day,
    days: TimeUnit.day
};
const keys = Object.keys(timeAliases);
const keyRegexFragment = `(${keys.join("|")})`;
const timeRegex = new RegExp(`^(\\d+(\\.\\d+)?)\\s*${keyRegexFragment}$`, "i");
function parseDuration(val) {
    if (typeof val == "number")
        return val;
    if (timeRegex.test(val)) {
        let amount, unit;
        if (val.includes(" ")) {
            const parts = val.split(" ");
            amount = parseFloat(parts[0]);
            unit = timeAliases[parts[1]];
        }
        else {
            amount = parseFloat(val);
            unit = timeAliases[val.replace(amount.toString(), "")];
        }
        const msPerUnit = timeValues[unit];
        return amount * msPerUnit;
    }
    else
        throw `Invalid duration string '${val}'`;
}
exports.parseDuration = parseDuration;
