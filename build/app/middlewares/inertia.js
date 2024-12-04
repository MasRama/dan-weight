"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodashPick = (object, keys) => {
    return keys.reduce((obj, key) => {
        if (object && object.hasOwnProperty(key)) {
            obj[key] = object[key];
        }
        return obj;
    }, {});
};
const setupProps = (props, req) => __awaiter(void 0, void 0, void 0, function* () {
    let _props = props;
    const share = req.share || {};
    let error = req.cookies.error;
    _props = Object.assign(Object.assign(Object.assign({}, props), share), { error });
    return _props;
});
const getRequestedProps = (req, component, props) => {
    const requestedProps = req.header("X-Inertia-Partial-Data");
    if (requestedProps) {
        if (req.header("X-Inertia-Partial-Component") === component) {
            return lodashPick(props, requestedProps.split(","));
        }
    }
    return props;
};
const shouldConflict = (req, version) => {
    return req.method === `GET` && req.header("X-Inertia-Version") !== version;
};
function view({ page, manifest }) {
    const result = `<!DOCTYPE html>
    <html lang="en-gb" class="dark">
    
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${manifest['app.css']}">
        <link rel="stylesheet" href="${manifest['style.css']}">

        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/2.11.8/umd/popper.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/tippy.js/6.3.7/tippy-bundle.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/dexie/3.2.4/dexie.min.js" integrity="sha512-8WThzNuMpra6ZiqTyMfenYaUKUJVEWX6KYvlcKe1I5qCHHbtt+mW7N1mwn+xRYVJ4CaVsQ014Gh2sYCZz9ZJUw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
        <script type="module"  src="${manifest['app.js']}" defer></script>
        
        
    </head>
    <body>
    
        <div id="app" data-page="${(page)}"></div>

     
       
    
    </body>
    </html>`;
    return result;
}
const inertia = (options = {}) => {
    options = Object.assign({ version: null, view: "app" }, options);
    return (req, res, next) => {
        res.inertia = (component, inertiaProps, viewProps) => __awaiter(void 0, void 0, void 0, function* () {
            const url = `//${req.get("host")}${req.originalUrl}`;
            const props = getRequestedProps(req, component, inertiaProps);
            const inertiaObject = {
                component: component,
                props: yield setupProps(props, req),
                url: url,
                manifest: options.manifest,
                version: options.version
            };
            if (inertiaObject.props.error) {
                res.clearCookie("error");
            }
            if (!req.header("X-Inertia")) {
                const html = yield view(Object.assign({ layout: false, page: JSON.stringify(inertiaObject).replace(/"/g, '&#34;'), manifest: options.manifest }, viewProps));
                return res.type('html').send(html);
            }
            if (shouldConflict(req, options.version)) {
                if (req.session && typeof req.flash === "function") {
                    const messages = req.flash();
                    for (message in messages) {
                        req.flash(message, messages[message]);
                    }
                }
                res.setHeader("X-Inertia-Location", url);
                return res.status(409).end();
            }
            res.setHeader("Vary", "Accept");
            res.setHeader("X-Inertia", "true");
            res.setHeader("X-Inertia-Version", options.version);
            return res.json(inertiaObject);
        });
        const end = res.end;
        res.end = function () {
            // if (shouldSeeOther(req, res)) {
            //     // res.status(303);
            // }
            return end.apply(this, arguments);
        };
        next();
    };
};
exports.default = inertia;
