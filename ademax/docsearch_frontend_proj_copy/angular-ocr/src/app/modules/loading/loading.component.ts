import { LoadingService } from './loading.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'loading',
  templateUrl: 'loading.component.html',
  styleUrls: ['loading.component.scss'],
})
export class LoadingComponent implements OnInit {
  constructor(public loadingService: LoadingService) {}

  ngOnInit() {}
}
