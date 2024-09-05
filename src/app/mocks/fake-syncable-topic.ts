import {
  Observable,
  Observer,
  Subscription,
  UnaryFunction,
  BehaviorSubject,
} from 'rxjs';

export class FakeSyncableTopic<T> {
  private state: BehaviorSubject<T | undefined>;
  constructor() {
    this.state = new BehaviorSubject<T | undefined>(undefined);
  }
  asObservable(): Observable<T | undefined> {
    return this.state.asObservable();
  }

  subscribe(
    observerOrNext?: Partial<Observer<T>> | ((value: T) => void),
    error?: (error: any) => void,
    complete?: () => void,
  ): Subscription {
    return (<any>this.asObservable()).subscribe(
      observerOrNext,
      error,
      complete,
    );
  }

  pipe(...operations: UnaryFunction<any, any>[]): unknown {
    return (<any>this.asObservable()).pipe(...operations);
  }

  publish(value: T): Promise<void> {
    this.state.next(value);
    return Promise.resolve();
  }

  getValue() {
    return this.state.getValue();
  }
}
