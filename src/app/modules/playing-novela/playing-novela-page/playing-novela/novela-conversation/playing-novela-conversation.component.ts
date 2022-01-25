import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-playing-novela-conversation',
  templateUrl: './playing-novela-conversation.component.html',
  styleUrls: ['./playing-novela-conversation.component.scss']
})
export class PlayingNovelaConversationComponent implements OnInit {

  @Input() text?: string = "";

  constructor() { }

  ngOnInit(): void {
  }

}
