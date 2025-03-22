import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as faIcons from '@fortawesome/free-solid-svg-icons';
import { INovela } from '@models/novela.interfaces';
import { NovelasService } from '@services/novelas.service';

@Component({
  selector: 'app-novela-page',
  templateUrl: './novela-page.component.html',
  styleUrls: ['./novela-page.component.scss'],
})
export class NovelaPageComponent implements OnInit {
  faIcons = faIcons;
  novelaId: string = '';
  novelaInfo?: INovela;

  constructor(
    private activatedRoute: ActivatedRoute,
    private novelasService: NovelasService
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.novelaId = params['id'];
    });
  }

  ngOnInit(): void {}
}
