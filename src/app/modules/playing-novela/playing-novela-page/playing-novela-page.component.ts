import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { INovela } from '@models/novela.interfaces';
import { NovelasService } from '@services/novelas.service';
import { PlayingNovelaComponent } from './playing-novela/playing-novela.component';

@Component({
  selector: 'app-playing-novela-page',
  templateUrl: './playing-novela-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PlayingNovelaComponent, RouterLink, FaIconComponent],
})
export class PlayingNovelaPageComponent implements OnInit {
  faArrowLeft = faArrowLeft;

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

  ngOnInit() {
    this.novelasService.getNovela(this.novelaId).subscribe(novela => {
      this.novelaInfo = novela;
    });
  }
}
