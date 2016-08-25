
import { Header, API_URL } from './app';
import { Component, Route, fetch, node } from './utils';

export class User {
  public email: string;
  public username: string;
  public password: string;
  public gravatar: string;

  constructor( email: string,  username: string,  password: string) {
    this.email = email;
    this.username = username;
    this.password = password;
  }

  public toString() : string {
    return JSON.stringify(this);
  }

  public signIn() {
    console.log("Signing in...");
    let upx = {"email":this.email, "password": this.password};
    fetch( API_URL + "login", upx, (a: string) => {
      let b = JSON.parse(a);

      this.gravatar = b.gravatar;
      Header.singleton.setCurrentUser(this);
    } );

    /*
        id
        username
        email
        jwt
        gravatar
     */
  }
}

// ================================================================

// import React, { Component } from 'react';
// import { connect } from 'react-redux';
// import { signUp } from '../../actions/users';
// import { Link } from 'react-router';

export class SignUp extends Component {
  public static handleSignUp(event: HTMLCollection ) {

    const email = (<HTMLInputElement> event.namedItem('email')).value;
    const username = (<HTMLInputElement> event.namedItem('username')).value;
    const password = (<HTMLInputElement> event.namedItem('password')).value;
    const passwordConfirmation = (<HTMLInputElement> event.namedItem('passwordConfirmation')).value;

    if (email.length === 0 || password.length === 0 || passwordConfirmation.length === 0) {
      alert('Please fill out all fields');
    } else if (password !== passwordConfirmation) {
      alert('Passwords do not match');
    } else {
      const user = new User(
        email,
        username,
        password
      );
      fetch(API_URL+"register", user, function(result) {
        alert(result);
      });
      // user.signUp();
    }
  }

  constructor() {
    super(node ` <div class="row">
    <div class="four columns offset-by-four">
        <form action="#/sign-up">
    <h1>Sign up</h1>
    <input type="email" placeholder="E-Mail" class="u-full-width" name="email" />
    <input type="text" placeholder="Username" class="u-full-width" name="username" />
    <input type="password" placeholder="Password" class="u-full-width" name="password" />
    <input type="password" placeholder="Confirm password" class="u-full-width" name="passwordConfirmation" />
    <input type="submit" class="button button-primary u-full-width" value="Sign up" />
        </form>
        Already have an account? <a href="#/sign-in">Sign in</a>
        </div>
        </div>
  `);
    Route.defineLink("/sign-up", Header.signUp );
    Route.defineForm("/sign-up", SignUp.handleSignUp);
  }
}

export class SignIn extends Component {

  public static handleSignIn(event: HTMLCollection) {
    const email = <HTMLInputElement> event.namedItem('email');
    const password = <HTMLInputElement> event.namedItem('password');

    if (email.value.length === 0 || password.value.length === 0) {
      alert('Please fill out all fields');
    } else {
      const user = new User(email.value, "", password.value);
      user.signIn();
    }
  }



    constructor() {
      super(node `<div class="row">
        <div class="four columns offset-by-four">
          <form action="#/sign-in">
            <h1>Sign in</h1>
            <input type="email" placeholder="E-Mail" class="u-full-width" name="email"/>
            <input type="password" placeholder="Password" class="u-full-width" name="password"/>
            <input type="submit" class="button button-primary u-full-width" value="Sign in"/>
          </form>
          Don't have an account? <a href="#/sign-up">Sign up</a>
        </div>
        </div>
     `);
      Route.defineLink("/sign-in", Header.signIn );
      Route.defineForm("/sign-in", SignIn.handleSignIn ) ;
     }
  }

