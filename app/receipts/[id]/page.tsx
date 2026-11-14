'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { db } from '@/lib/data';
import {
  Printer,
  Download,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';

function ReceiptDetailContent() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params?.id as string;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'receipt' | 'year_end'>('receipt');

  const receipt = db.funding.getReceipt(receiptId);
  const legal = db.legal.get();

  if (!receipt) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Receipt Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested receipt record could not be located.</p>
        <NextLink href="/give" className="text-xs font-bold text-primary hover:underline">
          Return to Funding Board
        </NextLink>
      </div>
    );
  }

  // All donations by this donor for year-end statement
  const donorDonations = db.funding.listDonations({ donorId: receipt.donorId }).filter((d) => d.status === 'completed');
  const yearEndTotal = donorDonations.reduce((sum, d) => sum + d.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleResend = () => {
    db.funding.resendReceiptToOutbox(receipt.id);
    alert(`Receipt #${receipt.receiptNumber} re-sent to ${receipt.donorEmail}. Check Dev Outbox!`);
  };

  const handleReissue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName) return;
    db.funding.reissueReceipt(receipt.id, {
      donorLegalName: editedName,
      donorAddress: editedAddress || undefined,
    });
    setEditModalOpen(false);
    alert('Receipt updated and re-issued.');
  };

  const handleExportCsv = () => {
    const csvContent = [
      'ReceiptNumber,IssuedDate,DonorName,GrossAmount,DeductibleAmount,Designation,GoodsServicesValue',
      `"${receipt.receiptNumber}","${receipt.issuedAt}","${receipt.donorLegalName}",${receipt.grossAmount},${receipt.deductibleAmount},"${receipt.designationLabel}",${receipt.goodsServicesValue}`,
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${receipt.receiptNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVoided = !!receipt.voidedAt;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <NextLink href="/give" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Funding Board</span>
        </NextLink>

        <div className="flex items-center gap-2">
          {/* Tab Switcher: Single Receipt vs Consolidated Year-End Statement */}
          <div className="flex rounded-lg border border-border bg-card p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('receipt')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'receipt' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
            >
              Tax Receipt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('year_end')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'year_end' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
            >
              Year-End Statement
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-bold hover:bg-primary/90 transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save as PDF</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent transition"
            title="Re-send email to Dev Outbox"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Re-send Email</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent transition"
            title="Export CSV record for accountant"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>

          {!isVoided && (
            <button
              type="button"
              onClick={() => {
                setEditedName(receipt.donorLegalName);
                setEditedAddress(receipt.donorAddress ?? '');
                setEditModalOpen(true);
              }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent transition"
            >
              Update Name/Address
            </button>
          )}
        </div>
      </div>

      {/* Void Notice Banner if Refunded */}
      {isVoided && (
        <div className="rounded-2xl border-2 border-red-500 bg-red-500/10 p-4 text-center text-sm font-bold text-red-700 dark:text-red-400">
          ⚠️ NOTICE: THIS TAX RECEIPT WAS VOIDED ON {new Date(receipt.voidedAt!).toLocaleDateString()} DUE TO REFUND.
          <p className="text-xs font-normal mt-0.5">Reason: {receipt.voidReason}</p>
        </div>
      )}

      {/* TAB 1: INDIVIDUAL TAX RECEIPT */}
      {activeTab === 'receipt' && (
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-primary">Motherboard</span>
              <p className="text-sm font-bold text-foreground mt-1">{receipt.orgLegalNameSnapshot}</p>
              <p className="text-xs text-muted-foreground">{receipt.orgAddressSnapshot}</p>
              <p className="text-xs text-muted-foreground">EIN: {receipt.orgEinSnapshot} • {receipt.taxExemptSnapshot}</p>
            </div>

            <div className="sm:text-right">
              <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-3 py-1 uppercase tracking-wider">
                Official Tax Receipt
              </span>
              <h2 className="text-lg font-black text-foreground mt-2 font-mono">{receipt.receiptNumber}</h2>
              <p className="text-xs text-muted-foreground">Date: {new Date(receipt.issuedAt).toLocaleDateString()}</p>
              {receipt.reissuedCount > 0 && (
                <span className="text-[10px] text-amber-600 font-semibold block">
                  Re-issued (Revision {receipt.reissuedCount})
                </span>
              )}
            </div>
          </div>

          {/* Donor Information Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm p-4 rounded-2xl bg-accent/30 border border-border/60">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Donor / Contributing Organization
              </span>
              <h4 className="font-bold text-foreground text-base">{receipt.donorLegalName}</h4>
              {receipt.donorContactName && <p className="text-muted-foreground">Attn: {receipt.donorContactName}</p>}
              <p className="text-muted-foreground">{receipt.donorEmail}</p>
              {receipt.donorAddress && <p className="text-muted-foreground">{receipt.donorAddress}</p>}
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Payment Verification
              </span>
              <p className="font-semibold text-foreground">{receipt.paymentMethodLabel}</p>
              {receipt.poOrInvoiceNumber && (
                <p className="text-muted-foreground">PO / Invoice #: {receipt.poOrInvoiceNumber}</p>
              )}
              <p className="text-muted-foreground">Designation: {receipt.designationLabel}</p>
            </div>
          </div>

          {/* Amount and Quid Pro Quo Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Contribution Breakdown</h4>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-accent/50 border-b border-border font-bold text-muted-foreground">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Gross Amount</th>
                    <th className="p-3 text-right">Value of Goods/Services Provided</th>
                    <th className="p-3 text-right">Tax-Deductible Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  <tr>
                    <td className="p-3">
                      <div>Contribution to {receipt.designationLabel}</div>
                      <div className="text-[11px] text-muted-foreground italic mt-0.5">
                        {receipt.goodsServicesDescription}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold">${receipt.grossAmount.toFixed(2)}</td>
                    <td className="p-3 text-right text-rose-600">-${receipt.goodsServicesValue.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600 text-base">
                      ${receipt.deductibleAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Discretion & IRS Contemporaneous Written Acknowledgment Notice */}
          <div className="p-4 rounded-2xl bg-accent/20 border border-border/80 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p>
              <strong>Contemporaneous Written Acknowledgment (IRC Section 170):</strong> {receipt.goodsServicesDescription}
            </p>
            <p>
              <strong>Fiduciary Discretion:</strong> {receipt.discretionStatementSnapshot}
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Please retain this official receipt for your federal and state income tax records.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: YEAR-END CONSOLIDATED STATEMENT */}
      {activeTab === 'year_end' && (
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
          <div className="flex justify-between items-start border-b border-border pb-6">
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-primary">Motherboard</span>
              <p className="text-sm font-bold text-foreground mt-1">{legal.orgLegalName}</p>
              <p className="text-xs text-muted-foreground">EIN: {legal.orgEin} • 501(c)(3) Charitable Organization</p>
            </div>
            <div className="text-right">
              <span className="rounded-full bg-purple-500/10 text-purple-700 font-bold text-xs px-3 py-1 uppercase">
                Annual Giving Statement
              </span>
              <h2 className="text-lg font-bold text-foreground mt-2">Calendar Year 2027</h2>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-accent/30 border border-border/60 text-xs">
            <span className="font-bold text-foreground block text-sm">{receipt.donorLegalName}</span>
            <p className="text-muted-foreground">{receipt.donorEmail}</p>
            <p className="text-muted-foreground font-semibold mt-2">
              Total Cumulative Contributions in 2027: <span className="text-emerald-600 font-bold">${yearEndTotal.toFixed(2)}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-accent/50 border-b border-border font-bold text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {donorDonations.map((d) => (
                  <tr key={d.id}>
                    <td className="p-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 capitalize">{d.frequency.replace('_', ' ')}</td>
                    <td className="p-3">{d.designationLabel}</td>
                    <td className="p-3 text-right font-bold">${d.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Update Receipt Legal Details</h3>
            <form onSubmit={handleReissue} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Donor Legal Name</label>
                <input
                  type="text"
                  required
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Mailing Address</label>
                <input
                  type="text"
                  value={editedAddress}
                  onChange={(e) => setEditedAddress(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                >
                  Save & Re-Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReceiptDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading receipt details...</div>}>
      <ReceiptDetailContent />
    </Suspense>
  );
}

