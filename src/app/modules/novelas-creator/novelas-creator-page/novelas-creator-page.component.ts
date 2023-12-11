import { Component, OnInit } from '@angular/core';
import { INovela } from '@models/novela.interfaces';
import * as faIcons from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { IUsuario } from '@models/usuario.interfaces';

@Component({
  selector: 'app-novelas-creator-page',
  templateUrl: './novelas-creator-page.component.html',
  styleUrls: ['./novelas-creator-page.component.scss'],
})
export class NovelasCreatorPageComponent implements OnInit {
  usuarioData: IUsuario = this.route.snapshot.data['usuarioData'];

  faIcons = faIcons;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {}
}
