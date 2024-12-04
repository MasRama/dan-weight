
import esbuild from "esbuild";
 
import svelteInertiaPlugin from "esbuild-svelte-inertia";
import sveltePlugin from "esbuild-svelte";
import {writeFileSync} from "fs"

const result = await esbuild.build({ 
    entryPoints: ["./resources/js/app.js"],
      mainFields: ["svelte", "browser", "module", "main"],
      conditions: ["svelte", "browser"],
      bundle: true,
      metafile: true,
      minify : true,

      outdir: 'public',
    plugins: [sveltePlugin(), svelteInertiaPlugin()],
  }) 

  writeFileSync('meta.json', JSON.stringify(result.metafile))
