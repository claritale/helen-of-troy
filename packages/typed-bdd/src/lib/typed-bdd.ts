/* eslint-disable @typescript-eslint/no-explicit-any */

export class Scenario<ThatLines extends readonly string[], WithTypesMap> {
  private constructor(
    private givenSetup: {
      title?: string;
      thatLines: ThatLines;
      withTypes?: WithTypesMap;
    },
  ) { }
  private usingScns: Set<Scenario<any,any>> = new Set()
  private whenHandler: ((ctx: any) => any) | null = null
  private thenHandler: ((ctx: any, result: any) => void) | null = null
  private implementationMap: any = null

  public static Given<
    That, // extends (StringLiteral<That> | readonly StringLiteral<That>[]),
    WithTypesMap extends AnyTypesMap<_ThatLines[number]>,
    _ThatLines extends readonly string[] = SplittedThat<That>,
  >(
    setup: { title?: string; that: That; withTypes?: WithTypesMap }
  ): Scenario<_ThatLines, WithTypesMap> {
    const allThat = (Array.isArray(setup.that) ? setup.that : [setup.that]).join('\n')
    return new Scenario<_ThatLines, WithTypesMap>({ 
      title: setup.title, 
      thatLines: allThat.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')),
      withTypes: setup.withTypes
    } as any)
  }

  public static forEach<
    Scenarios extends AnyScenarioSerie,  
  >(...scenarios: Scenarios): UsingForEach<Scenarios> {
    return {
      useImplementation: (implementationMap: any) => {
        scenarios.forEach(sc => sc.useImplementation(implementationMap))
      }
    } as any
  }

  public static async runAll(...scenarios: Pick<Scenario<any, any>, 'run'>[]): Promise<void> {
    for (const sc of scenarios) {
      await sc.run()
    }
  }

  public get title(): string {
    return `Scenario - ${this.givenSetup.title ?? '[ untitled ]'}`
  }

  public Using<
    PreScenarios extends AnyScenarioSerie,
    _Serie extends { ThatLines: any, TypesMap: any } = ScenarioSerie<[...PreScenarios, this]>
  >(...preScenarios: PreScenarios)    
  : Scenario<_Serie['ThatLines'], _Serie['TypesMap']>
  {
    preScenarios.forEach(scn => this.usingScns.add(scn as any))    
    return this as any
  }

  public When<
    WhenResult, _ThatContext extends ThatContext<ThatLines[number], WithTypesMap>,
  >(
    whenHandler: (ctx: _ThatContext) => (WhenResult | Promise<WhenResult>)
  ): WhenContinuation<_ThatContext, WhenResult, Omit<this, 'When'>> {
    this.whenHandler = whenHandler
    Object.assign(this, {
      Then: (thenHandler: any) => {
        this.thenHandler = thenHandler
        return this
      }
    })
    return this as any
  }

  public useImplementation(
    implementationMap: StepsImplementation<ThatLines[number], WithTypesMap>
  ): Omit<this, 'useImplementation'> {
    this.implementationMap = implementationMap
    return this
  }

  /**
   * Scenario execution.
   */
  public async run() {
    const [usingSteps, usingImplMap] = this.getUsings()      
    const [givenSteps, whenHandler, thenHandler] = this.validateSetup(usingImplMap)
    const stepsToRun = [...usingSteps, ...givenSteps]
    const getCtx = this.createContextGetter(stepsToRun)
    // running given steps (Arrangements)
    for(const step of stepsToRun) {
      try {
        await Promise.resolve(step.implFn?.(getCtx(step.line)))
      } catch(e) {
        console.error(`Scenario${(this.givenSetup.title ? ` [${this.givenSetup.title}]` : '')} Failed runing step Given: \`${step.line}\``)
        throw e
      }
    }
    // running when step (Act)
    let result, error: any
    try {
      result = await Promise.resolve(whenHandler?.(getCtx()))
    } catch (e) { error = e }
    // running then step (Assertions)
    thenHandler?.(getCtx(), {result, error})
  }

