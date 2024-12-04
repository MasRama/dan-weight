
import { createInertiaApp } from '@inertiajs/svelte'


createInertiaApp({
  resolve: name => import(`./Pages/${name}.svelte`),
  setup({ el, App, props }) {
    new App({ target: el, props })
  },
})


if(location.origin.includes("localhost"))
{
  var evtSource = new EventSource('http://localhost:8000/subscribe');

         evtSource.onmessage = function (event) { 
         if (event.data.includes("reload")) {
            console.log("reloaded")
            location.reload()
         }
      };
}

