import {Injectable} from "@angular/core";
import {environment} from "../../../../environments/environment";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {StatisticResponse} from "../model/response/statistic.response";

const API_PATH = environment.api_path;

@Injectable({
  providedIn: "root"
})
export class DocumentStatisticService {

  constructor(
    private http: HttpClient
  ) {
  }

  getStatisticData(bookmarked: boolean, type: number, count: number): Observable<StatisticResponse> {
    const apiUrl = `${API_PATH}/stat`;
    let params = new HttpParams()
      .set("type", type)
      .set("limit", count);

    if (bookmarked) {
      params = params.set("bookmarked", bookmarked);
    }

    return this.http.get<StatisticResponse>(apiUrl, {
      params
    });
  }
}
