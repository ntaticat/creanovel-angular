import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NovelasComponent } from './novelas/novelas.component';

@Component({
  selector: 'app-novelas-page',
  templateUrl: './novelas-page.component.html',
  styleUrls: ['./novelas-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NovelasComponent],
})
export class NovelasPageComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
