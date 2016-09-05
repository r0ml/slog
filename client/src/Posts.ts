
import { API_URL, App } from "./app";
import { Component, fetch, Route, node } from "./utils";
import { PostDetail } from "./PostDetail";
import * as Style from "./Styles";

// import { User } from "./users";


export class TimeAgo extends Component {
  constructor(t: Date) {
    const tf = t.toLocaleDateString('en-US', {day:'numeric', month:'short', year:'numeric'});
    const tt = t.toLocaleTimeString('en-US');
    super(`<span style=${Style.timeAgoStyles}>${tf} ${tt}</span>`);
  }
}
export class PostForm extends Component {
  constructor(titl: string, bod: string) {
    let isLoggedIn = 'r0ml';

    Route.defineForm("/create", Posts.createPost);

    if (!bod) bod = "";
    if (!titl) titl = "";
    let body = bod.replace(/(?:\r\n|\r|\n)/g, '<br />');

    let ih = isLoggedIn ? node `
      <div class="row">
        <div class="eight columns offset-by-two">
          <form method="post" action="#/create">
            <h1>New post</h1>
            <input name=title type="text" placeholder="Title" class="u-full-width"  value="${titl}" />
            <textarea name=body style=${Style.textareaStyles} placeholder="Body" class="u-full-width">${body}</textarea>
            <input type="submit" class="button button-primary" value="Create post" />
            <a href="#/" class="u-pull-right button">Cancel</a>
          </form>
        </div>
      </div>
    ` : node `
      <div style=${Style.needToSignInStyles}>
        <span>You need to </span><a href="#/sign-in">sign in</a> <span>to create a new post</span>
      </div>
      `;
    super(ih);
  }
}

export class Post {
  public PostId: string;
  public Title: string;
  public Body: string;
  public Author: string;
  public Gravatar: string;
  public comments: [Comment];
  public CreatedAt: string;
}

class PostItem extends Component {
  constructor(post:Post) {
    post.comments = <[Comment]>[];
    super(node `
      <li id="post-${post.PostId}" style=${Style.liStyles}>
<h1 style=${Style.titleStyles}>
<a href="#/posts/${post.PostId}/show"
style=${Style.titleLinkStyles}>${post.Title}
</a>
</h1>
<hr style=${Style.hrStyles}/>
<span style=${Style.commentsStyles}>${post.comments.length} Comment(s)</span>
<span style=${Style.timeSeparatorStyles}> - ${new TimeAgo(new Date(post.CreatedAt))}</span>
<span style=${Style.authorStyles}>
<img style=${Style.gravatarStyles} src="${post.Gravatar}" > ● ${post.Author}
</span>
<div style=${Style.clearStyles}></div>
    </li>
    `);
  }
}

export class Posts extends Component {
  protected posts: [Post];

  constructor() {
    super(`<div class="row"><div class="twelve columns"></div></div>`);
    Route.defineLink('/posts/(.+)/show', this.pickPost.bind(this) );
  }

  public static newPost(ev: Event) {
    let a = new PostForm(null, null);
    a.replaceChild( (<HTMLElement>document.querySelector('.main-content')));
  }

  public find(n: string): Post {
    for (let x of this.posts) {
      if (x.PostId === n) {
         return x;
      }
    }
    return null;
  }
  public pickPost(n: string) {
    if (this.posts == null) {
      this.getPosts(this.pickPost.bind(this, n));
      return;
    }
    let a = new PostDetail(false, this.find(n) );
    a.replaceChild( (<HTMLElement>document.querySelector('.main-content')));
  }


  public showPosts( ) {
    // const sortedPosts = posts.sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf());
    const sortedPosts = this.posts;
    let pm = sortedPosts.map(post => new PostItem(post));
    let gg = this.node.querySelector('div>div');
    if (sortedPosts.length === 0) {
      gg.innerHTML = `<div style=${Style.noDataAvailableStyles}>There are currently no posts available to display</div>`;
    } else {
      gg.innerHTML = `<ul style=${Style.ulStyles}></ul>`;
      let gh = <HTMLElement>gg.firstElementChild;
      pm.map(post => { post.appendTo(gh); });
      console.log(gh);
    }
  }

  public static createPost(fm: HTMLCollection) {
    let p = new Post();
    p.Title = (<HTMLInputElement>(fm.namedItem('title'))).value;
    p.Body = (<HTMLTextAreaElement>(fm.namedItem('body'))).value;
    p.Author = App.singleton.currentUser.email;

    fetch( API_URL + "post", p, (rs) => {
        alert("post created: "+rs);
    });
  };

  public getPosts(f: () => void) {
    fetch( API_URL+ "posts", null, (rs) => {
      let a = JSON.parse(rs);
      this.posts = a.Items;
      f();
    });

  }

  /*
  public static getPost(id) {
    const query = {
      'query': `{
      post(id: "${id}") {
        id
        title
        body
        createdAt
        updatedAt
        author {
          id
          username
          gravatar
        }
        comments {
          id
          body
          createdAt
          updatedAt
          author {
            id
            username
            gravatar
          }
        }
      }
    }`
    };

    return (dispatch) => fetch(`${API_URL}/graphql/`, {
      method: 'POST',
      body: JSON.stringify(query)
    })
        .then(response => response.json())
        .then(json => {
          let payload = json;
          dispatch({
            type: 'GET_POST',
            payload: payload
          });
          payload = {
            data: {
              comments: payload.data.post.comments
            }
          };
          return payload;
        })
        .then(payload => dispatch({
          type: 'GET_COMMENTS',
          payload: payload
        }))
        .catch(exception => dispatch({
          type: 'ERROR',
          payload: exception.message
        }));
  }
  */

  /*
  public static updatePost(post) {
    const query = {
      "query": `mutation updatePost {
      post: updatePost (
        id: "${post.id}"
        title: "${post.title}"
        body: "${post.body}"
        jwt: "${post.jwt}"
      )
      {
        id
      }
    }`
    };

    return (dispatch) => fetch(`${API_URL}/graphql/`, {
      method: 'POST',
      body: JSON.stringify(query)
    })
        .then(response => response.json())
        .then(json => dispatch({
          type: 'UPDATE_POST',
          payload: json
        }))
        .catch(exception => dispatch({
          type: 'ERROR',
          payload: exception.message
        }));
  }
  */

  /*
  public static deletePost(post) {
    const query = {
      "query": `mutation deletePost {
      post: deletePost (
        id: "${post.id}"
        jwt: "${post.jwt}"
      )
      {
        id
      }
    }`
    };

    return (dispatch) => fetch(`${API_URL}/graphql/`, {
      method: 'POST',
      body: JSON.stringify(query)
    })
        .then(response => response.json())
        .then(json => dispatch({
          type: 'DELETE_POST',
          payload: json
        }))
        .then(() => dispatch(push('/')))
        .catch(exception => dispatch({
          type: 'ERROR',
          payload: exception.message
        }));
  }
  */
}
