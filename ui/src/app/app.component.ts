import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  IonApp, IonBadge, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote,
  IonSegment, IonSegmentButton, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';

import { apiUrl } from './api';
import { Maintenance } from './maintenance';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, IonApp, IonBadge, IonContent, IonHeader, IonItem, IonLabel, IonList,
    IonNote, IonSegment, IonSegmentButton, IonTitle, IonToolbar,
  ],
  template: `
    <ion-app>
      <ion-header>
        <ion-toolbar><ion-title>{{ title }}</ion-title></ion-toolbar>
        <ion-toolbar>
          <ion-segment [value]="screen()" (ionChange)="screen.set($any($event).detail.value)">
            <ion-segment-button *ngFor="let name of screens" [value]="name">
              <ion-label>{{ name }}</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-note color="danger" *ngIf="error()">{{ error() }}</ion-note>
        <ion-list *ngIf="screen() === screens[0]; else detail">
          <ion-item *ngFor="let item of items()" button (click)="select(item)">
            <ion-label>
              <h2>{{ item.title }}</h2>
              <p>{{ item.reference }}</p>
            </ion-label>
            <ion-badge slot="end" [color]="colour(item.status)">{{ item.status }}</ion-badge>
          </ion-item>
        </ion-list>
        <ng-template #detail>
          <div *ngIf="selected() as item; else empty">
            <h2>{{ item.title }}</h2>
            <p>Reference: {{ item.reference }}</p>
            <p>Status: {{ item.status }}</p>
            <p>Priority: {{ item.priority }}</p>
          </div>
          <ng-template #empty><p>Select a maintenance from the list.</p></ng-template>
        </ng-template>
      </ion-content>
    </ion-app>
  `,
})
export class AppComponent {
  readonly title = "Fleet Inspection And Maintenance";
  readonly screens = ["1", "2", "3", "4", "Guided Vehicle Inspection", "Interaction Details"];
  readonly screen = signal("1");
  readonly items = signal<Maintenance[]>([]);
  readonly selected = signal<Maintenance | null>(null);
  readonly error = signal('');
  private readonly http = inject(HttpClient);

  constructor() {
    this.http.get<Maintenance[]>(apiUrl('/api/maintenances')).subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('Could not reach the API.'),
    });
  }

  select(item: Maintenance): void {
    this.selected.set(item);
    this.screen.set(this.screens[1] ?? this.screens[0]);
  }

  colour(value: string): string {
    return value === 'complete' ? 'success' : value === 'in-progress' ? 'warning' : 'medium';
  }
}
