const DISCORD_WEBHOOK = new URL('');
const DISCORD_TABLELAYOUT = 'ansi'; // 'ansi' or 'unicode'
const DISCORD_MAXEMBEDS = 5;
const CODPM_GAME = 'cod'; // cod, coduo, cod2, cod4
const CODPM_VERSION = 1.1;
const CONFIG_RENAME_EMPTY = 'Unnamed Server';
const CONFIG_MAPIMG_URL = new URL('/mp_maps/', 'https://cod.pm'); // NOTE: trailing slash

// /!\ END of configuration /!\

const CODPM_API = new URL(`/masterlist/${CODPM_GAME}/${CODPM_VERSION}`, 'https://api.cod.pm');
const GITHUB_API = new URL('/repos/cato-a/CODPM-MapImages/git/trees/main?recursive=1', 'https://api.github.com'); // map images

let updated = 0;

const mapimages = {
    'cod1+coduo': {'stock': [], 'custom': []},
    'cod2': {'stock': [], 'custom': []},
    'cod4': {'stock': [], 'custom': []}
};

function monotone(text)
{
    return text.replace(/\^(?:\^\d)?\d/g, '');
}

function truncate(text, maxlength, postfix)
{
    if(postfix === undefined)
        postfix = '...';

    if(text.length > maxlength)
        return text.substring(0, maxlength - postfix.length) + postfix;

    return text;
}

function ansicolorize(text, fg = 0, bg = 0, t1 = 0, t2) // syntax: <format>;<color>[;<format>][;<color>]
{ // https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06
    /*Format:
    0: Normal, 1: Bold, 4: Underline

    Foreground:
    30: Gray, 31: Red, 32: Green, 33: Yellow, 34: Blue, 35: Pink, 36: Cyan, 37: White

    Background:
    40: Firefly dark blue, 41: Orange, 42: Marble blue, 43: Greyish turquoise
    44: Gray, 45: Indigo, 46: Light gray, 47: White*/
    if(text !== undefined && (typeof text === 'string' || text instanceof String)) {
        const esc = '\u001b';
        let color = `[${t1};${bg}`; // syntax: [<t1>;<bg>;<t2>;<fg>m
        if(t2 !== undefined)
            color += `;${t2}`;
        color += `;${fg}m`;
        text = `${esc}${color}${text}${esc}[0m`;
    }

    return text;
}

function pad(text, start, end, pad = ' ')
{
    if(start !== undefined && end !== undefined)
        text = pad.repeat(start) + text + pad.repeat(end);

    return text;
}

function mapimage(mapimage)
{
    const game = CODPM_GAME == 'cod' || CODPM_GAME == 'coduo' ? 'cod1+coduo' : CODPM_GAME;
    if(mapimages[game].stock.indexOf(mapimage) !== -1)
        return CONFIG_MAPIMG_URL + game + '/stock/' + mapimage + '.png';

    if(mapimages[game].custom.indexOf(mapimage) !== -1)
        return CONFIG_MAPIMG_URL + game + '/custom/' + mapimage + '.png';

    return CONFIG_MAPIMG_URL + 'unknown.png';
}

