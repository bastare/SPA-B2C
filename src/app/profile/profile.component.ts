/** @format */

import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MsalService, BroadcastService } from '@azure/msal-angular';
import { InteractionRequiredAuthError, AuthError } from 'msal';
import { apiConfig } from '../app-config';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: any;
  token: string;

  root: string = 'https://localhost:44310/api/auth';
  res: [];

  constructor(
    private broadcastService: BroadcastService,
    private authService: MsalService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getProfile(apiConfig.webApi);

    this.broadcastService.subscribe('msal:acquireTokenSuccess', payload => {
      this.token = payload.accessToken;
    });

    this.broadcastService.subscribe('msal:acquireTokenFailure', payload => {
      console.log('access token acquisition fails');
      console.log(payload);
    });
  }

  getData() {
    var reqHeader = new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });
    this.http.get(this.root, { headers: reqHeader }).subscribe(
      res => (this.res = res as []),
      errr => console.error(errr)
    );
  }

  getProfile(url: string) {
    this.http.get(url).subscribe({
      next: profile => {
        console.log(profile);
      },
      error: (err: AuthError) => {
        if (InteractionRequiredAuthError.isInteractionRequiredError(err.errorCode)) {
          this.authService
            .acquireTokenPopup({
              scopes: this.authService.getScopesForEndpoint(url)
            })
            .then(() => {
              this.http
                .get(url)
                .toPromise()
                .then(profile => {
                  this.profile = profile;
                });
            });
        }
      }
    });
  }
}
