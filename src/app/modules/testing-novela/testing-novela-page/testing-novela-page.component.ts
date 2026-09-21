import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlayingNovelaComponent } from '../../playing-novela/playing-novela-page/playing-novela/playing-novela.component';

@Component({
  selector: 'app-testing-novela-page',
  templateUrl: './testing-novela-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PlayingNovelaComponent],
})
export class TestingNovelaPageComponent implements OnInit {
  novelaId: string = '';

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe(params => {
      this.novelaId = params['id'];
    });
  }

  ngOnInit(): void {}
}
