
import { API_URL, App } from "./app";
import { Component, fetch, StyleN, Route } from "./utils";
import { PostDetail } from "./PostDetail";

// import { User } from "./users";

const ulStyles = new StyleN({
  marginBottom: '10px'
});

const noDataAvailableStyles = new StyleN({
  marginTop: '20px',
  textAlign: 'center'
});

const liStyles = new StyleN({
  border: '1px solid #E1E1E1',
  padding: '10px',
  listStyle: 'none'
});

const titleStyles = new StyleN({
  fontSize: '20px',
  marginBottom: '0px'
});

const titleLinkStyles = new StyleN({
  textDecoration: 'none'
});

const authorStyles = new StyleN({
  fontStyle: 'italic',
  float: 'right',
  color: '#B1B1B1'
});

const hrStyles = new StyleN({
  margin: '10px 0px'
});

const commentsStyles = new StyleN({
  float: 'left'
});

const timeSeparatorStyles = new StyleN({
  margin: '0px 5px'
});

const timeAgoStyles = new StyleN({
  fontStyle: 'italic',
  color: '#B1B1B1'
});

const clearStyles = new StyleN({
  clear: 'both'
});

const gravatarStyles = new StyleN({
  'height': '30px',
  'display': 'inline-block'
});

const needToSignInStyles = new StyleN({
  textAlign: 'center'
});

const textareaStyles = new StyleN({
  height: '300px'
});

export class TimeAgo extends Component {
  constructor(t: string) {
    const tf = new Date(t).toLocaleDateString('en-US', {day:'numeric', month:'short', year:'numeric'});
    super(`<span style=${timeAgoStyles}>${tf}</span>`);
  }
}
export class PostForm extends Component {
  constructor(titl: string, bod: string) {
    let isLoggedIn = 'r0ml';

    Route.defineForm("/create", Posts.createPost);

    let body = bod.replace(/(?:\r\n|\r|\n)/g, '<br />');

    let ih = isLoggedIn ? `
      <div class="row">
        <div class="eight columns offset-by-two">
          <form method="post" action="#/create">
            <h1>New post</h1>
            <input name=title type="text" placeholder="Title" class="u-full-width"  value=${titl} />
            <textarea name=body style=${textareaStyles} placeholder="Body" class="u-full-width">${body}</textarea>
            <input type="submit" class="button button-primary" value="Create post" />
            <a href="#/" class="u-pull-right button">Cancel</a>
          </form>
        </div>
      </div>
    ` : `
      <div style=${needToSignInStyles}>
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
    super(`
      <li id="post-${post.PostId}" style=${liStyles}>
<h1 style=${titleStyles}>
<a href="#/posts/${post.PostId}/show"
style=${titleLinkStyles}>${post.Title}
</a>
</h1>
<hr style=${hrStyles}/>
<span style=${commentsStyles}>${post.comments.length} Comment(s)</span>
<span style=${timeSeparatorStyles}> - ${new TimeAgo(post.CreatedAt)}</span>
<span style=${authorStyles}>
<img style=${gravatarStyles} src="${post.Gravatar}" > ● ${post.Author}
</span>
<div style=${clearStyles}></div>
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
    let a = new PostForm('Title', 'Body');
    a.replaceChild( (<HTMLElement>document.querySelector('.main-content')));
  }

  public find(n: string): Post {
    for (let x of this.posts) {
      if (x.PostId === n) {
         return x;
      }
    }
    return undefined;
  }
  public pickPost(n: string) {
    let a = new PostDetail( this.find(n) );
    a.replaceChild( (<HTMLElement>document.querySelector('.main-content')));
  }


  public showPosts( ) {
    // const sortedPosts = posts.sort((a, b) => a.createdAt.valueOf() - b.createdAt.valueOf());
    const sortedPosts = this.posts;
    let pm = sortedPosts.map(post => new PostItem(post));
    let gg = this.node.querySelector('div>div');
    if (sortedPosts.length === 0) {
      gg.innerHTML = `<div style=${noDataAvailableStyles}>There are currently no posts available to display</div>`;
    } else {
      gg.innerHTML = `<ul style=${ulStyles}></ul>`;
      let gh = <HTMLElement>gg.firstElementChild;
      pm.map(post => { post.appendTo(gh); });
      console.log(gh);
    }
  }

  public static createPost(fm: HTMLCollection) {
    let p = new Post();
    p.Title = (<HTMLInputElement>(fm.namedItem('title'))).value;
    p.Body = (<HTMLTextAreaElement>(fm.namedItem('body'))).textContent;
    p.Author = App.singleton.currentUser.username;
    p.Gravatar = App.singleton.currentUser.gravatar;

    fetch( API_URL + "post", p, (rs) => {
        alert("post created: "+rs);
    });
  };

  public getPosts() {
    fetch( API_URL+ "posts", undefined, (rs) => {
      let a = JSON.parse(rs);
      this.posts = a.Items;
      this.showPosts();
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
