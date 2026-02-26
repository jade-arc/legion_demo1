'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Plus, Trash2, CheckCircle, AlertCircle, ChevronLeft, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useUserTransactions } from '@/hooks/use-user-transactions';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const CATEGORIES = [
  'Groceries',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Dining',
  'Rent/Mortgage',
  'Salary',
  'Investments',
  'Insurance',
  'Subscriptions',
  'Other',
];

export default function DataInputPage() {
  const { addTransaction, transactions, removeTransaction } = useUserTransactions();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Other',
    amount: 0,
    type: 'expense' as 'income' | 'expense',
  });

  const handleAddTransaction = () => {
    setError(null);
    setSuccess(null);

    if (!formData.date || !formData.description || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    addTransaction({
      date: new Date(formData.date),
      description: formData.description,
      category: formData.category,
      amount: formData.amount,
      type: formData.type,
    });

    setSuccess('Transaction added successfully!');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'Other',
      amount: 0,
      type: 'expense',
    });

    setTimeout(() => setSuccess(null), 3000);
  };

  const processData = (data: any[]) => {
    if (data.length === 0) {
      setError('File is empty');
      setIsUploading(false);
      return;
    }

    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    const dateKey = keys.find(k => k.toLowerCase() === 'date');
    const descKey = keys.find(k => ['description', 'merchant', 'details'].includes(k.toLowerCase()));
    const amountKey = keys.find(k => k.toLowerCase() === 'amount');
    const typeKey = keys.find(k => k.toLowerCase() === 'type');
    const categoryKey = keys.find(k => k.toLowerCase() === 'category');

    if (!dateKey || !descKey || !amountKey) {
      setError('File must have headers: date, description (or merchant), amount');
      setIsUploading(false);
      return;
    }

    let imported = 0;
    data.forEach(row => {
      const txDateValue = row[dateKey!];
      let txDate: Date;

      if (typeof txDateValue === 'number' && txDateValue > 40000) {
        // Excel serial date
        txDate = new Date((txDateValue - 25569) * 86400 * 1000);
      } else {
        txDate = new Date(txDateValue);
      }

      const txAmount = parseFloat(row[amountKey!]);
      const txType = (row[typeKey!] || 'expense').toString().toLowerCase();

      if (!isNaN(txAmount) && row[descKey!] && !isNaN(txDate.getTime())) {
        addTransaction({
          date: txDate,
          description: row[descKey].toString(),
          category: categoryKey ? (row[categoryKey]?.toString() || 'Other') : 'Other',
          amount: Math.abs(txAmount),
          type: txType.includes('income') || txAmount > 0 ? 'income' : 'expense',
        });
        imported++;
      }
    });

    if (imported === 0) {
      setError('No valid transactions could be imported. Check your date and amount formats.');
    } else {
      setSuccess(`Successfully imported ${imported} transactions!`);
      setTimeout(() => setSuccess(null), 3000);
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          processData(results.data);
        },
        error: (err) => {
          setError(`CSV Parse Error: ${err.message}`);
          setIsUploading(false);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result as string;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processData(data);
        } catch (err: any) {
          setError(`Excel Parse Error: ${err.message}`);
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setError('File reading error');
        setIsUploading(false);
      };
      reader.readAsBinaryString(file);
    } else {
      setError('Unsupported file format. Please upload CSV or Excel.');
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Add Transaction Data</h1>
            </div>
            <p className="text-muted-foreground">
              Manually input transactions or upload via CSV/Excel. The AI will analyze this data to optimize your portfolio.
            </p>
          </div>

          {error && (
            <Card className="bg-red-500/10 border border-red-500/30 p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            </Card>
          )}

          {success && (
            <Card className="bg-green-500/10 border border-green-500/30 p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-500 text-sm">{success}</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Manual Entry */}
            <Card className="lg:col-span-1 bg-card border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Manual Entry</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                  <Input
                    placeholder="e.g., Whole Foods groceries"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Amount (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                    className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <Button onClick={handleAddTransaction} className="w-full bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </Card>

            {/* File Upload */}
            <Card className="lg:col-span-2 bg-card border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Bulk Import (CSV/Excel)</h2>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 transition-colors hover:border-primary/50 group">
                <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Upload your transaction file</h3>
                <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                  Drag and drop your file here, or click to browse. Supports .csv, .xlsx, and .xls formats.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isUploading ? 'Processing...' : 'Choose File'}
                  </Button>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-8 w-full border-t border-border pt-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">CSV Files</p>
                      <p className="text-xs text-muted-foreground">Standard comma-separated</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 p-2 rounded-lg">
                      <FileSpreadsheet className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Excel Files</p>
                      <p className="text-xs text-muted-foreground">.xlsx or .xls formats</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-foreground mb-2">Required Columns:</h4>
                <div className="flex flex-wrap gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">date</code>
                  <code className="bg-muted px-2 py-1 rounded text-xs">description</code>
                  <code className="bg-muted px-2 py-1 rounded text-xs">amount</code>
                  <span className="text-xs text-muted-foreground mt-1 ml-1">(Optional: type, category)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Transactions List */}
          {transactions.length > 0 && (
            <Card className="bg-card border-border p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Your Transactions</h2>
                  <p className="text-sm text-muted-foreground">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
                </div>
                <Link href="/">
                  <Button className="bg-primary hover:bg-primary/90">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between bg-muted p-4 rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.date.toLocaleDateString()} • {tx.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-semibold min-w-20 text-right ${tx.type === 'income' ? 'text-green-400' : 'text-foreground'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTransaction(tx.id)}
                        className="hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {transactions.length === 0 && (
            <Card className="bg-muted/30 border border-dashed border-border p-12 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-foreground font-medium">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Add transactions using the form above or upload a file</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
