var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var _a, e_1, _b, _c;
import esbuild from "esbuild";
import svelteInertiaPlugin from "esbuild-svelte-inertia";
import sveltePlugin from "esbuild-svelte";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
import { writeFileSync, rename, mkdirSync } from 'fs';
const result = await esbuild.build({
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
const hash = (Math.random() + 1).toString(36).substring(7);
;
let manifest = `{
  "style.css" : "/style.${hash}.css",`;
let count = 0;
rename("public/style.css", `public/style.${hash}.css`, () => { });
const out = result.outputFiles;
try {
    for (var _d = true, out_1 = __asyncValues(out), out_1_1; out_1_1 = await out_1.next(), _a = out_1_1.done, !_a; _d = true) {
        _c = out_1_1.value;
        _d = false;
        const file = _c;
        count++;
        const filename = file.path.split("/").pop();
        const split = filename.split(".");
        const ext = split.pop();
        const name = split.pop();
        if (name == 'app') {
            const hash_name = `${name}.${file.hash.replace("/", "")}.${ext}`;
            manifest += `"${filename}": "/${hash_name}"${count < out.length ? "," : ""}`;
            writeFileSync(__dirname + `/public/${hash_name}`, file.text);
        }
        else {
            const hash_name = `${name}.${ext}`;
            manifest += `"${filename}": "/${hash_name}"${count < out.length ? "," : ""}`;
            writeFileSync(__dirname + `/public/${hash_name}`, file.text);
        }
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (!_d && !_a && (_b = out_1.return)) await _b.call(out_1);
    }
    finally { if (e_1) throw e_1.error; }
}
manifest += `}`;
writeFileSync("./public/manifest.json", manifest);