(async () => {
    try {
        const github = await fetch(GITHUB_API, {"headers": {"Accept": "application/vnd.github.raw+json"}});
        if(github.ok && github.status == 200) {
            const rawj = await github.json();

            rawj.tree.forEach((element) => {
                const mapdata = element.path.match(/^(cod1\+coduo|cod[24])\/(stock|custom)\/(.+)\.png$/);
                if(mapdata === null)
                    return;

                const game = mapdata[1];
                const type = mapdata[2]; // stock|custom
                const mapname = mapdata[3];
                mapimages[game][type].push(mapname);
            });
        } else {
            console.error(`github.com server error: ${github.status} - ${github.statusText}`);
        }
    } catch(err) {
        console.error(`Unable to fetch ${GITHUB_API}:`, err);
    }

    setInterval((async () => {
        try { //const ignoresrvs = ['176.31.252.60:*', '157.90.181.156:9120'];
            const codpm = await fetch(CODPM_API, {"headers": {"Accept": "application/json"}});
            if(!codpm.ok || codpm.status != 200) {
                console.error(`cod.pm server error: ${codpm.status} - ${codpm.statusText}`);
                return;
            }

            const rawj = await codpm.json();
            if(rawj.masterlist_updated == updated)
                return;

            updated = rawj.masterlist_updated;
            let [globalplayers, globalservers, totalservers, mhlength, mplength, mglength, mmlength, mclength] = new Array(8).fill(0);
            const [hlength, plength, glength, mlength, clength] = [30, 5, 5, 16, 21];
            const parsedsrvs = new Array();

            for(let i = 0; i < rawj.servers.length; i++) {
                const server = rawj.servers[i];

                if(server.hidden > 0 || server.sv_maxclients > 72) // ignoresrvs.some((element) => element.match(new RegExp(`^${server.ip}:(?:\\*|${server.port})$`)))
                    continue;

                totalservers++;
                const players = server.playerinfo.length - server.bots;

                if(players > 0) {
                    globalplayers += players;
                    globalservers++;

                    if(globalservers > 10)
                        continue;

                    let sv_hostname = server.sv_hostname.replace(/[^\x20-\x7E]+/g, '').replace(/^\s+|\s+$|(\s)\1+/g, (m, c) => c ? c : '');
                    sv_hostname = truncate(monotone(sv_hostname), hlength).replace(/(discord)|`/ig, (m, c) => c ? 'disсord' : '`');
                    sv_hostname = !sv_hostname && CONFIG_RENAME_EMPTY ? CONFIG_RENAME_EMPTY : sv_hostname;
                    const mapname = monotone(server.mapname).toLowerCase();

                    const current = {
                        "ip": server.ip,
                        "port": server.port,
                        "sv_hostname": sv_hostname,
                        "clients": `${players}/${server.sv_maxclients}`,
                        "g_gametype": truncate(monotone(server.g_gametype), glength, '>').toLowerCase(),
                        "mapname": truncate(mapname.replace(/^[a-z]+_/, ''), mlength, '>'),
                        "connect": `${server.ip}:${server.port}`,
                        "country_isocode": server.country_isocode,
                        "mapimage": mapimage(mapname)
                    };

                    parsedsrvs.push(current);
                    if(current.sv_hostname.length > mhlength)
                        mhlength = current.sv_hostname.length;
                    if(current.clients.length > mplength)
                        mplength = current.clients.length;
                    if(current.g_gametype.length > mglength)
                        mglength = current.g_gametype.length;
                    if(current.mapname.length > mmlength)
                        mmlength = current.mapname.length;
                    if(current.connect.length > mclength)
                        mclength = current.connect.length;
                }
            }

            const payload_json = {"embeds": new Array()};
            let message = '';

            if(parsedsrvs.length > 0) {
                mhlength = Math.abs(hlength - mhlength);
                mplength = Math.abs(plength - mplength); 
                mglength = Math.abs(glength - mglength);
                mmlength = Math.abs(mlength - mmlength);
                mclength = Math.abs(clength - mclength);

                const offset = DISCORD_TABLELAYOUT == 'unicode' ? 0 : 2;
                const hwidth = 37 - offset - mhlength; // (hlength + 4 + 3) - offset - mhlength
                const dwidth = 30 - offset - mplength - mglength - mmlength;
                const cwidth = 32 - offset - mclength;

                message += '```ansi\n';
                if(DISCORD_TABLELAYOUT == 'unicode') {
                    message += `╔${'═'.repeat(hwidth)}╦${'═'.repeat(dwidth)}╦${'═'.repeat(cwidth)}╗\n`;
                    message += `║${pad(ansicolorize('Server Name', 35), Math.floor((hwidth - 11) / 2), Math.ceil((hwidth - 11) / 2))}`
                        + `║${pad(ansicolorize('Details', 35), Math.floor((dwidth - 7) / 2), Math.ceil((dwidth - 7) / 2))}`
                        + `║${pad(ansicolorize('Connect', 35), Math.floor((cwidth - 7) / 2), Math.ceil((cwidth - 7) / 2))}║\n`;
                    message += `╟${'─'.repeat(hwidth)}╫${'─'.repeat(dwidth)}╫${'─'.repeat(cwidth)}╢\n`;
                } else {
                    message += `${ansicolorize(pad('Server Name', Math.floor((hwidth - 11) / 2), Math.ceil((hwidth - 11) / 2)), 37, 42, 1)}`
                        + ` ${ansicolorize(pad('Details', Math.floor((dwidth - 7) / 2), Math.ceil((dwidth - 7) / 2)), 37, 42, 1)}`
                        + ` ${ansicolorize(pad('Connect', Math.floor((cwidth - 7) / 2), Math.ceil((cwidth - 7) / 2)), 37, 42, 1)}\n`;
                }

                for(let i = 0; i < parsedsrvs.length; i++) {
                    const server = parsedsrvs[i];
                    if(DISCORD_TABLELAYOUT == 'unicode') {
                        message += `║ [${ansicolorize(server.country_isocode, 32)}] ${server.sv_hostname.padEnd(hlength - mhlength)}`
                            + ` ║ ${server.clients.padStart(plength - mplength)} ${server.g_gametype.padEnd(glength - mglength)} ${server.mapname.padEnd(mlength - mmlength)}`
                            + ` ║ /connect ${server.connect.padEnd(clength - mclength)} ║\n`;
                    } else {
                        message += `[${ansicolorize(server.country_isocode, 32)}] ${server.sv_hostname.padEnd(hlength - mhlength)}`
                            + ` ${server.clients.padStart(plength - mplength)} ${server.g_gametype.padEnd(glength - mglength)} ${server.mapname.padEnd(mlength - mmlength)}`
                            + ` /connect ${server.connect.padEnd(clength - mclength)}\n`;
                    }

                    const servernum = i + 1;
                    if(!DISCORD_MAXEMBEDS || servernum > DISCORD_MAXEMBEDS) continue; // only up to DISCORD_MAXEMBEDS
                    payload_json.embeds.push({
                        "type": "rich",
                        "title": `\`#${servernum} ${truncate(server.sv_hostname, 22).padEnd(22)}\``,
                        "color": 32768,
                        "fields": [{
                            "name": "Players",
                            "value": server.clients,
                            "inline": true
                        }, {
                            "name": "Map (Gametype)",
                            "value": `${truncate(server.mapname, 15 - server.g_gametype.length - 3, '>')} (${server.g_gametype})`,
                            "inline": true
                        }, {
                            "name": "Details",
                            "value": `:flag_${server.country_isocode}: [:link:](https://cod.pm/server/${server.ip}/${server.port})`,
                            "inline": true
                        }],
                        "thumbnail": {
                            "url": server.mapimage
                        }
                    });
                }

                if(DISCORD_TABLELAYOUT == 'unicode')
                    message += `╚${'═'.repeat(hwidth)}╩${'═'.repeat(dwidth)}╩${'═'.repeat(cwidth)}╝\n`;
                message += '```\n';
            }

            const timenow = Date.now() / 1000; // Milliseconds to seconds
            const timestamp = Math.floor(timenow - (timenow - rawj.masterlist_updated));

            message += `> **There ${globalplayers != 1 ? 'are' : 'is'} currently ${globalplayers} player${globalplayers != 1 ? 's' : ''}`
                + ` on ${globalservers} of ${totalservers} server${totalservers != 1 ? 's' : ''}`
                + ` on [${CODPM_GAME == 'cod' ? 'COD1' : CODPM_GAME.toUpperCase()} v${CODPM_VERSION}](https://cod.pm?game=${CODPM_GAME}&version=${CODPM_VERSION})`;
            if(DISCORD_MAXEMBEDS && parsedsrvs.length > 0)
                message += `\n> Below ${globalservers == 1 ? 'is the' : 'are the top'} ${globalservers < DISCORD_MAXEMBEDS ? (globalservers == 1 ? 'only' : globalservers) : DISCORD_MAXEMBEDS} currently active server${totalservers != 1 ? 's' : ''}.`;
            message += `\n> Updated: <t:${timestamp}:R>**`;
            payload_json.content = message;

            try {
                const form = new FormData();
                form.append('payload_json', JSON.stringify(payload_json));

                const discord = await fetch(DISCORD_WEBHOOK, {
                    "method": /\/messages\/\d+$/.test(DISCORD_WEBHOOK) ? "PATCH" : "POST",
                    "body": form
                });

                if(!discord.ok) {
                    console.error(`Server error: ${discord.status} - ${discord.statusText}`);
                    console.error(await discord.json());
                    updated = 0;
                }
            } catch(err) {
                console.error(`Unable to fetch ${DISCORD_WEBHOOK}:`, err);
            }
        } catch(err) {
            console.error(`Unable to fetch ${CODPM_API}:`, err);
        }
    }), 10 * 1000);
})();