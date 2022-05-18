import {Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {TreeNode} from "../../module/common/model/TreeModel";
import {TableAlignment, TableColumn} from "../../module/common/model/TableColumn";
import {DocumentSearchService} from "../../module/document/service/document.search.service";
import {MatDialog} from "@angular/material/dialog";
import {StatisticOption} from "../../module/document/model/statistic";
import {StatisticModalComponent} from "./statistic.modal/statistic.modal.component";
import * as _ from "lodash";
import {forkJoin, Observable, Subject, Subscription} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {ActivatedRoute, Router} from "@angular/router";
import {DocumentMetadata} from "../../module/document/model/document.metadata";
import {DatePipe} from "@angular/common";
import {DateRange} from "@angular/material/datepicker";
import {ReportTypeEnum} from "../../module/document/enum/report.type.enum";
import {CategoryResponse} from "../../module/document/model/response/category.response";
import {DateFilterComponent} from "../../module/common/component/filter/date-filter.component";
import {SelectionFilterComponent} from "../../module/common/component/filter/selection-filter.component";
import {DocumentProcessService} from "../../module/document/service/document.process.service";
import Swal from 'sweetalert2'
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faEdit, faTrash, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import {MatAccordion} from '@angular/material/expansion';
import { User } from 'src/app/module/authentication/model/user.model';
import { AuthenticationService } from 'src/app/module/authentication/service/authentication.service';
import { CookieAuth } from 'src/app/module/authentication/model/cookie.auth';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {

  @ViewChild("table") table: ElementRef | undefined;
  @ViewChildren(DateFilterComponent) dateFilters: QueryList<DateFilterComponent> | undefined;
  @ViewChildren(SelectionFilterComponent) selectionFilters: QueryList<SelectionFilterComponent> | undefined;

  subcriptions: Subscription[] = [];

  filterOptions: any = {};
  treeData: TreeNode[] = [];
  topFilter: DocumentMetadata[] = [];
  topFilterSelections: any = {};
  treeFilterSelections: any = {};

  tableColumns: TableColumn[] = [];
  tableData: any[] = [];
  totalItems: number = 0;
  tableSize: number = 20;
  page: number = 1;

  dataProcessEngine: any = {};

  sortBy: string = "docidx";
  sortDirection: string = "desc";

  enableStatistic: boolean = false;
  enableDelete: boolean = false;

  statisticOptions: StatisticOption[] = [
    {
      name: "Loại tài liệu",
      type: ReportTypeEnum.LOAI_TAI_LIEU
    },
    {
      name: "Người ký",
      type: ReportTypeEnum.NGUOI_KY
    },
    {
      name: "Nơi ban hành",
      type: ReportTypeEnum.NOI_BAN_HANH
    },
    {
      name: "Ngày ban hành",
      type: ReportTypeEnum.NGAY_BAN_HANH
    }
  ];

  propTypeMap: any = {
    documentName: 0,
    signer: 1,
    publisherName: 2,
    topics: 3,
    entities: 4,
    promulgationDate: 5,
    tags: 9
  }

  searchTerm: string = "";

  leftFilterShow: boolean = true;
  topFilterShow: boolean = true;
  statisticShow: boolean = true;

  treeDataOriginal: any = {};

  isBookmark: boolean = false;

  docProps: DocumentMetadata[] = [];
  myBookmarks: string[] = [];

  bookmarkLoaded$: Subject<boolean> = new Subject<boolean>();

  faEdit: IconDefinition = faEdit;
  faTrash: IconDefinition = faTrashAlt;

  userInfo : User | undefined;

  constructor(
    private documentService: DocumentSearchService,
    private documentProcessService: DocumentProcessService,
    private dialogService: MatDialog,
    private spinnerService: NgxSpinnerService,
    private router: Router,
    private datePipe: DatePipe,
    private authService: AuthenticationService
  ) {
    this.userInfo = authService.getCookieAuthInfo()?.user;
  }

  private prepareDataProcess(metaData: DocumentMetadata[]): void {
    const engine: any = {};

    metaData.forEach(meta => {
      if (meta.type === "string") {
        engine[meta.name] = (content: string) => {
          return content;
        }
      } else if (meta.type === "date") {
        engine[meta.name] = (milisStr: string) => {
          const date = new Date(+milisStr);
          return this.datePipe.transform(date, "dd/MM/yyyy");
        }
      }
    });

    this.dataProcessEngine = engine;
  }

  private prepareTableColumns(callback?: Function): void {
    this.documentService.getDocProps()
      .subscribe(res => {
        this.docProps = res.props;
        const requiredProps = res.props.filter(x => x.required);
        this.prepareDataProcess(res.props);
        this.tableColumns = requiredProps
          .filter(x => x.name !== "content")
          .map(prop => {
          const column: TableColumn = {
            id: prop.name,
            text: (prop.note || "").replace(/\(.+\)/gi, "").trim(),
            sortable: true,
            headerAlign: TableAlignment.LEFT,
            cellAlign: TableAlignment.LEFT,
            active: true
          }

          if (column.id !== "action") {
            column.clickFn = (element: any) => {
              this.documentService.selectDocument(element);
              const docidx = element.docidx ? element.docidx : element.file;
              this.router.navigate(["app", "detail", docidx], {
                queryParams: {
                  from: "search"
                }
              });
            }
          }
          return column;
        });

        if (callback) {
          callback();
        }
      });
  }

  private prepareTableData(searchProps?: any): void {
    this.spinnerService.show("table-loader");
    this.documentService.searchDocument(this.isBookmark, this.searchTerm, this.page, this.tableSize, this.sortBy, this.sortDirection, searchProps)
      .subscribe(res => {
        this.tableData = res.hits.map(x => {
          const item = x._source;

          Object.keys(item).forEach(key => {
            if (this.dataProcessEngine[key]) {
              item[key] = this.dataProcessEngine[key](item[key]);
            }
          });

          item.highlight = this.searchTerm ? x.highlight?.content.join("<br/>") : "";
          if (this.isBookmark) {
            item.bookmarked = true;
          } else item.bookmarked = this.myBookmarks.indexOf(x._id) >= 0;

          return item;
        });

        this.totalItems = res.total_row;

        this.spinnerService.hide("table-loader");
      });
  }

  private prepareFilterOptions(): void {
    const filterOptions: any = {};
    const obs: Observable<any>[] = [];
    this.documentService.getSearchProps()
      .subscribe(props => {
        const validProps: DocumentMetadata[] = [];
        props.items.forEach(prop => {
          if (this.propTypeMap[prop.name]) {
            obs.push(this.documentService.getCategories(this.isBookmark, this.propTypeMap[prop.name], 100));
            validProps.push(prop);
          }
        })

        forkJoin(obs).subscribe(res => {
          validProps.forEach((prop, idx) => {
            filterOptions[prop.name] = res[idx].data.map((x: any) => x.name);
          });

          this.filterOptions = filterOptions;
          this.prepareTreeFilter(validProps);
          this.prepareTopFilter(validProps);
        });
      });
  }

  private prepareTreeFilter(props: DocumentMetadata[]): void {
    const treeMeta = [
      {
        name: "Đơn vị ban hành",
        type: ReportTypeEnum.NOI_BAN_HANH,
        id: "publisherName"
      },
      {
        name: "Loại tài liệu",
        type: ReportTypeEnum.LOAI_TAI_LIEU,
        id: "documentName"
      }
    ];

    const obs: Observable<CategoryResponse>[] = [];

    treeMeta.forEach(type => {
      obs.push(this.documentService.getCategories(this.isBookmark, type.type, 100));
    });

    forkJoin(obs).subscribe(res => {
      // store original data
      treeMeta.forEach((meta, index) => {
        this.treeDataOriginal[meta.id] = res[index].data;
      })

      this.treeData = treeMeta.map((type, idx) => {
        const node: TreeNode = {
          id: type.id,
          name: type.name,
          children: res[idx].data.map(x => {
            const childNode: TreeNode = {
              name: x.name
            }
            return childNode;
          })
        };

        return node;
      });

      console.log(this.treeData)
    });
  }

  private prepareTopFilter(props: DocumentMetadata[]): void {
    this.topFilter = props;
  }

  private resetFilter(): void {
    this.treeData.forEach(node => {
      node.children?.forEach(child => child.active = false);
    });
  }

  ngOnInit(): void {
    this.isBookmark = this.router.url === "/app/bookmark";

    this.prepareTableColumns(() => {

    });

    const onSearchSubscription = this.documentService.onSearch()
      .subscribe(term => {
        this.searchTerm = term;
        this.page = 1;

        this.resetFilter();
        this.prepareTableData();
      });

    this.subcriptions.push(onSearchSubscription);
    this.prepareFilterOptions();

    if (this.documentService.getCurrentSearchTerm()) {
      this.documentService.doSearch(this.documentService.getCurrentSearchTerm());
    }

    this.documentProcessService.getMyBookmarks()
      .subscribe(res => {
        this.myBookmarks = res;
        this.bookmarkLoaded$.next(true);
      });

    this.bookmarkLoaded$.subscribe(() => {
      this.prepareTableData();
    });

    this.checkPermissions();
  }

  private checkPermissions(): void {
    const user = this.authService.getCookieAuthInfo()?.user;

    if (user?.cantk) {
      this.enableStatistic = true;
    }
    if (user?.candelete) {
      this.enableDelete = true;
      console.log(this.enableDelete)
    }
  }

  ngOnDestroy() {
    this.subcriptions.forEach(sub => sub.unsubscribe());
  }

  onTreeFilter($event: TreeNode[]): void {
    const searchProps: any = {};
    $event.forEach(metaData => {
      searchProps[metaData.id || ""] = metaData.children ? metaData.children.map(x => x.name) : [];
    })

    this.treeFilterSelections = searchProps;
    this.prepareTableData(searchProps);
  }

  openStatistic(statistic: StatisticOption): void {
    const filterValue = {
      ...this.topFilterSelections,
      ...this.treeFilterSelections
    }

    const modalData = {
      title: statistic.name,
      type: statistic.type,
      bookmarked: this.isBookmark,
      filterValue,
      docProps: this.docProps
    };

    this.dialogService.open(StatisticModalComponent, {
      data: modalData
    });
  }

  toggleColumn(column: TableColumn): void {
    const newState = _.cloneDeep(this.tableColumns);
    newState.forEach(col => {
      if (col.id === column.id) {
        col.active = !col.active;
      }
    });

    this.tableColumns = newState;
  }

  onTableSizeChanged($event: number): void {
    this.tableSize = $event;

    this.prepareTableData();
  }

  onTablePageChanged($event: number): void {
    this.page = $event;

    this.prepareTableData();
  }

  getMetaDataName(meta: DocumentMetadata): string {
    return (meta.note || "").replace(/\(.+\)/gi, "").trim();
  }

  dateFilterSelect($event: DateRange<any>, meta: DocumentMetadata): void {
    if ($event.end && $event.start) {
      this.topFilterSelections[meta.name + "from"] = this.datePipe.transform($event.start, "dd/MM/yyyy");
      this.topFilterSelections[meta.name + "to"] = this.datePipe.transform($event.end, "dd/MM/yyyy")
    } else {
      delete this.topFilterSelections[meta.name + "from"];
      delete this.topFilterSelections[meta.name + "to"];
    }
  }

  selectionFilterChanged($event: string[], meta: DocumentMetadata): void {
    if ($event.length > 0) {
      this.topFilterSelections[meta.name] = $event;
    } else {
      delete this.topFilterSelections[meta.name];
    }
  }

  triggerFilter(): void {
    const filterValue = {
      ...this.topFilterSelections,
      ...this.treeFilterSelections
    }
    this.prepareTableData(filterValue);
  }

  toggleCard($event: MouseEvent, card: string): void {
    $event.stopPropagation();
    switch (card) {
      case "leftFilter":
        this.leftFilterShow = !this.leftFilterShow;
        break;
      case "topFilter":
        this.topFilterShow = !this.topFilterShow;
        break;
      case "statistic":
        this.statisticShow = !this.statisticShow;
        break;
    }
  }

  hideLeftBar(): void {
    this.leftFilterShow = false;
  }

  hideTopBar(): void {
    this.topFilterShow = false;
  }

  onTreeSearchToggle(node: TreeNode): void {
    console.log(node);
    if (node.inSearchMode) {

      // toggle all options
    } else {
      //
    }
  }

  goToUpload(): void {
    this.router.navigate(['/app', 'upload']);
  }

  clearTopFilters(): void {
    this.dateFilters?.forEach(filter => {
      filter.resetFilter();
    });
    this.selectionFilters?.forEach(filter => {
      filter.resetFilter();
    })
  }

  removeBookmark(document: any): void {
    const docidx = document.docidx ? document.docidx : document.file;
    this.documentProcessService.removeBookmark(docidx)
      .subscribe(res => {
        if (res) {
          document.bookmarked = false;
          this.myBookmarks = this.myBookmarks.splice(this.myBookmarks.indexOf(docidx), 1);

          if (this.isBookmark) {
            // in bookmark mode, refresh data
            this.prepareTableData();
          }
        }
      })
  }

  addBookmark(document: any): void {
    const docidx = document.docidx ? document.docidx : document.file;
    this.documentProcessService.bookmarkDocument(docidx)
      .subscribe(res => {
        if (res) {
          document.bookmarked = true;
          this.myBookmarks.push(docidx);
        }
      });
  }

  onBookmarkClicked($event: any): void {
    if ($event.bookmarked) {
      Swal.fire({
        text: "Xác nhận bỏ đánh dấu tài liệu này?",
        showCancelButton: true
      }).then(res => {
        if (res.isConfirmed) {
          this.removeBookmark($event);
        }
      });
    } else {
      this.addBookmark($event);
    }
  }

  onSorted(sort: any): void {
    this.sortDirection = sort.sortDirection;
    this.docProps.forEach(prop => {
      if (prop.name === sort.sortBy) {
        if (prop.type === "string") {
          this.sortBy = sort.sortBy + ".raw";
        } else {
          this.sortBy = sort.sortBy;
        }
      }
    })

    const filterValue = {
      ...this.topFilterSelections,
      ...this.treeFilterSelections
    }

    this.prepareTableData(filterValue);
  }

  deleteDocument(data: any): void {
    Swal.fire({
      title: "Xác nhận xoá tài liệu?",
      showCancelButton: true
    }).then(res => {
      if (res.isConfirmed) {
        this.documentProcessService.deleteDocument(data.docidx)
          .subscribe(response => {
            if (response.isvalid) {
              this.prepareTableData();
            }
          })
      }
    });
  }
}
