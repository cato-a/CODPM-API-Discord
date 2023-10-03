const DISCORD_WEBHOOK = new URL('');
const DISCORD_TABLELAYOUT = 'ansi'; // 'ansi' or 'unicode'
const DISCORD_MAXEMBEDS = 5;
const CODPM_GAME = 'cod';
const CODPM_VERSION = 1.1;
const CONFIG_RENAME_EMPTY = 'Unnamed Server';

// /!\ END of configuration /!\

const CODPM_API = new URL(`/masterlist/${CODPM_GAME}/${CODPM_VERSION}`, 'https://api.cod.pm');
let updated = 0;

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

function mapimage(mapname, ext = '.png')
{
    const stockmaps = ["mp_bocage", "mp_brecourt", "mp_carentan", "mp_chateau", "mp_dawnville", "mp_depot", "mp_harbor", "mp_hurtgen", "mp_neuville", "mp_pavlov", "mp_powcamp", "mp_railyard", "mp_rocket", "mp_ship", "mp_stalingrad", "mp_tigertown"];
    const custommaps = ["alcatraz", "arcville", "bc_bocli", "bhop2", "bhop_gaps", "bhop", "bhop_start", "bitch", "brecourt_winter", "ch_quickie", "ch_secret", "ch_space", "cj_change", "cj_cow", "cj_hallwayofdoom", "cj_hornet", "cj_wolfjump", "cls_industries", "cp_easy_jump", "cp_lawlwhut", "cp_sirens_call", "cs_smoke", "ct_aztec", "dan_jumpv3", "d-day+7", "ddd_easy_jump", "dm_sector7", "dob_airbase_sniper", "double_vision", "duo_cool2", "fm_squishydeath_easy", "fm_squishydeath_hard", "funjump", "german_town", "germantrainingbase", "ghosttown", "groms_skatepark", "gunball", "harbor_jump", "hardjump", "jm_amatuer", "jm_bounce", "jm_canonjump", "jm_caramba_easy", "jm_caramba_hard", "jm_castle", "jm_clampdown", "jm_classique", "jm_crispy", "jm_everything", "jm_factory", "jm_fear", "jm_foundry", "jm_gap", "jm_ghoti", "jm_hollywood", "jm_house_of_pain", "jm_infiniti", "jm_krime", "jm_kubuntu", "jm_learn2jump", "jm_lockover", "jm_maniacmansion", "jm_mota", "jm_motion_light", "jm_motion_pro", "jm_pillz", "jm_plazma", "jm_rikku", "jm_robbery", "jm_skysv4c", "jm_speed", "jm_sydneyharbour_easy", "jm_sydneyharbour_hard", "jm_tools", "jm_towering_inferno", "jm_uzi", "jm_woop", "jt_dunno", "jump_colors", "jumping-falls", "jumpville", "kn_angry", "krime_pyramid", "ls_darkness", "mazeofdeath_easy", "mazeofdeath_hard", "mazeofdeath_vhard", "mice", "mj_dutchjumpers_gap", "mj_noname_hard", "mountain", "mp_amberville_2", "mp_bellicourt_v1_1", "mp_eisberg", "mp_falaisevilla", "mp_foy", "mp_jump", "mp_oase", "mp_redoktober", "mp_shipment", "mp_stargate", "mp_v2_ver2", "mp_vok_final_day", "mp_vok_final_night", "mp_winterv2", "mp_wreck2", "nev_codered", "nev_firstonev2", "nev_jumpfacility", "nev_jumpfacilityv2", "nev_namedspace", "nev_templeofposeidonv2", "nm_castle", "nm_dual_2", "nm_jump", "nm_mansion", "nm_portal", "nm_race", "nm_random", "nm_tower", "nm_toybox_easy", "nm_toybox_hard", "nm_training", "nm_trap", "nm_treehouse", "nm_unlocked", "nn_lfmjumpv2", "nuenen", "omaha_mohaa", "peds_f4a", "peds_pace", "peds_palace", "peds_parkour", "peds_puzzle", "perps_world", "project_uboat", "race", "railyard_jump_hard", "railyard_jump_light", "railyard_jump_ultra", "rats", "skratch_easy_v2", "skratch_hard_v2", "skratch_medium_v2", "[sob]easyjump", "son-of-bitch", "speedball", "starship", "svb_basics", "svb_darkblade", "svb_hallway", "svb_marathon", "svb_rage", "svb_sewer", "svt_xmas_v2", "the_outpost", "townville_beta", "ultra_gap_training", "vikings_omaha", "vik_jump", "wacked", "zaitroofs", "zaittower2"];

    let path = stockmaps[stockmaps.indexOf(mapname)];
    let source = 'stock/';

    if(path === undefined) {
        path = custommaps[custommaps.indexOf(mapname)];
        path === undefined ? path = 'unknown' : source = 'custom/';
    }

    return source + path + ext;
}

setInterval((async () => {
    try { //const ignoresrvs = ['176.31.252.60:*', '157.90.181.156:9120'];
        const codpm = await fetch(CODPM_API, {"headers": {"Accept": "application/json"}});
        if(codpm.ok && codpm.status == 200) {
            try {
                const rawj = await codpm.json();
                if(rawj.masterlist_updated == updated) return;
                updated = rawj.masterlist_updated;

                let [globalplayers, globalservers, mhlength, mplength, mglength, mmlength, mclength] = new Array(7).fill(0);
                const [hlength, plength, glength, mlength, clength] = [30, 5, 5, 16, 21];
                const parsedsrvs = new Array();
                for(let i = 0; i < rawj.servers.length; i++) {
                    const server = rawj.servers[i];
                    if(server.hidden > 0 || server.sv_maxclients > 72) // ignoresrvs.some((element) => element.match(new RegExp(`^${server.ip}:(?:\\*|${server.port})$`)))
                        continue;

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
                            "mapimage": "https://cod.pm/mp_maps/" + mapimage(mapname)
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

                const timenow = Date.now() / 1000; // Milliseconds to seconds
                const timestamp = Math.floor(timenow - (timenow - rawj.masterlist_updated));
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

                message += `> **There ${globalplayers != 1 ? 'are' : 'is'} currently ${globalplayers} player${globalplayers != 1 ? 's' : ''}`
                    + ` on ${globalservers} of ${rawj.servers.length} server${rawj.servers.length != 1 ? 's' : ''}`
                    + ` on [${CODPM_GAME == 'cod' ? 'COD1' : CODPM_GAME.toUpperCase()} v${CODPM_VERSION}](https://cod.pm?game=${CODPM_GAME}&version=${CODPM_VERSION})`;
                if(DISCORD_MAXEMBEDS && parsedsrvs.length > 0)
                    message += `\n> Below ${globalservers == 1 ? 'is the' : 'are the top'} ${globalservers < DISCORD_MAXEMBEDS ? (globalservers == 1 ? 'only' : globalservers) : DISCORD_MAXEMBEDS} currently active server${rawj.servers.length != 1 ? 's' : ''}.`;
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
                        console.log(`Server error: ${discord.status} - ${discord.statusText}`);
                        console.log(await discord.json());
                        updated = 0;
                    }
                } catch(err) {
                    console.log(`Unable to fetch ${DISCORD_WEBHOOK}:`, err);
                }
            } catch(err) {
                console.log('Unable to handle JSON:', err);
            }
        } else
            console.log(`Server error: ${codpm.status} - ${codpm.statusText}`);
    } catch(err) {
        console.log(`Unable to fetch ${CODPM_API}:`, err);
    }
}), 20 * 1000);