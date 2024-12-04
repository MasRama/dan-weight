var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import esbuild from "esbuild";
import crypto from "crypto";
import svelteInertiaPlugin from "esbuild-svelte-inertia";
import sveltePlugin from "esbuild-svelte";
let clients = [];
let files = {};
let hash = {};
let sse_streams = {};
const port = 8000;
import { writeFileSync, readFileSync } from 'fs';
function Build(init) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        try {
            const start = Date.now();
            let result = yield esbuild.build({
                entryPoints: ['./resources/js/app.js'],
                mainFields: ["svelte", "browser", "module", "main"],
                conditions: ["svelte", "browser"],
                loader: { '.svg': 'text' },
                bundle: true,
                minify: false,
                write: false,
                plugins: [sveltePlugin(), svelteInertiaPlugin()],
                outdir: 'public',
            });
            const end = Date.now();
            console.log(`compile done in ${end - start}ms`);
            const out = result.outputFiles;
            let manifest = `{
    "style.css" : "http://localhost:${port}/style.css",`;
            let count = 0;
            let push_change = false;
            try {
                for (var _d = true, out_1 = __asyncValues(out), out_1_1; out_1_1 = yield out_1.next(), _a = out_1_1.done, !_a; _d = true) {
                    _c = out_1_1.value;
                    _d = false;
                    const file = _c;
                    count++;
                    const filename = file.path.split("/").pop();
                    files[filename] = file.text;
                    if (hash[filename] != file.hash) {
                        push_change = true;
                        hash[filename] = file.hash;
                    }
                    manifest += `"${filename}": "http://localhost:${port}/${filename}"${count < out.length ? "," : ""}`;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = out_1.return)) yield _b.call(out_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (push_change && !init) {
                console.log("compile done, pushing change...");
                ReloadPage();
            }
            manifest += ` }`;
            if (init) {
                writeFileSync("./public/manifest.json", manifest);
            }
        }
        catch (error) {
        }
    });
}
function ReloadPage() {
    Object.keys(sse_streams).forEach((id) => {
        sse_streams[id].send("reload");
    });
}
import chokidar from "chokidar";
var watcher = chokidar.watch('resources', { ignored: /^\./, persistent: true });
watcher
    .on('ready', () => {
    console.log('Initial scan complete. Ready for changes');
    Build(true);
})
    .on('change', (path) => {
    console.log('File', path, 'has been changed');
    if (path.includes(".svelte") || path.includes(".js")) {
        Build(false);
    }
    // console.log(path)
    // if(path.includes("/views/") && path.includes(".svelte"))
    // {
    //   Compile(path);
    //   console.log("compile views")
    // }
    console.log(path.includes(".html"));
    if (path.includes(".html")) {
        ReloadPage();
    }
});
import HyperExpress from 'hyper-express';
const webserver = new HyperExpress.Server();
import cors from "cors";
webserver.use(cors());
webserver.get("/subscribe", (request, response) => {
    response.status(200).header("Content-Type", "text/event-stream").header("Connection", "keep-alive").header("Cache-Control", "no-cache");
    response.sse.open();
    // OR you may also send a message which will open the stream automatically
    response.sse.send('initialize');
    // Assign a unique identifier to this stream and store it in our broadcast pool
    response.sse.id = crypto.randomUUID();
    sse_streams[response.sse.id] = response.sse;
    response.on('error', () => {
        delete sse_streams[response.sse.id];
    });
});
// Create static serve route to serve frontend assets
webserver.get('*', (request, response) => {
    // Strip away '/assets' from the request path to get asset relative path
    // Lookup LiveFile instance from our LiveDirectory instance.
    const path = request.path.replace('/', '');
    const ext = path.split(".")[1];
    try {
        let file;
        if (path == "favicon.ico") {
            file = readFileSync("public/icon/favicon.ico");
        }
        else if (files[path]) {
            file = files[path];
        }
        else {
            file = readFileSync("public/" + path);
        }
        return response.type(ext).send(file);
    }
    catch (error) {
        return response.status(404).send('Not Found');
    }
});
// Activate webserver by calling .listen(port, callback);
webserver.listen(port)
    .then((socket) => console.log('Webserver started on  http://localhost:' + port))
    .catch((error) => console.log('Failed to start webserver on port 80'));
