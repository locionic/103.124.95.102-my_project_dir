import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FolderUserStore } from '../../services/folder-user-store.store';

@Component({
  selector: 'app-upload-file-task',
  templateUrl: 'upload-file-task.component.html',
  styleUrls: ['upload-file-task.component.scss'],
})
export class UploadFileTaskComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() file: File;
  subject = new BehaviorSubject<number>(0);
  percentage$ = this.subject.asObservable();
  color: string = 'primary';
  isPause: boolean = false;
  seconds: number = 10;
  isRootFolder: boolean = true;
  subjectDestroy = new Subject();

  constructor(public serviceStore: FolderUserStore) {}

  ngOnDestroy(): void {
    this.subjectDestroy.next();
    this.subjectDestroy.complete();
  }

  ngOnInit() {
    this.subject.pipe(takeUntil(this.subjectDestroy)).subscribe((res) => {
      setTimeout(() => {
        if (res == 100) this.color = 'warn';
      }, 500);
    });
    this.startUpload();
  }

  ngAfterViewInit(): void {}

  startUpload() {
    this.serviceStore.createNewFile(this.serviceStore.activeOcrNode, this.file);
    this.subject.next(100);
  }

  getFileName() {
    const maxLength = 20;
    const length = this.file.name.length;
    let name = this.file.name.substr(0, maxLength);
    if (length > maxLength) {
      let split = this.file.name.split('.');
      name = name + '...' + split[split.length - 1];
    }
    return this.file.name;
  }

  clickPlay() {
    this.isPause = false;
  }

  clickPause() {
    this.isPause = true;
  }
}