  private getUsings(): [ParsedStep[], any] {
    const listOfUsingScs = Array.from(this.usingScns)
    const usingImplMap = {}
    listOfUsingScs.forEach(scn => {
      Object.assign(usingImplMap, scn.implementationMap || {})
    }) 
    Object.assign(usingImplMap, this.implementationMap || {})
    const usingSteps = listOfUsingScs
      .reduce<ParsedStep[]>((list, scn) => {
        const [givenSteps] = scn.validateSetup(usingImplMap, true)
        return [...list, ...givenSteps]
      }, [] as ParsedStep[])
    return [usingSteps, usingImplMap]
  }

  private validateSetup(usingImplMap: any, throwOnlyOnNoImpl = false) {
    const givenSetup = this.givenSetup

    const stepLines = givenSetup.thatLines
      .map(l => l.replace(/^(given|and) /i, ''))
      .filter(l => l.match(/{([^}]+)}/) || l.match(/{=([^}]*)}/))

    if (!throwOnlyOnNoImpl) {
      if (!stepLines.length) {
        throw new Error('Missing at least one valid Step line like `.. {a} is {=1} `')
      }
      if (!this.whenHandler) {
        throw new Error('The When clause not specified')
      }
      if (!this.thenHandler) {
        throw new Error('The Then clause not specified')
      }
    }

    const givenSteps = this.parseGivenSteps(stepLines, usingImplMap)

    const notImplementedSteps = givenSteps.filter(step => !step.implFn)
    if (notImplementedSteps.length) {
      throw new Error(`In ${this.title}\nNo implementation specified for (${notImplementedSteps.length}) lines: [\n${
        notImplementedSteps.map(step => `\t\`${step.line}\``).join('\n')
      }\n]`)
    }
    return [givenSteps, this.whenHandler, this.thenHandler] as const
  }

  private parseGivenSteps(stepLines: string[], usingImplMap: any) {
    return stepLines.map<ParsedStep>(line => {
      const ids = [...line.matchAll(/{([^=}]+)}/g)].reduce((l, m) => [...l, ...m.slice(1)], []).map(x => x.trim())
      const values = [...line.matchAll(/{=([^}]*)}/g)].reduce((l, m) => [...l, ...m.slice(1)], [])
      const lineImplExpr = line.replace(/{[^=}]+}/g, '{*}').replace(/{=[^}]*}/g, '{=*}')
      return {
        line,
        lineImplExpr,
        ids,
        values,
        implFn: usingImplMap[lineImplExpr]
      }
    })
  }

  private createContextGetter(steps: { line: string; ids: string[]; values: string[]; }[]) {
    const byId: Record<string, any> = {}
    const stepsMap = steps.reduce<Record<string, typeof steps[0]>>((m, s) => Object.assign(m, { [s.line]: {...s} }), {})

    return (stepRef = '') => ({
      thatIds: (...ids: string[]) => ids.map(id => byId[id]),
      thatId: (id: string) => byId[id],

      ...(!stepRef ? {} : {
        stepInfoRef: stepRef,
        expr: {
          getIdName: (index: number) => stepsMap[stepRef].ids[index],
          getIds: () => stepsMap[stepRef].ids.map((id: any) => byId[id]),
          getId: (index: number) => byId[stepsMap[stepRef].ids[index]],
          setId: (index: number, value: any) => { byId[stepsMap[stepRef].ids[index]] = value },
          getValues: (converters: AnyConverterOption[] = []) => {
            return stepsMap[stepRef].values
              .map((value: any, index: number) => {
                const mIdRef = value.match(/^<(\w+)>$/)?.slice(1)[0]
                if (mIdRef && byId[mIdRef]) {
                  return byId[mIdRef]
                }
                const option = converters?.[index]
                if (!option || option === 'skip') return value
                return option(value) ?? value
              })
          },
          getValue: (index: number, converter?: AnyValueConverter) => {
            const value = stepsMap[stepRef].values[index]
            return typeof converter === 'function' ? converter(value) : value
          },
        }
      })
    })
  }
}

/// -----------------------------------------------------------------

interface ParsedStep {
  line: string;
  lineImplExpr: string;
  ids: string[];
  values: string[];
  implFn?: ((ctx: any) => any) | undefined;
}

type AnyScenarioSerie = (
  Scenario<readonly string[], unknown>
  | Omit<Scenario<readonly string[], unknown>, 'When'> 
  | Omit<Scenario<readonly string[], unknown>, 'Then'>
)[]

type ScenarioSerie<
  Scenarios,
  _SerieTuple extends unknown[][] = SerieMixer<Unwrapped<Scenarios>>,
  _ThatLines extends string[] = Flatten_0<_SerieTuple>,
  _TypesMap = UnioToInterception<_SerieTuple[number][1]>
> = {
  ThatLines: _ThatLines,
  TypesMap: _TypesMap,
}

type UsingForEach<
  Scenarios,
  _Serie extends { ThatLines: any, TypesMap: any } = ScenarioSerie<Scenarios>
> = {
  useImplementation: (implementationMap: StepsImplementation<_Serie['ThatLines'][number], _Serie['TypesMap']>) => void
}

export type Unwrapped<
  Serie
> = Serie extends [infer Scn, ...infer Tail]
  ? (
    Scn extends Scenario<readonly string[], unknown>
    ?  [Scn, ...Unwrapped<Tail>]
    : (
      Scn extends Omit<Scenario<infer _ThatLines, infer TypesMap>, 'When'>
      ? Unwrapped<[Scenario<_ThatLines, TypesMap>, ...Tail]>
      : (
        Scn extends Omit<Scenario<infer _ThatLines, infer TypesMap>, 'Then'>
        ? Unwrapped<[Scenario<_ThatLines, TypesMap>, ...Tail]>
        : []
      )
    )
  ) 
  : [] 

export type SerieMixer<
  Serie, 
> = Serie extends [Scenario<infer ThatLines, infer TypesMap>, ...infer Tail]
  ? [
    [ThatLines, TypesMap],
    ...SerieMixer<Tail>
  ]
  : []  
export type Flatten_0<
  Tuple,
> = Tuple extends [infer T, ...infer Tail]
  ? [
    ...(
      T extends [infer T0, unknown]
      ? (T0 extends readonly string[] ? T0 : [])
      : []
    ), 
    ...Flatten_0<Tail>
  ]
  : []

type ThatContext<
  Lines,
  WithTypesMap, 
  _IDs = L_Ids<Lines>,
  _IdsTypeMap = IdsTypeMap<Lines>
> = {
  thatIds: <
    IDs extends _IDs[]
  >(...ids: IDs) => TypeOfIdsTuple<IDs, _IdsTypeMap, WithTypesMap>

  thatId: <
    ID extends _IDs
  >(id: ID) => TypeOfId<ID, _IdsTypeMap, WithTypesMap>

  stepIds: <
    StepRef extends L_InfoRef<Lines>
  >(stepInfoRef: StepRef) => StepTypesTuple<Lines, WithTypesMap, StepRef>
}

// type UsingContinuation<
//   ThatContext, 
//   WhenResult, 
//   ScenarioContinuation
// > = {
//   Then(thenHandler: (ctx: ThatContext, onWhen: { result: WhenResult, error: unknown }) => void): Omit<ScenarioContinuation, 'Then'>
// }
// & ScenarioContinuation

type WhenContinuation<
  ThatContext, 
  WhenResult, 
  ScenarioContinuation
> = {
  Then(thenHandler: (ctx: ThatContext, onWhen: { result: WhenResult, error: unknown }) => void): Omit<ScenarioContinuation, 'Then'>
}
& ScenarioContinuation

type TypeOfId<Id, IdsTypeMap, TypesMap, _TypesMap = TypesMap & PrimitiveTypesMap> = TypeOrId<TypeOrId<Id, IdsTypeMap>, _TypesMap, any> 
type TypeOrId<Id, TypesMap, DefaultType = Id> = Id extends keyof TypesMap ? TypesMap[Id] : (DefaultType extends Id ? Id : DefaultType)

type TypeOfIdsTuple<
  T extends any[], 
  IdsTypeMap,
  TypesMap,
> = T extends [infer ID, ...infer Tail] 
  ? (
    Tail extends []
    ? [TypeOfId<ID, IdsTypeMap, TypesMap>]
    : [
        ...[TypeOfId<ID, IdsTypeMap, TypesMap>], 
        ...(Tail extends string[] ? TypeOfIdsTuple<Tail, IdsTypeMap, TypesMap> : [])
      ]
  )
  : []

type StepTypesTuple<
  Lines, 
  TypesMap, 
  ForStepRef, 
  MetaMap extends AnyStepsMetaMap = StepsMetaMap<Lines, IdsTypeMap<Lines>, TypesMap>
> = ValuesOfMap<{
  [StepRef in keyof MetaMap]: StepRef extends ForStepRef ? MetaMap[StepRef]['stepIdsTuple'] : never
}>

export type SplittedThat<That>
  = That extends string
  ? SplitX<That, '\n'>
  : That extends readonly any[]
  ? SplitXMulti<That, '\n'>
  : never

export type AnyTypesMap<
  Lines,
  _IdsTypeMap = IdsTypeMap<Lines>
> = Partial<Record<
  UndefinedIds<L_Ids<Lines>, _IdsTypeMap> | Exclude<ValuesOfMap<_IdsTypeMap> & string, keyof PrimitiveTypesMap>, 
  any
>>
type UndefinedIds<Id, IdsTypeMap> = Id extends keyof IdsTypeMap ? never : Id

export type StepsImplementation<
  Lines, 
  TypesMap,
  _IDs = L_Ids<Lines>,
  _IdsTypeMap = IdsTypeMap<Lines>,
  _StepsMetaMap extends AnyStepsMetaMap = StepsMetaMap<Lines, _IdsTypeMap, TypesMap>,
> = {
  // Having unique Regular Expressions to be the set of keys, 
  // for each of which an implementation is required (Grouping by Regexp..)
  [StepRef in keyof _StepsMetaMap as _StepsMetaMap[StepRef]['stepRegexp']]?:
  (
    ctx: ImplContext<
      _IDs,
      _IdsTypeMap, 
      TypesMap,
      _StepsMetaMap,
      _StepsMetaMap[StepRef]['stepRegexp']
    >
  ) => void | Promise<void>
}

type ImplContext<
  IDs,
  IdsTypeMap,
  TypesMap,
  StepsMetaMap extends AnyStepsMetaMap,
  ForStepRegexp,
> = {
  thatIds: <
    _IDs extends IDs[]
  >(...ids: _IDs) => TypeOfIdsTuple<_IDs, IdsTypeMap, TypesMap>

  thatId: <
    ID extends IDs,
  >(id: ID) => TypeOfId<ID, IdsTypeMap, TypesMap>
} 
& ValuesOfMap<{
  [StepRef in keyof StepsMetaMap]: StepsMetaMap[StepRef]['stepRegexp'] extends ForStepRegexp 
    ? StepExpression<StepsMetaMap[StepRef]>
    : never
}>

type StepExpression<
  StepMeta extends AnyStepMeta,
  _StepInfoRef = StepMeta['stepInfoRef'],
  _StepIdNamesTuple extends any[] = StepMeta['stepIdNamesTuple'],
  _StepIdsTuple extends any[] = StepMeta['stepIdsTuple'],
  _StepValuesTuple extends any[] = StepMeta['stepValuesTuple'],
> = {
  stepInfoRef: _StepInfoRef,
  expr: {
    getIdName: <Index extends TupleIndexs<_StepIdNamesTuple>[number]>(index: Index) => _StepIdNamesTuple[Index]
    getIds: () => _StepIdsTuple
    getId: <Index extends TupleIndexs<_StepIdsTuple>[number]>(index: Index) => _StepIdsTuple[Index]
    setId: <Index extends TupleIndexs<_StepIdsTuple>[number]>(index: Index, value: _StepIdsTuple[Index]) => void
    getValues: <ConverterOptions extends ConverterOptionsTuple<_StepValuesTuple>>(converters?: ConverterOptions) => MapValuesTuple<_StepValuesTuple, ConverterOptions>
    getValue: <
      Index extends TupleIndexs<_StepValuesTuple>[number], 
      ValueConverter extends (AnyValueConverter | undefined)
    >(index: Index, converter?: ValueConverter) => ConvertOrSkip<_StepValuesTuple[Index], ValueConverter>
  },
}

type ConvertOrSkip<V, C> = undefined extends C ? V : (C extends AnyValueConverter ? ReturnType<C> : V)

type AnyConverterOption = AnyValueConverter | 'skip'
type AnyValueConverter = (str: string) => any

type ConverterOptionsTuple<
  VTuple extends any[],
  _Indexs = TupleIndexs<VTuple>,
> = _Indexs extends [infer Index, ...infer NextIndexs]
  ? (
    Index extends number
    ? [
      AnyConverterOption?,
      ...ConverterOptionsTuple<VTuple, NextIndexs>
    ]
    : []
  )
  : []

type MapValuesTuple<
  VTuple extends any[], 
  CTuple extends any[],
  Indexs = TupleIndexs<VTuple>
> = Indexs extends [infer Index, ...infer NextIndexs]
? (
  Index extends number
  ? [
    (CTuple[Index] extends undefined
      ? VTuple[Index] 
      : ConvertOrSkip<VTuple[Index], CTuple[Index]>),
    ...MapValuesTuple<VTuple, CTuple, NextIndexs>
  ]
  : []
)
: []

type TupleIndexs<
  Tuple extends any[], 
  It = [0,1,2,3,4,5,6,7,8,9,10]
> = It extends [infer Index, ...infer NextIt]
  ? (
    Index extends number
    ? Tuple[Index] extends undefined ? [] : [Index, ...TupleIndexs<Tuple, NextIt>] 
    : []
  )
  : []

export type StepsMetaMap<Lines, IdsTypeMap, TypesMap> = {
  [L in L_InfoRef<Lines>]: {
    stepInfoRef: L,
    stepRegexp: L_Regex<L>,
    // stepIds: L_Ids<L>
    stepIdNamesTuple: L_IdNamesTuple<L>
    stepIdsTuple: L_IdsTuple<L, IdsTypeMap, TypesMap>
    stepValuesTuple: L_ValuesTuple<L>
  }
}
type AnyStepsMetaMap = Record<string, AnyStepMeta>
interface AnyStepMeta {
  stepInfoRef: any;
  stepRegexp: any;
  stepIdNamesTuple: any[];
  stepIdsTuple: any[]
  stepValuesTuple: any[]
}

// Map of { [Id]: TypeAlias } from Lines like "IdTypes: ..."
// TypeAlias will be the interception of every given type aliases for a single Id, 
// this is to handle definition conflits, in which case TypeAlias = never
export type IdsTypeMap<Lines> = {
  [Tuple in IdTypeTuples<Lines> as Tuple[0]]: UnioToInterception<Tuple[1]>
}
type IdTypeTuples<Lines> = ValuesOfMap<{
  [L in IsIdsTypeLine<Lines>]: L_IdTypeTuples<L>
}>
type IsIdsTypeLine<L> = L extends `IdTypes:${string}` ? L : never
type L_IdTypeTuples<L extends string> = `${L}; ` extends `${string}IdTypes:${infer idList}:${infer TypeAlias};${infer rest}`
  ? IdTypeTuple<SplitX<idList, ','>[number], TrimAndCleanXX<TypeAlias>[number]> | L_IdTypeTuples<`IdTypes:${rest}`>
  : never
type IdTypeTuple<Id, TypeAlias> = Id extends any ? [Id, TypeAlias] : never

type ValuesOfMap<O> = O[keyof O]
type UnioToInterception<U> = (U extends any ? (x: U)=>void : never) extends ((x: infer I)=>void) ? I : never

/**
 *  strings utils
 */

type D = ['{', '}']

type L_InfoRef<L> = L extends `${string}${D[0]}${string}${D[1]}${string}`
  ? CleanPrefix<L>
  : never

export type L_Ids<L> = L extends `${string}${D[0]}${infer Info}${D[1]}${infer Suffix}`
  ?  TrimAndCleanXX<IsId<Info>>[0] | L_Ids<Suffix> 
  : never  

export type L_Regex<L> = L extends `${infer Prefix}${D[0]}${infer Info}${D[1]}${infer Suffix}`
  ? `${
      Prefix
    }${D[0]}${
      Info extends IsId<Info> ? '*' : '=*'
    }${D[1]}${
      L_Regex<Suffix>
    }` 
  : L

export type L_IdNamesTuple<L> = L extends `${string}${D[0]}${infer Info}${D[1]}${infer Suffix}`
  ? [
    ...(Info extends IsId<Info> ? [TrimAndCleanXX<Info>[number]] : []), 
    ...L_IdNamesTuple<Suffix>
  ] 
  : []

type L_IdsTuple<L, IdsTypeMap, TypesMap> = L extends `${string}${D[0]}${infer Info}${D[1]}${infer Suffix}`
  ? [
    ...(Info extends IsId<Info> ? [TypeOfId<TrimAndCleanXX<Info>[number], IdsTypeMap, TypesMap>] : []), 
    ...L_IdsTuple<Suffix, IdsTypeMap, TypesMap>
  ] 
  : []

type L_ValuesTuple<L> = L extends `${string}${D[0]}${infer Info}${D[1]}${infer Suffix}`
  ? [
    ...(Info extends IsId<Info> ? [] : [Info extends `=${infer V}` ? V : string]), 
    ...L_ValuesTuple<Suffix>
  ]
  : []

type IsId<S> = S extends `=${string}` ? never : S

type CleanPrefix<P> = P extends `${infer IW} ${infer Clean}` 
  ? (
    Lowercase<IW> extends 'given' | 'and' ? Clean : P
  ) 
  : P

type SplitXMulti<List extends readonly string[], _ extends string> = List extends readonly [infer S, ...infer Tail]
  ? readonly [
    ...(S extends string ? SplitX<S, _> : readonly  []), 
    ...(Tail extends string[] ? SplitXMulti<Tail, _> : readonly  [])
  ]
  : readonly []

type SplitX<S0 extends string, _ extends string>
  = S0 extends `${infer P1}${_}${infer S1}`
  ? readonly [...TrimAndCleanXX<P1>, ...(
      S1 extends `${infer P2}${_}${infer S2}`
      ? readonly [...TrimAndCleanXX<P2>, ...(
          S2 extends `${infer P3}${_}${infer S3}`
          ? readonly [...TrimAndCleanXX<P3>, ...(
              S3 extends `${infer P4}${_}${infer S4}`
              ? readonly [...TrimAndCleanXX<P4>, ...(
                  S4 extends `${infer P5}${_}${infer S5}`
                  ? readonly [...TrimAndCleanXX<P5>, ...(
                      S5 extends `${infer P6}${_}${infer S6}`
                      ? readonly [...TrimAndCleanXX<P6>, ...(
                          S6 extends `${infer P7}${_}${infer S7}`
                          ? readonly [...TrimAndCleanXX<P7>, ...(
                              S7 extends `${infer P8}${_}${infer S8}`
                              ? readonly [...TrimAndCleanXX<P8>, ...(
                                  S8 extends `${infer P9}${_}${infer S9}`
                                  ? readonly [...TrimAndCleanXX<P9>, ...(
                                      S9 extends `${infer P10}${_}${infer S10}`
                                      ? readonly [...TrimAndCleanXX<P10>, ...SplitX<S10, _>]
                                      : readonly [...TrimAndCleanXX<S9>]
                                    )]
                                  : readonly [...TrimAndCleanXX<S8>]
                                )]
                              : readonly [...TrimAndCleanXX<S7>]
                            )]
                          : readonly [...TrimAndCleanXX<S6>]
                        )]
                      : readonly [...TrimAndCleanXX<S5>]
                    )]
                  : readonly [...TrimAndCleanXX<S4>]
                )]
              : readonly [...TrimAndCleanXX<S3>]
            )]
          : readonly [...TrimAndCleanXX<S2>]
        )]
      : readonly [...TrimAndCleanXX<S1>]
    )]
  : readonly [...TrimAndCleanXX<S0>]

type TrimAndCleanXX<TXT> 
  = TXT extends `${S_20}${infer L01}` 
  ? TrimAndCleanXX<L01> 
  : TXT extends `${S_19}${infer L02}`
  ? TrimAndCleanXX<L02> 
  : TXT extends `${S_18}${infer L03}`
  ? TrimAndCleanXX<L03> 
  : TXT extends `${S_17}${infer L04}`
  ? TrimAndCleanXX<L04> 
  : TXT extends `${S_16}${infer L05}`
  ? TrimAndCleanXX<L05> 
  : TXT extends `${S_15}${infer L06}`
  ? TrimAndCleanXX<L06> 
  : TXT extends `${S_14}${infer L07}`
  ? TrimAndCleanXX<L07> 
  : TXT extends `${S_13}${infer L08}`
  ? TrimAndCleanXX<L08> 
  : TXT extends `${S_12}${infer L09}`
  ? TrimAndCleanXX<L09> 
  : TXT extends `${S_11}${infer L10}`
  ? TrimAndCleanXX<L10> 
  : TXT extends `${S_10}${infer L11}`
  ? TrimAndCleanXX<L11> 
  : TXT extends `${S_09}${infer L12}`
  ? TrimAndCleanXX<L12> 
  : TXT extends `${S_08}${infer L13}`
  ? TrimAndCleanXX<L13> 
  : TXT extends `${S_07}${infer L14}`
  ? TrimAndCleanXX<L14> 
  : TXT extends `${S_06}${infer L15}`
  ? TrimAndCleanXX<L15> 
  : TXT extends `${S_05}${infer L16}`
  ? TrimAndCleanXX<L16> 
  : TXT extends `${S_04}${infer L17}`
  ? TrimAndCleanXX<L17> 
  : TXT extends `${S_03}${infer L18}`
  ? TrimAndCleanXX<L18> 
  : TXT extends `${S_02}${infer L19}`
  ? TrimAndCleanXX<L19> 
  : TXT extends `${S_01}${infer L20}`
  ? TrimAndCleanXX<L20>
  : TXT extends `${infer R01}${S_20}`
  ? TrimAndCleanXX<R01> 
  : TXT extends `${infer R02}${S_19}`
  ? TrimAndCleanXX<R02> 
  : TXT extends `${infer R03}${S_18}`
  ? TrimAndCleanXX<R03> 
  : TXT extends `${infer R04}${S_17}`
  ? TrimAndCleanXX<R04> 
  : TXT extends `${infer R05}${S_16}`
  ? TrimAndCleanXX<R05> 
  : TXT extends `${infer R06}${S_15}`
  ? TrimAndCleanXX<R06> 
  : TXT extends `${infer R07}${S_14}`
  ? TrimAndCleanXX<R07> 
  : TXT extends `${infer R08}${S_13}`
  ? TrimAndCleanXX<R08> 
  : TXT extends `${infer R09}${S_12}`
  ? TrimAndCleanXX<R09> 
  : TXT extends `${infer R10}${S_11}`
  ? TrimAndCleanXX<R10> 
  : TXT extends `${infer R11}${S_10}`
  ? TrimAndCleanXX<R11> 
  : TXT extends `${infer R12}${S_09}`
  ? TrimAndCleanXX<R12> 
  : TXT extends `${infer R13}${S_08}`
  ? TrimAndCleanXX<R13> 
  : TXT extends `${infer R14}${S_07}`
  ? TrimAndCleanXX<R14> 
  : TXT extends `${infer R15}${S_06}`
  ? TrimAndCleanXX<R15> 
  : TXT extends `${infer R16}${S_05}`
  ? TrimAndCleanXX<R16> 
  : TXT extends `${infer R17}${S_04}`
  ? TrimAndCleanXX<R17> 
  : TXT extends `${infer R18}${S_03}`
  ? TrimAndCleanXX<R18> 
  : TXT extends `${infer R19}${S_02}`
  ? TrimAndCleanXX<R19> 
  : TXT extends `${infer R20}${S_01}`
  ? TrimAndCleanXX<R20>
  : (TXT extends infer Trimmed ? NoEmptyNoCommentX<Trimmed> : readonly [])

type NoEmptyNoCommentX<TXT> 
  = TXT extends '' 
  ? readonly [] 
  : TXT extends `//${string}` 
  ? readonly [] 
  : readonly [TXT]

// type StringLiteral<S> = string extends S ? 'StringLiteralRequired' : string

type PrimitiveTypesMap = {
  number: number, 
  string: string,
  boolean: boolean,
}

// type Indexes = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
type S_01 = ' '
type S_02 = '  '
type S_03 = '   '
type S_04 = '    '
type S_05 = '     '
type S_06 = '      '
type S_07 = '       '
type S_08 = '        '
type S_09 = '         '
type S_10 = '          '
type S_11 = '           '
type S_12 = '            '
type S_13 = '             '
type S_14 = '              '
type S_15 = '               '
type S_16 = '                '
type S_17 = '                 '
type S_18 = '                  '
type S_19 = '                   '
type S_20 = '                    '