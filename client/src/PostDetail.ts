/// <reference path="markdown-it.d.ts" />
/// <reference path="highlightjs.d.ts" />

import MarkdownIt from './markdown-it';
import * as Hljs from './highlightjs';  // './dependencies';
import { Component, StyleN } from './utils';
import { Post, TimeAgo } from './Posts';

// import { getPost, updatePost, deletePost } from './posts';
// import { Comments, CommentNewContainer, updateComment, deleteComment } from './Comment';



const postUlStyles = new StyleN({
  marginBottom: '10px'
});

const postLiStyles = new StyleN({
  border: '1px solid #E1E1E1',
  padding: '10px',
  listStyle: 'none'
});

const postTitleStyles = new StyleN({
  fontSize: '20px',
  marginBottom: '0px'
});

const deletePostStyles = new StyleN({
  marginLeft: '10px',
  float: 'right'
});

const editPostStyles = new StyleN({
  marginLeft: '10px',
  float: 'right'
});

const postAuthorStyles = new StyleN({
  fontStyle: 'italic',
  float: 'right',
  color: '#B1B1B1'
});

const hrStyles = new StyleN({
  margin: '10px 0px'
});

const clearStyles = new StyleN({
  clear: 'both'
});

const noDataAvailableStyles = new StyleN({
  marginTop: '20px',
  textAlign: 'center'
});

const timeAgoStyles = new StyleN({
  fontStyle: 'italic',
  color: '#B1B1B1',
  float: 'left'
});

const gravatarStyles = new StyleN({
  'height': '30px',
  'display': 'inline-block'
});

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

  constructor(post: Post) {
    // const { post, isAuthor } = this.props;
    // const { editing, title, body } = this.state;
    post.Body = post.Body.replace(/<br\s*[\/]?>/gi, "\n");

    super(`
      <div class="row">
        <div class="twelve columns">
          {post ? (
            <div>
              <ul style=${postUlStyles}>
                <li key="post-${post.PostId}" style=${postLiStyles}>
                  <h1 style=${postTitleStyles}>
                    {editing ? (
                      <input class="u-full-width" type="text" value={title} name="postTitle"/>
                    ) : post.title}
                  </h1>
                  <hr style=${hrStyles}/>
                  {editing ? (
                    <textarea class="u-full-width" value={body} name="postBody" />
                  ) : <div>${md.render(post.Body)}></div>}
                  <hr style=${hrStyles}/>
                  ${new TimeAgo(post.CreatedAt) } style=${timeAgoStyles}/>
                  {isAuthor ? (
                    editing ? (
                      <div>
                        <button style=${deletePostStyles} name="deletePost">
                          <i class="fa fa-times"></i>
                        </button>
                        <button style=${editPostStyles} name="updatePost">
                          <i class="fa fa-check"></i>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <button style=${deletePostStyles} name="deletePost">
                          <i class="fa fa-trash"></i>
                        </button>
                        <button style=${editPostStyles} name="updatePost">
                          <i class="fa fa-pencil-square-o"></i>
                        </button>
                      </div>
                    )
                  ) : null}
                  <span style=${postAuthorStyles}><img style=${gravatarStyles}
                                                      src=${post.Gravatar}/> ● ${post.Author}</span>
                  <div style=${clearStyles}></div>
                </li>
              </ul>
            </div>
          ) : <div style=${noDataAvailableStyles}>Seems like this post is not available <br /><a href="#/">Go back</a>
          </div> }
        </div>
      </div>
    `);
  }
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
  `);
  }

}
*/

