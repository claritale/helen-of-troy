/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Awaitable,
  StateUpdate, AnyActionsMap,
  StringKeyedMap,
  UntilActionFn,
  ActionsToCall,
  ActionsDescriptorMap,
  AnyActionsDescMap
} from './core';
import { createDefer } from "./common";

export class BasicAwaitables<
  StateShape,
  ActionsMap extends AnyActionsMap,
  _ActionsDescMap extends AnyActionsDescMap = ActionsDescriptorMap<ActionsMap>
>  implements StringKeyedMap<Awaitable<any, any> | StringKeyedMap<Awaitable<any, any>>> 
{  
  [x: string]: Awaitable<any, any> | StringKeyedMap<Awaitable<any, any>>;

  constructor(
    private internalSetState: any,
    private getNextRenderPromise: () => Promise<void>,

    public untilAction: UntilActionFn<_ActionsDescMap>,
    public actions: ActionsToCall<_ActionsDescMap>
  ) { }

  delay = (ms: number): Promise<void> => {
    const d = createDefer();
    setTimeout(d.resolve, ms);
    return d.promise;
  };

  setState = (update: StateUpdate<StateShape>): Promise<void> => {
    this.internalSetState(update);
    return this.getNextRenderPromise();
  };
}
