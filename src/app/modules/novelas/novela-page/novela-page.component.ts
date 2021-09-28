import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { INovela } from 'src/app/data/models/novela.interface';

@Component({
  selector: 'app-novela-page',
  templateUrl: './novela-page.component.html',
  styleUrls: ['./novela-page.component.scss']
})
export class NovelaPageComponent implements OnInit {

  novelaId: string = "";

  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe((params) => {
      this.novelaId = params["id"];
      console.log("this.novelaId", this.novelaId);
    });

  }

  ngOnInit(): void {
  }

}
