import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-novela-conversation',
  templateUrl: './novela-conversation.component.html',
  styleUrls: ['./novela-conversation.component.scss']
})
export class NovelaConversationComponent implements OnInit {

  @Input() text?: string = "";

  constructor() { }

  ngOnInit(): void {
  }

}
