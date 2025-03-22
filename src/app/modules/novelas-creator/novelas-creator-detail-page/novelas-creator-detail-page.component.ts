import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { INovela } from '@models/novela.interfaces';
import { NovelasService } from '@services/novelas.service';

@Component({
  selector: 'app-novelas-creator-detail-page',
  templateUrl: './novelas-creator-detail-page.component.html',
  styleUrl: './novelas-creator-detail-page.component.scss',
})
export class NovelasCreatorDetailPageComponent implements OnInit {
  novelaId!: string;
  novelaInfo?: INovela;

  constructor(
    private route: ActivatedRoute,
    private novelasService: NovelasService
  ) {
    this.route.params.subscribe(params => {
      this.novelaId = params['id'];
    });
  }
  ngOnInit(): void {
    this.novelasService.getNovela(this.novelaId, 'True').subscribe(novela => {
      this.novelaInfo = novela;
    });
  }
}
