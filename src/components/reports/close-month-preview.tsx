"use client";

import { useMemo, useState } from "react";
import { closeMonth } from "@/app/(member)/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatTaka } from "@/lib/utils";

type PreviewRow = {
  id: string;
  name: string;
  previousBalance: number;
  monthlyShare: number;
  expensePaid: number;
  cashPaid: number;
  totalContribution: number;
  closingBalance: number;
};

type CloseMonthPreviewProps = {
  monthLabel: string;
  totalExpense: number;
  monthlyShare: number;
  memberCount: number;
  totalDue: number;
  totalAdvance: number;
  rows: PreviewRow[];
};

export function CloseMonthPreview({
  monthLabel,
  totalExpense,
  monthlyShare,
  memberCount,
  totalDue,
  totalAdvance,
  rows
}: CloseMonthPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dueRows = useMemo(() => rows.filter((row) => row.closingBalance > 0), [rows]);
  const advanceRows = useMemo(() => rows.filter((row) => row.closingBalance < 0), [rows]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-xl shadow-teal-100 transition hover:-translate-y-0.5 hover:bg-slate-950"
      >
        Close month
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 px-3 py-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl shadow-slate-950/25 ring-1 ring-slate-900/10 sm:rounded-[2rem]">
            <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#07111f_0%,#123434_100%)] p-5 text-white sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-teal-200 sm:text-xs">Final check</p>
              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black sm:text-3xl">Close {monthLabel}?</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-300">Review everything before locking this month.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/20"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Expense</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{formatTaka(totalExpense)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Share</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{formatTaka(monthlyShare)}</p>
                  <p className="text-[10px] font-bold text-slate-400">{memberCount} active</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-400">Total due</p>
                  <p className="mt-1 text-lg font-black text-rose-700">{formatTaka(totalDue)}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-500">Advance</p>
                  <p className="mt-1 text-lg font-black text-emerald-700">{formatTaka(totalAdvance)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.35rem] border border-rose-100 bg-rose-50/45 p-3 sm:p-4">
                  <h3 className="text-sm font-black text-rose-800">Members who need to pay</h3>
                  <div className="mt-3 space-y-2">
                    {dueRows.length ? dueRows.map((row) => (
                      <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm shadow-sm">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">{row.name}</p>
                          <p className="text-[11px] font-semibold text-slate-400">Contribution {formatTaka(row.totalContribution)}</p>
                        </div>
                        <p className="shrink-0 font-black text-rose-700">{formatTaka(row.closingBalance)}</p>
                      </div>
                    )) : <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-500">No one has due.</p>}
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50/45 p-3 sm:p-4">
                  <h3 className="text-sm font-black text-emerald-800">Members with advance</h3>
                  <div className="mt-3 space-y-2">
                    {advanceRows.length ? advanceRows.map((row) => (
                      <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm shadow-sm">
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">{row.name}</p>
                          <p className="text-[11px] font-semibold text-slate-400">Contribution {formatTaka(row.totalContribution)}</p>
                        </div>
                        <p className="shrink-0 font-black text-emerald-700">{formatTaka(Math.abs(row.closingBalance))}</p>
                      </div>
                    )) : <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-500">No advance balance.</p>}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                Closing will save this month’s snapshot and move balances into the next month. You can still reopen the latest month from History if you need to fix something.
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
              >
                Review again
              </button>
              <form action={closeMonth}>
                <SubmitButton pendingText="Closing..." className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 sm:w-auto">
                  Confirm close month
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
