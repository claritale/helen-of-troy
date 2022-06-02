import {
  Defer, AnyActionsMap,
  ActionsDescriptorMap,
  UntilActionFn,
  ActionsToCall
} from './core';
import { createDefer, isValidStringProp } from "./common";

export class ActionsHelper<
  ActionsMap extends AnyActionsMap,
  _ActionsDescMap extends ActionsDescriptorMap<AnyActionsMap> = ActionsDescriptorMap<ActionsMap>> {
  private pendingActions: Array<{ ids: Set<string>; d: Defer; }>;
  private pendingAnyAction: Defer | null;
  constructor(
    private actionsMap: ActionsMap,
    private getNextRenderPromise: () => Promise<void>
  ) {
    this.pendingActions = [];
    this.pendingAnyAction = null;
  }

  private resolvePending = (actionId: string, withActionObj: any) => {
    if (actionId === 'ANY') {
      this.pendingAnyAction?.resolve(withActionObj);
      this.pendingAnyAction = null;
      return;
    }
    this.pendingActions = this.pendingActions.filter((p) => {
      if (!p.ids.has(actionId))
        return true;
      p.d.resolve(withActionObj);
      return false;
    });
  };
  private registerPending = (waitingFor: string | string[]) => {
    if (waitingFor === 'ANY') {
      if (!this.pendingAnyAction)
        this.pendingAnyAction = createDefer();
      return this.pendingAnyAction;
    }
    const actionIds = Array.isArray(waitingFor) ? waitingFor : [waitingFor];
    const d = createDefer();
    this.pendingActions.push({ ids: new Set(actionIds), d });
    return d;
  };

  untilCalled: UntilActionFn<_ActionsDescMap> = ((waitingFor: any) => {
    const d = this.registerPending(waitingFor);
    return d.promise;
  }) as any;

  toCall = new Proxy<ActionsToCall<_ActionsDescMap>>(this.actionsMap as any, {
    get: (t, p) => {
      if (!isValidStringProp(p)) {
        return null;
      }
      if (!t[p]) {
        throw new Error(`Unknown action id: ${p}`);
      }
      const actionFn = t[p] as any;
      return (...params: any) => {
        const actionObj = actionFn(...params);
        actionObj.actionId = p;
        this.resolvePending(p, actionObj);
        return this.getNextRenderPromise();
      };
    }
  });
}


