import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-playing-novela-page',
  templateUrl: './playing-novela-page.component.html',
  styleUrls: ['./playing-novela-page.component.scss']
})
export class PlayingNovelaPageComponent implements OnInit {

  novelaId: string = "";

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe((params) => {
      this.novelaId = params["id"];
    });
  }

  async ngOnInit() {
    const novelaWasPlayed = await this.isNovelaInLecturas(this.novelaId);
  }

  isNovelaInLecturas(novelaId: string): Promise<boolean> {
    return new Promise((resolve) => {
    });
  }



}
