import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as faIcons from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-novela-page',
  templateUrl: './novela-page.component.html',
  styleUrls: ['./novela-page.component.scss'],
})
export class NovelaPageComponent implements OnInit {
  faIcons = faIcons;
  novelaId: string = '';

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe(params => {
      this.novelaId = params['id'];
    });
  }

  ngOnInit(): void {}
}
