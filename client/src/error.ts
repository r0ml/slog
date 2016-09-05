
import {Component} from "./utils";

const styles = {
  backgroundColor: '#FC9D9A',
  padding: '1em',
  marginBottom: '1em'
};

export class Error extends Component {
  private message: string;

  public static componentDidMount() {
    setTimeout(() => {
      return {
        type: 'RESET_ERROR'
      };
    }, 5000);
  }

  public static handleDismissClick(event) {
    event.preventDefault();
    return {
      type: 'RESET_ERROR'
    };
  }

  constructor(message: string) {
    super(`
      <div class="row">
        <div class="twelve columns" style={styles}>
          An error occurred: "${message}"
          <a href="#" class="u-pull-right">Dismiss</a>
        </div>
      </div>
    `);
  }
}
