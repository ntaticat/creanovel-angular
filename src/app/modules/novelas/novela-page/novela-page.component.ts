import { Component, OnInit } from '@angular/core';
import { INovela } from 'src/app/data/models/novela.interface';

@Component({
  selector: 'app-novela-page',
  templateUrl: './novela-page.component.html',
  styleUrls: ['./novela-page.component.scss']
})
export class NovelaPageComponent implements OnInit {

  novela: INovela = {
    _id: "21312",
    titulo: "Titulo genérico 1",
    descripcion: "Desc generica 1",
    estado: false,
    escenas: []
  };

  constructor() { }

  ngOnInit(): void {
  }

}
