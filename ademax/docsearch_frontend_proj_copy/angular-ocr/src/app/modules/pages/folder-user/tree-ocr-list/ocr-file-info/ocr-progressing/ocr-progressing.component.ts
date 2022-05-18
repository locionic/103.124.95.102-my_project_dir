import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { OcrNodeModel } from '../../../models/ocr-node.model';

@Component({
  selector: 'ocr-progressing',
  templateUrl: 'ocr-progressing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OcrProgressingComponent implements OnInit, OnChanges {
  @Input('ocrNode')
  ocrNode: OcrNodeModel;
  color: string = 'primary';

  constructor(
    public cd: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.ocrNode) {
      this.cd.detectChanges();
    }
  }

  ngOnInit() {}
}
