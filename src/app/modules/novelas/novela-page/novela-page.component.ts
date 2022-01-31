import { Component, OnInit } from '@angular/core';
import * as faIcons from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-novela-page',
  templateUrl: './novela-page.component.html',
  styleUrls: ['./novela-page.component.scss']
})
export class NovelaPageComponent implements OnInit {

  faIcons = faIcons;

  constructor() {
  }

  ngOnInit(): void {
  }

}
