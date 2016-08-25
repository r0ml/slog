
import MarkdownIt from './markdown-it';
import * as Hljs from './highlightjs';
import { Component, StyleN, node } from './utils';
import { Post, TimeAgo } from './Posts';
import { App } from './app';
import * as Style from './Styles';
import {CommentItem, Comment, Comments} from './Comment';

const md = new MarkdownIt();
md.options = {
  linkify: true,
  html: true,
  breaks: true,
  highlight: (str, lang) => {
    if (lang && Hljs.getLanguage(lang)) {
      try {
        return (
          '<pre><code class="hljs">' +
          Hljs.highlight(lang, str, true).value +
          '</code></pre>'
        );
      } catch (__) {
        // Don't fail
      }
    }
    return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
  },
};


export class PostDetail extends Component {
  public state : Post;

  /*
  constructor(props) {
     super(props);

    this.state = {editing: false, title: '', body: ''};
  }
*/

  public onEditPost() {
    /*
    const { post } = this.props;
    this.setState({editing: true, title: post.title, body: post.body.replace(/<br\s*[\/]?>/gi, "\n")});
    */
    alert("Edit post");
  }

  public onUpdatePost(event) {
    /*
    this.props.onUpdatePost(this.state);

    this.setState({editing: false});
    this.props.post.title = this.state.title;
    this.props.post.body = this.state.body.replace(/<br\s*[\/]?>/gi, "\n");
    */
    alert("Update post");
  }

  constructor(editing: boolean, post: Post) {
    // const { post, isAuthor } = this.props;
    // const { editing, title, body } = this.state;
    post.Body = post.Body.replace(/<br\s*[\/]?>/gi, "\n");
    let isAuthor = App.singleton.currentUser && post.Author === App.singleton.currentUser.username;
    let z = super( post ? node `
      <div class="row">
        <div class="twelve columns">
            <div>
              <ul style=${Style.postUlStyles}>
                <li key="post-${post.PostId}" style=${Style.postLiStyles}>
                  <h1 style=${Style.postTitleStyles}>
                    ${editing ?
                      `<input class="u-full-width" type="text" value=${post.Title} name="postTitle"/> `
                      : post.Title}
                  </h1>
                  <hr style=${Style.hrStyles}/>
                  ${editing ? `<textarea class="u-full-width" value=${post.Body} name="postBody" />`
                   : `<div>${md.render(post.Body)}</div>` }
                  <hr style=${Style.hrStyles}/>
                  ${new TimeAgo(new Date(post.CreatedAt)) }
                  ${isAuthor ? (
                    editing ? `<div>
                        <button style=${Style.deletePostStyles} name="deletePost">
                          <i class="fa fa-times"></i>
                        </button>
                        <button style=${Style.editPostStyles} name="updatePost">
                          <i class="fa fa-check"></i>
                        </button>
                      </div>`
                    : `
                      <div>
                        <button style=${Style.deletePostStyles} name="deletePost">
                          <i class="fa fa-trash"></i>
                        </button>
                        <button style=${Style.editPostStyles} name="updatePost">
                          <i class="fa fa-pencil-square-o"></i>
                        </button>
                      </div>
                    `
                  ) : ""}
                  <span style=${Style.postAuthorStyles}><img style=${Style.gravatarStyles}
                                                      src=${post.Gravatar}/> ● ${post.Author}</span>
                  <div style=${Style.clearStyles}></div>
                </li>
              </ul>
              ${new CommentItem(true, new Comment)}
              ${new Comments(post.PostId)}
              <div class="placeholder-for-comment-list"></div>
              
            </div>
          </div>
        </div>
      </div>
    ` : node `<div style=${Style.noDataAvailableStyles}>Seems like this post is not available <br /><a href="#/">Go back</a> `
    );

    // The reason this cannot be interpolated is that interpolation converts the node to outerhtml,
    // and loses its identity, so it can no longer be modified.
    // consequently, it needs to be appended-to
    // let ph = <HTMLElement>(this.node).querySelector(".placeholder-for-comment-list");
    // (new CommentItem(true, new Comment)).appendTo(ph);
    // (new Comments(post.PostId)).appendTo(ph);
  };
}

/*
class PostDetailContainer extends Component {
  public handleUpdatePost(post) {
    const id = this.props.params.id;
    const title = post.title;
    const body = post.body.replace(/(?:\r\n|\r|\n)/g, '<br />');

    if (title.length !== 0 && body.length !== 0) {
      const post = {
        id: id,
        title: title,
        body: body,
        jwt: this.props.currentUser.jwt
      };

      this.props.updatePost(post);
    } else {
      alert('You can not submit an empty title or empty body');
    }
  }

  public handleDeletePost(post) {
    const id = this.props.params.id;

    if (confirm('Do you really want to delete this post?')) {
      const post = {
        id,
        jwt: this.props.currentUser.jwt
      };

      this.props.deletePost(post);
    }
  }

  public handleUpdateComment(comment) {
    const id = comment.id;
    const body = comment.body.replace(/(?:\r\n|\r|\n)/g, '<br />');

    if (body.length !== 0) {
      const comment = {
        id: id,
        body: body,
        jwt: this.props.currentUser.jwt
      };

      this.updateComment(comment);
    } else {
      alert('You can not submit an empty body');
    }
  }

  public handleDeleteComment(comment) {
    const id = comment.id;

    if (confirm('Do you really want to delete this comment?')) {
      const comment = {
        id,
        jwt: this.props.currentUser.jwt
      };

      this.deleteComment(comment);
    }
  }

  public render() {
    const { post, comments, currentUser } = this.props;

    if(!post) {
      return `<div>Loading...</div>`;
    }

    return (
        <div>
            <PostDetail
                post={ post }
    isAuthor={ currentUser && post.author.id === currentUser.id }
    onUpdatePost={this.handleUpdatePost.bind(this)}
    onDeletePost={this.handleDeletePost.bind(this)}
  />
    <CommentNewContainer
        post={ post }
    currentUser={ currentUser }
    />
    <Comments
        comments={ comments }
    currentUser={ currentUser }
    onUpdateComment={this.handleUpdateComment.bind(this)}
    onDeleteComment={this.handleDeleteComment.bind(this)}
  />
    </div>
  );
  }

}
*/

