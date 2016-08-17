
import { Hljs, MarkdownIt } from './dependencies';
import { API_URL, App } from "./app";
import { Component, fetch, StyleN, style } from "./utils";

const hrStyles = new StyleN({
  margin: '10px 0px'
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

const commentLiStyles = new StyleN({
  border: '1px solid #E1E1E1',
  padding: '10px',
  marginLeft: '50px',
  listStyle: 'none',
});

const commentBodyStyles = new StyleN({
  margin: '0px'
});

const commentAuthorStyles = new StyleN({
  fontStyle: 'italic',
  float: 'right',
  color: '#B1B1B1',
});

const deleteCommentStyles = new StyleN({
  marginLeft: '10px',
  float: 'right',
  border: '0',
  padding: '10px',
  margin: '0',
});

const updateCommentStyles = new StyleN({
  marginLeft: '10px',
  float: 'right',
  border: '0',
  padding: '10px',
  margin: '0',
});

const md = new MarkdownIt({
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
});

export class Comment extends Component {
  private editing: boolean;
  private body: string;
  protected postId: string;
  protected jwt: string;

  /*constructor(parent: HTMLElement) {
    super();
    this.editing = false;
    this.body = '';
  }*/

  public onEditComment() {
    const { comment } = this.props;
    this.editing = true;
    this.body = comment.body.replace(/<br\s*[\/]?>/gi, "\n");
  }

  public onUpdateComment(event) {
    event.preventDefault();

    const comment = {
      id: this.props.comment.id,
      body: this.body
    };

    this.props.onUpdateComment(comment);

    this.editing = false;
    this.props.comment.body = this.body.replace(/<br\s*[\/]?>/gi, "\n");
  }

  constructor() {
    const { comment, isAuthor } = this.props;
    comment.body = comment.body.replace(/<br\s*[\/]?>/gi, "\n");

    super(
`      <li style=${commentLiStyles}>
        <p style=${commentBodyStyles}>
          {editing ? (
            <Textarea class="u-full-width" value={body} onChange={event => {this.setState({body: event.target.value})}} />
          ):<div dangerouslySetInnerHTML={{ __html: md.render(comment.body) }}></div>}
        </p>
        <hr style=${hrStyles}/>
        <TimeAgo date={+comment.createdAt} style=${timeAgoStyles}/>
        {isAuthor ? (
          editing ? (
            <div>
              <button style=${deleteCommentStyles} onClick={() => {this.setState({editing: false, body: comment.body})}}>
                <i class="fa fa-times"></i>
              </button>
              <button style=${updateCommentStyles} onClick={this.onUpdateComment.bind(this)}>
                <i class="fa fa-check"></i>
              </button>
            </div>
          ): (
            <div>
              <button style=${deleteCommentStyles} type="submit" formaction="#/deleteComment">
                <i class="fa fa-trash"></i>
              </button>
              <button style=${updateCommentStyles} onClick={this.onEditComment.bind(this)}>
                <i class="fa fa-pencil-square-o"></i>
              </button>
            </div>
          )
        ) : null}
              <span style=${commentAuthorStyles}>
                <img style=${gravatarStyles}
                     src={comment.author.gravatar}/>
                ● {comment.author.username}
              </span>
        <div style=${clearStyles}></div>
      </li>
 `   );
  }
  public createComment() {
     fetch(API_URL+"addComment", this, function(x) { alert("comment created: "+x); });
  }
  public updateComment() {
      fetch(API_URL+"updateComment", this, function(x) { alert("comment updated: "+x); });
  }
  public deleteComment() {
      fetch(API_URL+"deleteComment", this.commentId, function(x) { alert("comment deleted: "+x); });
  }
}

const noDataAvailableStyles = new StyleN({
  marginTop: '20px',
  textAlign: 'center'
});

const commentUlStyles = new StyleN({marginBottom: '10px'});

export class Comments extends Component {
  public isCurrentUserAuthor(authorId) : boolean {
    const { currentUser } = this.props;
    return currentUser && authorId === currentUser.id
  }

  public render() : string {
    const { comments, onUpdateComment, onDeleteComment } = this.props;

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

  public onChangeBody(event) {
    this.setState({body: event.target.value});
  }

  public onSubmit(event) {
    event.preventDefault();

    this.props.onSubmitForm(this.state);
    this.setState({ body: '' });
  }

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

    super (`
        <div>
            <form action="#/addComment">
    <textarea style=${textareaStyles} placeholder="Body" class="u-full-width" onChange={this.onChangeBody.bind(this)} value={this.state.body}></textarea>
    <input type="submit" class="button button-primary" value="Create comment" />
        </form>
        </div>
  `);
  }
}

// -============================================================================================================

export class CommentNewContainer {
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
