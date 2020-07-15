/** @format */

import { Component, OnInit } from '@angular/core';
import { BroadcastService, MsalService } from '@azure/msal-angular';
import { Logger, CryptoUtils } from 'msal';
import { isIE, b2cPolicies } from './app-config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Azure AD B2C';
  isIframe = false;
  loggedIn = false;

  constructor(private broadcastService: BroadcastService, private authService: MsalService) {}

  ngOnInit() {
    this.isIframe = window !== window.parent && !window.opener;

    this.checkAccount();

    this.broadcastService.subscribe('msal:loginSuccess', success => {
      if (success.idToken.claims['tfp'] !== b2cPolicies.names.signUpSignIn) {
        window.alert(
          'Password has been reset successfully. \nPlease sign-in with your new password'
        );
        return this.authService.logout();
      }

      console.log('login succeeded. id token acquired at: ' + new Date().toString());
      console.log(success);

      this.checkAccount();
    });

    this.broadcastService.subscribe('msal:loginFailure', error => {
      console.log('login failed');
      console.log(error);

      // Check for forgot password error
      // Learn more about AAD error codes at https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes
      if (error.errorMessage.indexOf('AADB2C90118') > -1) {
        if (isIE) {
          this.authService.loginRedirect(b2cPolicies.authorities.resetPassword);
        } else {
          this.authService.loginPopup(b2cPolicies.authorities.resetPassword);
        }
      }
    });

    // redirect callback for redirect flow (IE)
    this.authService.handleRedirectCallback((authError, response) => {
      if (authError) {
        console.error('Redirect Error: ', authError.errorMessage);
        return;
      }

      console.log('Redirect Success: ', response);
    });

    this.authService.setLogger(
      new Logger(
        (logLevel, message, piiEnabled) => {
          console.log('MSAL Logging: ', message);
        },
        {
          correlationId: CryptoUtils.createNewGuid(),
          piiLoggingEnabled: false
        }
      )
    );
  }

  // other methods
  checkAccount() {
    this.loggedIn = !!this.authService.getAccount();
  }

  login() {
    if (isIE) {
      this.authService.loginRedirect();
    } else {
      this.authService.loginPopup();
    }
  }

  logout() {
    this.authService.logout();
  }
}