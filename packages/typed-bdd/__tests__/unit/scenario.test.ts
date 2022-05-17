/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Scenario } from '../../src';

describe('Scenario', () => {
  describe('try running invalid setups', () => {
    test('missing at least one valid Step in Given clause', async () => {
      const sc = Scenario.Given({ that: ' todo something ' });
      await expect(sc.run()).rejects.toThrow(
        'Missing at least one valid Step line like `.. {a} is {=1} `',
      );
    });

    test('missing When clause', async () => {
      const sc = Scenario.Given({ that: ' {a} is {=1} ' });
      await expect(sc.run()).rejects.toThrow('The When clause not specified');
    });

    test('missing Then clause', async () => {
      const sc = Scenario.Given({ that: ' {a} is {=1} ' }).When(() => {
        /**/
      });
      await expect(sc.run()).rejects.toThrow('The Then clause not specified');
    });

    test('missing Steps Implementation 1', async () => {
      const sc = Scenario.Given({ that: ' {a} is {=1} ' })
        .When(() => {
          /**/
        })
        .Then(() => {
          /**/
        });
      await expect(sc.run()).rejects.toThrow(
        'In Scenario - [ untitled ]\nNo implementation specified for (1) lines: [\n\t`{a} is {=1}`\n]',
      );
    });

    test('missing Steps Implementation 2', async () => {
      const sc = Scenario.Given({
        title: 'Testing',
        that: `
          given a is {=2}
            and b is {=3}
            and c is {=4}
        `,
      })
        .When(() => {
          /**/
        })
        .Then(() => {
          /**/
        });

      sc.useImplementation({
        'b is {=*}': () => {
          /* */
        },
      });
      await expect(sc.run()).rejects.toThrow(
        'In Scenario - Testing\nNo implementation specified for (2) lines: [\n\t`a is {=2}`\n\t`c is {=4}`\n]',
      );
    });
  });

  describe('features', () => {
    const sc1 = Scenario.Given({
      that: `
        object {o} has prop a {=123}
        object {p} is deep copied from object {o}
        object {o} has prop a {=987}
      ` as const,
    })
      .When(() => {
        /**/
      })
      .Then(() => {
        /**/
      });

    sc1.useImplementation({
      'object {*} has prop a {=*}': ({ expr }) => {
        const o = expr.getId(0) || {};
        o.a = expr.getValue(0);
        expr.setId(0, o);
      },
      'object {*} is deep copied from object {*}': ({ expr }) => {
        expr.setId(0, JSON.parse(JSON.stringify(expr.getId(1))));
      },
    });

    let currImplMap: object | null;
    beforeEach(() => {
      currImplMap = (sc1 as any).implementationMap;
    });
    afterEach(() => {
      (sc1 as any).implementationMap = currImplMap;
    });

    test('get id name in step expr', async () => {
      sc1.useImplementation({
        ...currImplMap,
        'object {*} is deep copied from object {*}': ({ expr }) => {
          expect(expr.getIdName(0)).toEqual('p');
          expect(expr.getIdName(1)).toEqual('o');
        },
      });
      await sc1.run();
      expect.assertions(2);
    });

    test('get single value in step expr (without converter)', async () => {
      const expectedValues = ['123', '987'];
      sc1.useImplementation({
        'object {*} has prop a {=*}': ({ expr }) => {
          const value = expr.getValue(0);
          expect(typeof value).toBe('string');
          expect(value).toEqual(expectedValues.splice(0, 1)[0]);
        },
        'object {*} is deep copied from object {*}': () => {
          /**/
        },
      });
      await sc1.run();
      expect.assertions(4);
    });

    test('get single value in step expr (with converter)', async () => {
      const expectedValues = [123, 987];
      sc1.useImplementation({
        'object {*} has prop a {=*}': ({ expr }) => {
          const value = expr.getValue(0, Number);
          expect(typeof value).toBe('number');
          expect(value).toEqual(expectedValues.splice(0, 1)[0]);
        },
        'object {*} is deep copied from object {*}': () => {
          /**/
        },
      });
      await sc1.run();
      expect.assertions(4);
    });

    test('get all values in step expr (without converter)', async () => {
      const expectedValues = ['123', '987'];
      sc1.useImplementation({
        'object {*} has prop a {=*}': ({ expr }) => {
          const values = expr.getValues();
          values.forEach((value) => expect(typeof value).toBe('string'));
          expect(values).toEqual(expectedValues.splice(0, 1));
        },
        'object {*} is deep copied from object {*}': () => {
          /**/
        },
      });
      await sc1.run();
      expect.assertions(4);
    });

    test('get all values in step expr (with converter)', async () => {
      const expectedValues = [123, 987];
      sc1.useImplementation({
        'object {*} has prop a {=*}': ({ expr }) => {
          const values = expr.getValues([Number]);
          values.forEach((value) => expect(typeof value).toBe('number'));
          expect(values).toEqual(expectedValues.splice(0, 1));
        },
        'object {*} is deep copied from object {*}': () => {
          /**/
        },
      });
      await sc1.run();
      expect.assertions(4);
    });
  });

  describe('figured examples', () => {
    test('simple 1', async () => {
      const sc1 = Scenario.Given({
        that: ' object {o} has prop a {=hello} ' as const,
      })
        .When(() => {
          /**/
        })
        .Then((ctx) => {
          expect(ctx.thatId('o')).toEqual({ a: 'hello' });
        });

      sc1.useImplementation({
        'object {*} has prop a {=*}': ({ expr }) => {
          const o = expr.getId(0) || {};
          o.a = expr.getValue(0);
          expr.setId(0, o);
        },
      });
      await sc1.run();
      expect.assertions(1);
    });

    test('simple 2', async () => {
      const sc = Scenario.Given({
        that: `
          given var {a} is {=2}
            and var {b} is {=3}
            and var {c} is {=4}
        ` as const,
      })
        .When((ctx) => {
          const [a, b, c] = ctx.thatIds('a', 'b', 'c');
          return a + b * c;
        })
        .Then((ctx, { result }) => {
          expect(result).toEqual('212');
        });

      sc.useImplementation({
        'var {*} is {=*}': (ctx) => {
          const v = ctx.expr.getValue(0);
          ctx.expr.setId(0, v);
        },
      });
      await sc.run();
      expect.assertions(1);
    });

    test('medium 1', async () => {
      const sc = Scenario.Given({
        that: `
          IdTypes: a,b,c: number
          given var {a} is {=2}
            and var {b} is {=3}
            and var {c} is {=4}
        ` as const,
      })
        .When(async (ctx) => {
          const [a, b, c] = ctx.thatIds('a', 'b', 'c');
          return a + b * c;
        })
        .Then((ctx, { result }) => {
          expect(result).toEqual(14);
        });

      sc.useImplementation({
        'var {*} is {=*}': (ctx) => {
          const v = ctx.expr.getValue(0);
          ctx.expr.setId(0, Number(v));
        },
      });
      await sc.run();
      expect.assertions(1);
    });

    test('medium 2', async () => {
      const sc = Scenario.Given({
        that: `
        IdTypes: c1,c2,c3,c4: Companies; ci1,ci2,c3,c4: CrmInfos
        // Should be Included
          Given a company {c1}, ref by crmInfo {ci1} synced {=1 min} ago, and being active {=true}
            And company {c1} was updated {=5 min} ago
        //  And company {c1} have an employment record updated {=3 min} ago
            And company {c1} have a program updated {=5 sec} ago
        ` as const,
      })
        .When(() => {
          /**/
        })
        .Then(() => {
          expect(1).toBe(1);
        });
      sc.useImplementation({
        'a company {*}, ref by crmInfo {*} synced {=*} ago, and being active {=*}': () => {
          /**/
        },
        'company {*} was updated {=*} ago': () => {
          /**/
        },
        'company {*} have a program updated {=*} ago': () => {
          /**/
        },
      });
      await sc.run();
      expect.assertions(1);
    });

    test('complex 1', async () => {
      const getDayDiff = (d1: Date, d2: Date) => {
        const dayDiff = (d2.valueOf() - d1.valueOf()) / (24 * 60 * 60 * 1000);
        return `d2 on ${d2.toLocaleDateString('en-US')} is ${Math.abs(dayDiff)
          .toFixed(1)
          .replace('.0', '')} days ${
          dayDiff < 0 ? 'before' : 'after'
        } d1 on ${d1.toLocaleDateString('en-US')}`;
      };
      const toDate = (str: string) => new Date(str);

      const s1 = Scenario.Given({
        that: `
            IdTypes: d1,d2: Date
            date {d1} is {=4/23/2022}
            date {d2} is {=1} week before {d1}
          ` as const,
        withTypes: { Date: Date.prototype },
      });
      s1.When((ctx) => getDayDiff(...ctx.thatIds('d1', 'd2'))).Then(
        (ctx, { result }) => {
          expect(result).toEqual(
            'd2 on 4/16/2022 is 7 days before d1 on 4/23/2022',
          );
        },
      );

      const s2 = Scenario.Given({
        that: `
          IdTypes: d1,d2: Date
          date {d1} is {=5/2/2022}
          date {d2} is {=2} days after {d1}
        ` as const,
        withTypes: { Date: Date.prototype },
      })
        // s2
        .When((ctx) => getDayDiff(...ctx.thatIds('d1', 'd2')));
      s2.Then((ctx, { result }) => {
        expect(result).toEqual('d2 on 5/4/2022 is 2 days after d1 on 5/2/2022');
      });
      s2.useImplementation({});

      Scenario.forEach(s1, s2).useImplementation({
        'date {*} is {=*}': (ctx) => {
          ctx.expr.setId(0, ctx.expr.getValue(0, toDate));
        },
        'date {*} is {=*} week before {*}': (ctx) => {
          const dRef = ctx.expr.getId(1);
          const weekOffset =
            Number(ctx.expr.getValue(0)) * (7 * 24 * 60 * 60 * 1000);
          ctx.expr.setId(0, new Date(dRef.valueOf() - weekOffset));
        },
        'date {*} is {=*} days after {*}': (ctx) => {
          const dRef = ctx.expr.getId(1);
          const daysOffset =
            Number(ctx.expr.getValue(0)) * (24 * 60 * 60 * 1000);
          ctx.expr.setId(0, new Date(dRef.valueOf() + daysOffset));
        },
      });

      await Scenario.runAll(s1, s2);
      expect.assertions(2);
    });

    test('complex 2', async () => {
      const sc1 = Scenario.Given({
        that: [
          `
            IdTypes: now: number; c1,c2,c3,c4,c5,c6: Company; ci1,ci2,ci3,ci4,ci5,ci6: CrmInfo
  
            Given {now} is the current timestamp
          `,
          `
          // should be included (by empl rec recent upd)
            Given a company {c1}, is ref by the crmInfo {ci1} synced {=3 min} ago and being active {=true}
              And {c1} was updated {=5 min} ago
              And {c1} has an employment record updated {=5 sec} ago
          `,
          `
          // should not be included (crm info inactive)
            Given a company {c2}, is ref by the crmInfo {ci2} synced {=60 min} ago and being active {=false}
              And {c2} was updated {=20 min} ago
          `,
          `
          // should be included (by company recent upd)
            Given a company {c3}, is ref by the crmInfo {ci3} synced {=1 min} ago and being active {=true}
            And {c3} was updated {=59 sec} ago
          `,
          `
          // should not be included (company already synced)
            Given a company {c4}, is ref by the crmInfo {ci4} synced {=3 min} ago and being active {=true}
              And {c4} was updated {=4 min} ago
          `,
          `
          // should not be included (crm info inactive)
          Given a company {c5}, is ref by the crmInfo {ci5} synced {=1 min} ago and being active {=false}
          `,
          `
          // should be included (by empl rec recent upd)
          Given a company {c6}, is ref by the crmInfo {ci6} synced {=1 min} ago and being active {=true}
            And {c6} was updated {=10 min} ago
            And {c6} has an employment record updated {=0 sec} ago
          `,
        ] as const,
        withTypes: { Company: Company.prototype, CrmInfo: CrmInfo.prototype },
      })
        .When(async () => getUnsyncedCrmInfos())
        .Then((ctx, { result }) => {
          const [ci1, ci3, ci6, c1, c3, c6] = ctx.thatIds(
            'ci1',
            'ci3',
            'ci6',
            'c1',
            'c3',
            'c6',
          );

          expect(result.map((x) => x.id)).toEqual([ci1.id, ci3.id, ci6.id]);

          expect(ci1.company).toEqual(c1);
          expect(ci3.company).toEqual(c3);
          expect(ci6.company).toEqual(c6);
        });

      sc1.useImplementation({
        '{*} is the current timestamp': (ctx) => {
          // track current time
          ctx.expr.setId(0, Date.now());
        },

        'a company {*}, is ref by the crmInfo {*} synced {=*} ago and being active {=*}': (
          ctx,
        ) => {
          const now = ctx.thatId('now');
          const [lastSyncedDate, isActive] = ctx.expr.getValues([
            toPastDate(now),
            toBoolean,
          ]);
          // register a company
          const company = db.addCompany(
            new Company({
              name: ctx.expr.getIdName(0),
              updatedOn: lastSyncedDate,
            }),
          );
          ctx.expr.setId(0, company);
          // register an account crmInfo for this company, and set its lastSynced & isActive props
          const crmInfo = new CrmInfo();
          crmInfo.company = company;
          crmInfo.lastSynced = lastSyncedDate;
          crmInfo.isActive = isActive;
          ctx.expr.setId(1, db.addCrmInfo(crmInfo));
        },

        '{*} was updated {=*} ago': (ctx) => {
          // update the ref company's lastUpdated date
          const now = ctx.thatId('now');
          const v = ctx.expr.getValue(0);
          const updateDate = ctx.expr.getValue(0, toPastDate(now));
          ctx.expr.getId(0).lastUpdated = updateDate;
        },

        '{*} has an employment record updated {=*} ago': (ctx) => {
          // register for the ref company, an employment record and set its lastUpdated date
          const now = ctx.thatId('now');
          const company = ctx.expr.getId(0);
          const empRec = new EmploymentRec(`${company.name}_employee`);
          empRec.lastUpdated = ctx.expr.getValue(0, toPastDate(now));
          company.employmentRecords.push(empRec);
        },
      });

      await sc1.run();
      expect.assertions(4);
    });
  });
});

