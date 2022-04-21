import { Component, OnInit } from '@angular/core';
import { INovela } from '@models/novela.interfaces';
import { select, Store } from '@ngrx/store';
import { AppState } from '@store/app.reducer';
import * as usuarioSelectors from '@store/usuarios/usuarios.selectors';
import * as novelaCreatorActions from '@store/novela-creator/novelas-creator.actions';
import * as faIcons from "@fortawesome/free-solid-svg-icons";
import { Router } from '@angular/router';

@Component({
  selector: 'app-novelas-creator-page',
  templateUrl: './novelas-creator-page.component.html',
  styleUrls: ['./novelas-creator-page.component.scss']
})
export class NovelasCreatorPageComponent implements OnInit {

  faIcons = faIcons;

  novelasCreadas: INovela[] = [];


  constructor(private store: Store<AppState>, private router: Router) {
    this.store.pipe(select(usuarioSelectors.usuario)).subscribe((usuario) => {
      if (usuario.novelasCreadas) {
        this.novelasCreadas = usuario.novelasCreadas;
      }
    });
  }

  ngOnInit(): void {
  }

  goNovelaPage(novelaIndex: number) {
    const novelaInfo = this.novelasCreadas[novelaIndex];
    this.router.navigate(['novelas-creator', novelaInfo.novelaId]);
  }
}
