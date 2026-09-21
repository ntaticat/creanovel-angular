import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { INovela } from '@models/novela.interfaces';
import { NovelasService } from '@services/novelas.service';
import { UploadsService } from '@services/uploads.service';

@Component({
  selector: 'app-novela-page',
  templateUrl: './novela-page.component.html',
  styleUrls: ['./novela-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink],
})
export class NovelaPageComponent implements OnInit {
  novelaId: string = '';
  novelaInfo?: INovela;

  constructor(
    private activatedRoute: ActivatedRoute,
    private novelasService: NovelasService,
    private uploadsService: UploadsService
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.novelaId = params['id'];
    });
  }

  ngOnInit(): void {
    this.novelasService
      .getNovela(this.novelaId, 'True', 'True', 'True')
      .subscribe(novela => {
        this.novelaInfo = novela;
      });
  }

  get estaPublicada(): boolean {
    return !!this.novelaInfo?.versiones?.some(v => v.disponible);
  }

  get portadaUrl(): string {
    return this.uploadsService.resolveUrl(this.novelaInfo?.portadaImagenUrl);
  }
}