/// ------------

class EmploymentRec {
  constructor(public name: string) {}
  public lastUpdated?: Date;
}

class Company {
  constructor(data: { id?: number; name: string; updatedOn: Date }) {
    this.id = data.id;
    this.name = data.name;
    this.lastUpdated = data.updatedOn;
  }
  public id?: number;
  public name: string;
  public lastUpdated?: Date;
  public employmentRecords: EmploymentRec[] = [];
}

class CrmInfo {
  public id?: number;
  public company?: Company;
  public lastSynced?: Date;
  public isActive?: boolean;
}

interface Db {
  nextCompanyId: number;
  nextCrmInfoId: number;
  companies: Company[];
  crmInfos: CrmInfo[];
  addCompany: (c: Company) => Company;
  addCrmInfo: (c: CrmInfo) => CrmInfo;
}

const db: Db = {
  nextCompanyId: 1,
  nextCrmInfoId: 1,
  companies: [],
  crmInfos: [],
  addCompany: (c) => {
    c.id = db.nextCompanyId++;
    db.companies.push(c);
    return c;
  },
  addCrmInfo: (c) => {
    c.id = db.nextCrmInfoId++;
    db.crmInfos.push(c);
    return c;
  },
};

function getUnsyncedCrmInfos(): CrmInfo[] {
  return db.crmInfos.filter(
    (x) =>
      x.isActive &&
      (dateIsMoreRecent(x.company?.lastUpdated, x.lastSynced) ||
        x.company?.employmentRecords.some((e) =>
          dateIsMoreRecent(e.lastUpdated, x.lastSynced),
        )),
  );
}

function dateIsMoreRecent(d?: Date, dRef?: Date) {
  const defaultPastTimeStamp = new Date('3/13/2015').valueOf();
  const tsRef = dRef?.valueOf() ?? defaultPastTimeStamp;
  const ts = d?.valueOf() ?? defaultPastTimeStamp;
  return ts - tsRef > 0;
}

const toPastDate = (now: number) => (strOffset: string): Date => {
  const parts = strOffset.match(/(\d+)\s+(min|sec)/i)?.slice(1) ?? [];
  if (!parts.length) {
    throw new Error('Invalid sync offset');
  }
  const toMs: any = { min: 60 * 1000, sec: 1000 };
  const offset = Number(parts[0]) * toMs[parts[1].toLowerCase()];
  return new Date(now - offset);
};
const toBoolean = (str: string): boolean => {
  return str.toLowerCase() === 'true';
};
