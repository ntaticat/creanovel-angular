import { Component, OnInit } from '@angular/core';
import { INovela } from '@models/novela.interfaces';
import * as faIcons from "@fortawesome/free-solid-svg-icons";
import { Router } from '@angular/router';

@Component({
  selector: 'app-novelas-creator-page',
  templateUrl: './novelas-creator-page.component.html',
  styleUrls: ['./novelas-creator-page.component.scss']
})
export class NovelasCreatorPageComponent implements OnInit {

  faIcons = faIcons;

  novelasCreadas: INovela[] = [];


  constructor(private router: Router) {
  }

  ngOnInit(): void {
  }

  goNovelaPage(novelaIndex: number) {
    const novelaInfo = this.novelasCreadas[novelaIndex];
    this.router.navigate(['novelas-creator', novelaInfo.novelaId]);
  }
}
