import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-novelas-creator-detail-page',
  templateUrl: './novelas-creator-detail-page.component.html',
  styleUrl: './novelas-creator-detail-page.component.scss',
})
export class NovelasCreatorDetailPageComponent {
  novelaId!: string;

  constructor(private route: ActivatedRoute) {}
}
