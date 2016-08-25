

export class StyleN {
  protected style: {[sel: string]: string};

  constructor(hash: {[sel:string]: string}) {
    this.style = hash;
  }
  public toString() {
    let rd = document.createElement("div");

    for (let k in this.style) {
      if (this.style.hasOwnProperty(k)) {
        rd.style[k] = this.style[k];
      }
    }
    let res = '"'+rd.style.cssText+'"';
    rd.remove();
    return res;
  }
}
export function fetch(u: string, p: any, cb: (res: string) => void) {
  "use strict";
  let xhr = new XMLHttpRequest();

  xhr.open( cb === undefined ? 'GET' : 'POST', u);
  // xhr.setRequestHeader(h, d);
  //noinspection JSUnusedLocalSymbols
  xhr.onload = ( ev: Event ) => {
    if (xhr.status < 200 || xhr.status >= 300 ) {
      alert("failed: " + xhr.responseText + " " + xhr.status);
    } else {
      cb(xhr.responseText);
    }
  };
  xhr.onerror = (ev) => {
    alert("error" + ev.toString() );
  };
  xhr.onabort = (ev) => {
    alert("abort" + ev.toString() );
  };
  xhr.ontimeout = (ev) => {
    alert("timeout" + ev.toString() );
  };

  if (p === undefined) {
    xhr.send();
  } else {
    try {
      xhr.send(JSON.stringify(p));
    } catch(ev) {
      alert(ev);
    }
  }
}

export function style(s: string) {
  "use strict";
  let sty = <HTMLStyleElement>document.createElement('style');
  sty.type = 'text/css';
  document.head.appendChild(sty);
  sty.innerHTML = s;
}

export class Component {
  public node: HTMLElement;

  constructor(body: HTMLElement | string) {
    if (typeof body === 'string') {
      let n = document.createElement('div');
      n.innerHTML = body;
      this.node = <HTMLElement> n.firstElementChild;
      } else {
      this.node = body;
    }
  }
  public appendTo(parent: HTMLElement) {
    parent.appendChild(this.node);
  }
  public replaceChild(parent: HTMLElement) {
    if (parent.childElementCount) {
      parent.replaceChild(this.node, parent.lastElementChild);
    } else {
      parent.appendChild(this.node);
    }
  }
  public style(s: StyleN) {
    for (let i of Object.keys(s)) {
      this.node.style[i] = s[i];
    }
  }
  /*
  public handle(selector: string, event: string, fn: (ev: Event) => void ) {
    this.node.querySelector(selector).addEventListener(event, fn);
  }
  */
  /* This lets me incorporate a Component via interpolation */
  public toString() {
    return this.node.outerHTML;
  }
}

export class Route {

  protected static linkHandlers:{ [route:string]:((ev:Event) => void) } = {};
  protected static formHandlers: { [route: string]: ((c : HTMLCollection) => void) } = {};
  protected static changeHandlers: { [route:string]: ((fld: HTMLInputElement) => void) } = {};

  public static go(s:string) {
    Route.linkHandlers[s.substring(1)](undefined);
  }
  public static link(ev:Event) {
    console.log("link");
    console.log(ev);
    let h: string;
    if (ev instanceof CustomEvent) {
      h = ev.detail;
    } else if ((<HTMLElement>ev.target).tagName === 'A') {
      ev.preventDefault();
      h = (<HTMLAnchorElement>ev.target).hash;
    } else if (ev instanceof PopStateEvent && ev.eventPhase === 2) {
      h = window.location.hash;
      // there is no hash
      if (!h) { return; }
    } else {
      // ignore this type of click
      return;
    }
      let f = Route.linkHandlers[h.substring(1)];
      if (f) {
        ev.preventDefault();
        window.location.hash = h;
        f(ev);
      } else {
        for (const key in Route.linkHandlers) {
          let k = h.substring(1).match("^" + key + "$");
          if (k) {
            let value = Route.linkHandlers[key];
            ev.preventDefault();
            window.location.hash = h;
            value.apply(undefined, k.slice(1));
            return;
          }
        }
        alert(h + " is not a link route");
      }
  }

  public static form(ev: Event ) {
    console.log("form");
    console.log(ev);

    if ((<HTMLElement>ev.target).tagName === 'FORM') {
      ev.preventDefault();
      let h = (<HTMLFormElement>ev.target).getAttribute("action");
      let f = Route.formHandlers[h.substring(1)];
      if (f) {
        ev.preventDefault();
        f( (<HTMLFormElement>ev.target).elements);
      } else {
        alert(h + " is not a form route");
      }
    }
  }

  public static change(ev: Event ) {
    console.log("change");
    console.log(ev);

    if ((<HTMLElement>ev.target).tagName === 'INPUT') {
      ev.preventDefault();
      let h = (<HTMLFormElement>ev.target).getAttribute("name");
      let f = Route.changeHandlers[h.substring(1)];
      if (f) {
        ev.preventDefault();
        f( (<HTMLInputElement>ev.target) );
      } else {
        // alert(h + " is not a change route");
        console.log(h + " is not a change route");
      }
    }
  }

  public static defineChange(s:string, f:((p:HTMLInputElement) => void)) {
    Route.changeHandlers[s]=f;
  }
  public static defineLink(s:string, f:((ev:Event) => void)) {
    Route.linkHandlers[s] = f;
  }

  public static defineForm(s:string, f:((fm:HTMLCollection) => void)) {
    Route.formHandlers[s] = f;
  }
}

document.addEventListener("click", Route.link, true );
window.addEventListener("popstate", Route.link, true);
document.addEventListener("submit", Route.form, true);
document.addEventListener("change", Route.change, true);


// interpolates a template into a node
export function node(literals, ...placeholders) {
  // "use strict";
  let result = "";
  for (let i = 0; i<placeholders.length; i++) {
    result += literals[i];
    let p = placeholders[i];
    if (p.constructor == this.Component) {
      result += '<div class="this-is-a-placeholder-'+i+'"></div>';
    } else if (p.constructor ==  this.StyleN) {
      result += p.toString();
    } else if (typeof p === "string") {
      result += p;
    } else if ( typeof p === "number") {
      result += p.toString();
    } else if ( p === undefined ) {
      // ignore undefined
      continue;
    } else {
      throw Error("interpolating neither a Component nor a string");
    }
  }
  result += literals[literals.length-1];
  let nd = document.createElement('div');
  nd.innerHTML = result;
  for (let i=0; i<placeholders.length; i++) {
    if ( placeholders[i].constructor == Component ) {
      placeholders[i].appendTo(nd.querySelector(".this-is-a-placeholder-"+i));
    }
  }
  return <HTMLElement>nd.firstElementChild;
}

export function uuid(): string {
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
  return v.toString(16);
});
}
