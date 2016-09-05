import {Component, StyleN, Route, style, node} from './utils';
import {SignUp, SignIn, User} from './users';
import {Posts} from './Posts';
import {Md5} from './md5';

// export const API_URL = 'https://55b85gckbc.execute-api.us-east-1.amazonaws.com/dev/';
export const API_URL = 'http://localhost:9044/';

export class App extends Component {
  public currentUser: User; // logged in user
  public static singleton: App;

  constructor(div:HTMLElement) {
    if (App.singleton) {
      throw Error("there is already an app on this page");
    }
    super('<div></div>');
    App.singleton = this;
    let uu = localStorage.getItem("currentUser");
    if (uu) this.currentUser = JSON.parse(uu);
    this.appendTo(div);
    new Header().appendTo(this.node);
    // new Component('<div class="container"><div class="error" style="margin-bottom: 100px;"></div>' +
    new Component('<div class="container"><div class="main-content"></div></div>').appendTo(this.node);

    new Footer().appendTo(this.node);
    App.initialIndex();
    Route.defineLink("/", App.initialIndex);

    // deep linking -- routing the hash on arriving at a page as if clicked to there
    let h = window.location.hash;
    // if there is a hash, go there
    if (h) {
      // creating a link element so the custom event will not generate an error
      // let e = document.createElement("a");
      // document.body.appendChild(e);  // so the event will propagate up to the document
      let t = new CustomEvent('popstate', { detail: h });
      // window.dispatchEvent(t);
      let ck = document.dispatchEvent(t);
      if (ck) {
        alert("somebody called preventDefault() on this event");
      }
    }
  }

  public static initialIndex() {
    let p = new Posts();
    p.replaceChild(<HTMLElement>document.querySelector('.main-content'));
    p.getPosts(p.showPosts.bind(p));
  }
}

const headerContainerStyles = new StyleN({
  borderBottom: '1px solid #E1E1E1',
  marginBottom: '20px',
});

const newPostButtonStyles = new StyleN({
  marginBottom: '0px'
});

style( `
.brandStyles {
  font-size: 20px;
  font-weight: bold;
  text-decoration: none;
  display: inline-block;
  margin-top: 10px;
}

.ulStyles {
  list-style: none;
  padding: 0px;
  float: right;
  margin: 0px;
  margin-top: 10px;
}

.liStyles {
  display: inline-block;.
  margin-left: 10px;
}

.gravatarStyles {
  height: 36px;
  vertical-align: middle;
  display: inline-block;
}

.centerTextStyles { text-align: center; }

.footerStyles {
  border-top: 1px solid #E1E1E1;
  padding: 10px;
  margin-top: 20px;
  position: fixed;
  bottom: 0px;
  width: 100%;
  background-color: white;
}
` );

export class Gravatar extends Component {
  /*
  static x = document.addEventListener("login", (x: CustomEvent) => {
    console.log("loggedIn: "+x);
    let gn = document.querySelectorAll("[data-gravatar]");
    let u = x.detail;
    let e = Gravatar.link( u ? u['email'] : null) ;
    for(var i = 0;i<gn.length;i++) {
      gn.item(i).setAttribute('src', e);
    }
  } );
  */
  public static link(email:string) : string {
    let grava = "unknown";
    if ( ! (email == null)) {
      let xx = Md5.hashStr(email, false);
      grava = `https://s.gravatar.com/avatar/${xx}?s=100&r=x&d=retro`;
    }
    return grava;
  }
  constructor(email: string) {
    let grava=Gravatar.link(email);
    super(node `<img class="gravatarStyles" data-gravatar src="${grava}" />`);
    // this.node.classList.add("gravatar");
  }
  /*
   let z = <HTMLElement>document.querySelector(".gravatar");
   let k = z.dataset['gravatar'];
   */
}

export class Header extends Component {

  // maybe I should use
  //    localStorage.setItem("currentUser", JSON.stringify(currentUser))
  // and
  //    JSON.parse(localStorage.getItem("currentUser"))
  // public currentUser:User;
  public static singleton: Header;

  public static handleSignOutClick(event:MouseEvent) {
    Header.singleton.setCurrentUser(null);
  }

  constructor() {
    super(node `
      <div style=${headerContainerStyles}>
        <div class="container" >
          <div class="row">
            <div class="twelve columns">
              <a href="#/" class=brandStyles>Slog</a>

    <ul class=ulStyles>

              </ul>
            </div>
          </div>
        </div>
        </div>
        `);

    // this.style(headerContainerStyles);

    Route.defineLink("/", console.log);
    Route.defineLink("/posts/new", Posts.newPost);
    Header.singleton = this;
    this.setCurrentUser(App.singleton.currentUser);
  }

  public setCurrentUser(u: User) {
    App.singleton.currentUser = u;
    localStorage.setItem("currentUser", JSON.stringify(u));
    let ck = document.dispatchEvent(new CustomEvent('login', {detail: u}));
    if (!ck) {
      alert("somebody called preventDefault() on this event");
    }
    let ul = <HTMLElement>this.node.querySelector('ul');
    if (u) {
      Route.defineLink("/sign-out", Header.handleSignOutClick);
      ul.innerHTML=`<li class=liStyles><a href="#/posts/new" class="button button-primary" style=${newPostButtonStyles}>New post</a></li>
                    <li class=liStyles>${u.email} ● ${new Gravatar(u.email)} ● <a href='#/sign-out' >Sign out</a></li>
 `;
      Route.go("#/");
      // Posts.new(undefined);
    } else {
      ul.innerHTML = `<li class=liStyles>
                 <a href="#/sign-up">Sign up</a>
               </li>
               <li class=liStyles>
                  <a href="#/sign-in">Sign in</a>
               </li>
`;
    }
      Route.defineLink("/sign-up", Header.signUp);
      Route.defineLink("/sign-in", Header.signIn);
  }

  public static signUp(event:Event) {
    new SignUp().replaceChild(<HTMLElement>document.querySelector('.main-content'));
  };

  public static signIn(event:Event) {
    new SignIn().replaceChild(<HTMLElement>document.querySelector('.main-content'));
  }
}

export class Footer extends Component {
  constructor() {
    super(node `
      <footer class="footerStyles">
        <div class="container row">
          <div class="twelve columns centerTextStyles">
              A react-less experiment
          </div>
        </div>
      </footer>
    `);
  }
}

new App(document.body);
