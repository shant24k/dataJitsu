import {CollectionViewer, DataSource} from "@angular/cdk/collections";
import { BehaviorSubject ,  Observable , of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Match } from './match.model';
import { DatabaseService } from './database.service';
import { Injectable, NgZone, ApplicationRef } from '@angular/core';

@Injectable()
export class MatchDataSource implements DataSource<Match> {

  private matchesSubject = new BehaviorSubject<Match[]>([]);
  private loadingMatches = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingMatches.asObservable();

  constructor(private dbService: DatabaseService, private nz: NgZone) {}

  connect(collectionViewer: CollectionViewer): Observable<Match[]> {
    return this.matchesSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.matchesSubject.complete();
    this.loadingMatches.complete();
  }

  loadMatches(matchId: string, filter = '',
  sortDirection='asc', pageIndex: number, pageSize: number) {
    this.loadingMatches.next(true);
    this.dbService.getKeyOfMatchToStartWith(pageIndex, pageSize).subscribe(keyIndex=>{
      this.dbService.getMatchesFilteredPaginator(keyIndex, pageSize).pipe(
        catchError(()=> of([])),
        finalize(()=>{
          //TODO the tutorial here https://blog.angular-university.io/angular-material-data-table/ toggled the loading spinner off here, but it seemed to work better below for me?
        })
      )
      .subscribe(matches => {
        let results = this.makeIntoArray(matches);
        this.nz.run(() => {
          this.matchesSubject.next(results);
        // console.log("loading done");
        this.loadingMatches.next(false);
        //this.ar.tick();
        });
        
      });
    });
  }

  makeIntoArray(matches: any){
    let results = []; //TODO there should be a way to tighten the below up
    for(var i in matches){
      let obj1 = {id:matches[i].id};
      if(matches[i].matchDeets){
        let obj2 = matches[i].matchDeets;
        obj1 = Object.assign({}, obj1, obj2);
      }
      results.push(obj1);
    }
    // console.log(results);
    return results;
  }
}
