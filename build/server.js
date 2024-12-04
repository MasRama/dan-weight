"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const inertia_1 = __importDefault(require("./app/middlewares/inertia"));
const web_1 = __importDefault(require("./routes/web"));
const HyperExpress = require('hyper-express');
const https_1 = __importDefault(require("https"));
const axios_1 = __importDefault(require("axios"));
let webserver;
if (process.env.KEY_FILE && process.env.CERT_FILE) {
    webserver = new HyperExpress.Server({
        max_body_length: 1024 * 1024 * 10,
    });
}
else {
    webserver = new HyperExpress.Server();
}
const httpsAgent = new https_1.default.Agent({ rejectUnauthorized: false });
axios_1.default.interceptors.request.use(function (config) {
    config.httpsAgent = httpsAgent;
    return config;
});
const LiveDirectory = require('live-directory');
const manifest_json_1 = __importDefault(require("./public/manifest.json"));
const package_json_1 = require("./package.json");
//  rendering html files
const view_1 = __importDefault(require("./app/middlewares/view"));
const dayjs_1 = __importDefault(require("dayjs"));
webserver.use((0, view_1.default)());
// 
var cors = require('cors');
webserver.use(cors());
// // rendering svelte files
// require('svelte/register');
webserver.use((0, inertia_1.default)({
    view: "index",
    version: package_json_1.version,
    manifest: manifest_json_1.default
}));
webserver.use(web_1.default);
const LiveAssets = new LiveDirectory(__dirname + "/public", {
    keep: {
        extensions: ['.css', '.js', '.json', '.png', '.jpg', '.jpeg'] // We only want to serve files with these extensions
    },
    cache: {
        max_file_count: 200, // 2.5 MB * 200 = 250 MB - This means you won't go over 250 MB of cached memory for your assets 
        max_file_size: 1024 * 1024 * 2.5, // 2.5 MB - Most assets will be under 2.5 MB hence they can be cached
    },
    ignore: (path) => {
        return path.startsWith('.'); // We want to ignore dotfiles for safety
    }
});
// Create static serve route to serve frontend assets
webserver.get('*', (request, response) => {
    try {
        // Strip away '/assets' from the request path to get asset relative path
        // Lookup LiveFile instance from our LiveDirectory instance.
        const path = request.path.replace('/', '');
        const asset = LiveAssets.get(path);
        if (!asset)
            return response.status(404).send('Not Found');
        // Send the asset content as response depending on if the file is cached
        if (asset.cached) {
            // Simply send the Buffer returned by asset.content as the responseha
            // You can convert a Buffer to a string using Buffer.toString() if your webserver requires string response body
            response
                .header("Cache-Control", "max-age=31536000")
                .header("Connection", "Keep-Alive")
                .header("Date", (0, dayjs_1.default)().toString())
                .header("ETag", manifest_json_1.default["app.js"]);
            if (path.endsWith(".css"))
                return response.header("Content-Type", "text/css").send(asset.content);
            if (path.endsWith(".js"))
                return response.header("Content-Type", "text/javascript").send(asset.content);
            response.send(asset.content);
        }
        else {
            // For files that are not cached, you must create a stream and pipe it as the response for memory efficiency
            const readable = asset.stream();
            return readable.pipe(response);
        }
    }
    catch (error) {
        response.status(500).send('Server Error');
    }
});
// Activate webserver by calling .listen(port, callback);
webserver.listen(process.env.PORT).then(() => {
    console.log(`Server is running at http://localhost:${process.env.PORT}`);
}).catch((err) => {
    console.log(err);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
const cleanup = () => {
    webserver.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
