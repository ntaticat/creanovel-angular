import { Input } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-novela',
  templateUrl: './novela.component.html',
  styleUrls: ['./novela.component.scss']
})
export class NovelaComponent implements OnInit {

  @Input() novelaId: string = "";

  constructor(private activatedRoute: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.novelaId = params['id'];
      console.log(this.novelaId);
    });
  }
}
