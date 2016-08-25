

import MarkdownIt from './markdown-it';
import * as Hljs from './highlightjs';
import { API_URL, App } from "./app";
import { Component, fetch, StyleN, style, node } from "./utils";
import { TimeAgo } from "./Posts";
import * as Style from "./Styles";

const md = new MarkdownIt();
md.options = {
  linkify: true,
  html: true,
  breaks: true,
  highlight: (str, lang) => {
    if (lang && Hljs.getLanguage(lang)) {
      try {
        return (`
          '<pre><code class="hljs">' +
          Hljs.highlight(lang, str, true).value +
          '</code></pre>'
        `);
      } catch (__) {
        // Don't fail
      }
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  },
};

export class Comment {
  public PostId: string;
  public CommentId: string;
  public Title: string;
  public Body: string;
  public Author: string;
  public Gravatar: string;
  public CreatedAt: string;
}

export class CommentItem extends Component {
  private editing: boolean;
  protected comment: Comment;


  // this.body = comment.body.replace(/<br\s*[\/]?>/gi, "\n");

  constructor(editing: boolean, comment: Comment) {
    if (comment.Body === undefined) {
      comment.Body = "";
    }
    // comment.body = comment.body.replace(/<br\s*[\/]?>/gi, "\n");
    let isAuthor = editing || (App.singleton.currentUser && comment.Author === App.singleton.currentUser.username);
    super(node `
      <li style=${Style.commentLiStyles}>
        <p style=${Style.commentBodyStyles}>
          ${editing ? `<textarea class="u-full-width" placeholder="new comment">${comment.Body}</textarea>` : `<div>${md.render(comment.Body)}</div>` }
        </p>
        <hr style=${Style.hrStyles}/>
        ${new TimeAgo(new Date(comment.CreatedAt) ) }
        ${isAuthor ? (
          editing ? `
            <div>
              <button style=${Style.deleteCommentStyles} name="deleteComment">
                <i class="fa fa-times"></i>
              </button>
              <button style=${Style.updateCommentStyles} name="updateCommment">
                <i class="fa fa-check"></i>
              </button>
            </div>
          `: `
            <div>
              <button style=${Style.deleteCommentStyles} type="submit" formaction="#/deleteComment">
                <i class="fa fa-trash"></i>
              </button>
              <button style=${Style.updateCommentStyles} name="updateComment">
                <i class="fa fa-pencil-square-o"></i>
              </button>
            </div>
          `
        ) : undefined }
              <span style=${Style.commentAuthorStyles}>
                <img style=${Style.gravatarStyles}
                     src=${comment.Gravatar}/>
                ● ${comment.Author}
              </span>
        <div style=${Style.clearStyles}></div>
      </li>
 `   );
    this.comment = comment;
  }
  public createComment() {
     fetch(API_URL+"addComment", this, function(x) { alert("comment created: "+x); });
  }
  public updateComment() {
      fetch(API_URL+"updateComment", this, function(x) { alert("comment updated: "+x); });
  }
  public deleteComment() {
      fetch(API_URL+"deleteComment", this.comment.CommentId, function(x) { alert("comment deleted: "+x); });
  }
}

const noDataAvailableStyles = new StyleN({
  marginTop: '20px',
  textAlign: 'center'
});

const commentUlStyles = new StyleN({marginBottom: '10px'});

export class Comments extends Component {
  protected comments: [Comment];

  constructor(postId: string) {
    super(`<div></div>`);
    this.getComments(postId);
  }

  public getComments(postId: string) {
    fetch( API_URL+ "comments", postId, (rs) => {
      let a = JSON.parse(rs);
      this.comments = a.Items;
      this.showComments();
    });
  }

  public showComments() {
    const sortedComments = this.comments;
    let pm = sortedComments.map(comment => new CommentItem(false, comment));
    let gg = this.node;
    if (sortedComments.length === 0) {
      gg.innerHTML = `<div style=${Style.noDataAvailableStyles}>There are currently no comments available to display</div>`;
    } else {
      gg.innerHTML = `<ul style=${Style.ulStyles}></ul>`;
      let gh = <HTMLElement>gg.firstElementChild;
      pm.map(comment => { comment.appendTo(gh); });
      console.log(gh);
    }
  }
  /*

    const sortedComments = comments.length ? _.orderBy(comments, 'createdAt', ['desc']) : [];

    if (!sortedComments.length) {
      return (`
          <div style=${noDataAvailableStyles}>There are no comments written yet</div>
    `);
    }

    super (`
        <div>
            <h4 style=${headlineStyles}>Comments</h4>
        <ul style=${commentUlStyles}>
            {sortedComments.map((comment) => {
              return (
                  <Comment
                      key={\`comment-${comment.id}\`}
              comment={ comment }
              isAuthor={ this.isCurrentUserAuthor(comment.author.id) }
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
                  />
              )
            })}
    </ul>
    </div>
    `
  );
  }
  */

}

const needToSignInStyles = new StyleN({
  textAlign: 'center'
});

const textareaStyles = new StyleN({
  height: '100px'
});

const headlineStyles = new StyleN({
  textAlign: 'center'
});

export class CommentForm extends Component {
  constructor(body: string) {

    const isLoggedIn = App.singleton.currentUser !== undefined;

    if (!isLoggedIn) {
      super(
          `<div style=${needToSignInStyles}>
            <span>You need to </span><Link to="/sign-in">sign in</Link> <span>to create a new comment</span>
    </div>`
      );
      return;
    }

    super (node `
        <div>
            <form action="#/addComment">
    <textarea style=${textareaStyles} placeholder="Body" class="u-full-width" value=${body}></textarea>
    <input type="submit" class="button button-primary" value="Create comment" />
        </form>
        </div>
  `);
  }
}

// -============================================================================================================
/*
export class CommentNewContainer extends Component {
  public handleCreateComment(comment) {

    const body = comment.body.replace(/(?:\r\n|\r|\n)/g, '<br />');

    if (body.length !== 0) {
      const post = {
        body,
        postId: this.props.post.id,
        jwt: this.props.currentUser.jwt
      };

      this.props.createComment(post);
    } else {
      alert('Please fill out all fields');
    }
  }

  constructor() {
    super(`
        <div>
            <CommentForm
                isLoggedIn=${App.singleton.currentUser.username}
    onSubmitForm={this.handleCreateComment.bind(this)}
  />
    </div>
  `);
  }
}
*/
