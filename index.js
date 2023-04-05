import WebSocket from 'ws';
import got from 'got';

const wsUrl = process.env.MOONRAKER_WS || 'ws://localhost:80/websocket';
const spectodaUrl = process.env.SPECTODA_URL || 'http://localhost:8888/';
const devMode = !!process.env.DEV;
let serverInfoId = 0;
let lastProgress = undefined;

const buildRpc = (method, params, id) => {
    if (id === undefined) {
        id = Math.ceil(Math.random() * 1000000);
    }
    return {
        "id": id,
        "method": method,
        "jsonrpc": "2.0",
        "params": params
    }
}

const sendEvent = async (label, value, type = 'percentage') => {
    const payload = {
        label: label,
        id: 255,
    }
    if (value) {
        payload.value = value;
        payload.type = type;
    } else {
        payload.type = "empty"
    }
    if (devMode) {
        console.log('POST', `${spectodaUrl}event`, payload);
        return;
    }
    try {
        return await got.post(`${spectodaUrl}event`, { json: payload }).json();
    } catch (e) {
        console.error('error: ', payload, e.code);
    }
}

const requestInfo = (ws) => {
    const id = Math.ceil(Math.random() * 1000000);
    ws.send(JSON.stringify(buildRpc("server.info", undefined, serverInfoId)));
    return id;
}

const parseServerInfo = (ws, data) => {
    if (data.result.klippy_state === 'ready') {
        sendEvent('kread');
    }
    if (data.result.klippy_state === 'disconnected') {
        sendEvent('kdisc');
    }
    if (data.result.klippy_state === 'error') {
        sendEvent('kerro');
    }
    if (data.result.klippy_state === 'startup') {
        sendEvent('kstup');
        setTimeout(() => {
            serverInfoId = requestInfo(ws);
        }, 2000);
    }
}

const subscribeRpc = buildRpc("printer.objects.subscribe", {
    "objects":
    {
        "webhooks": null,
        "print_stats": null,
        "virtual_sdcard": ["progress"],
    }
}, 1);


const stateEvents = {
    "standby": "stdby",
    "printing": "print",
    "paused": "pause",
    "complete": "done",
    "error": "error",
}
const handleStatusUpdate = (data) => {
    const stats = data.params[0].print_stats;
    if (stats.state) {
        const label = stateEvents[stats.state];
        sendEvent(label);
    }
    const vsc = data.params[0].virtual_sdcard;
    if (vsc && vsc.progress && lastProgress !== Math.floor(vsc.progress * 100.0)) {
        lastProgress = Math.floor(vsc.progress * 100.0);
        sendEvent('progr', lastProgress, 'percentage')
    }
}

const parseSubscribe = (data) => {
    const stats = data.result?.status?.print_stats
    if (stats && Object.keys(stateEvents).includes(stats.state)) {
        const event = stateEvents[stats.state];
        sendEvent(event);
    }
}
const connectWs = () => {
    const ws = new WebSocket(wsUrl);

    ws.on('error', console.error);

    ws.on('open', function open() {
        ws.send(JSON.stringify(subscribeRpc));
        serverInfoId = requestInfo(ws);
        sendEvent('init');
    });

    ws.on('message', function message(data) {
        const d = JSON.parse(data);

        // Info about server. Not interesting
        if (d.method === 'notify_proc_stat_update') {
            return;
        }
        // Requested server.info 
        if (d.id === serverInfoId) {
            parseServerInfo(ws, d);
        }
        if (d.method === 'notify_klippy_disconnected') {
            sendEvent('kdisc');
        }
        if (d.method === 'notify_klippy_ready') {
            sendEvent('kread');
        }
        if (d.method === 'notify_klippy_shutdown') {
            sendEvent('kshut');
        }
        if (d.id === 1) {
            return parseSubscribe(d);
        }
        if (d.method === 'notify_status_update') {
            return handleStatusUpdate(d);
        }
    });

    ws.on('close', function close() {
        console.log('disconnected');
        sendEvent('disc');
        setTimeout(() => {
            console.log('reconnecting...');
            connectWs();
        }, 2000);
    });
}
connectWs();