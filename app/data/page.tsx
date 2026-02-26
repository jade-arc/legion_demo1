'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Plus, Trash2, CheckCircle, AlertCircle, ChevronLeft, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useUserTransactions } from '@/hooks/use-user-transactions';
import { useLongevityAssets } from '@/hooks/use-longevity-assets';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { classifyTransactions } from '@/lib/services/gemini';

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

const ASSET_TYPES = [
  { id: 'staking', name: 'Staking' },
  { id: 'yield_farming', name: 'Yield Farming' },
  { id: 'lending', name: 'Lending' },
  { id: 'insurance', name: 'Insurance' }
];

const COIN_OPTIONS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'aave', name: 'Aave' },
  { id: 'tether', name: 'Tether (USDT)' },
  { id: 'solana', name: 'Solana' },
  { id: 'cardano', name: 'Cardano' }
];

export default function DataInputPage() {
  const { addTransaction, transactions, removeTransaction } = useUserTransactions();
  const { assets, addAsset, removeAsset } = useLongevityAssets();
  const [activeTab, setActiveTab] = useState<'transactions' | 'assets'>('transactions');

  // Transaction States
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

  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);

  // Asset States
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    coingeckoId: 'ethereum',
    type: 'staking' as 'staking' | 'yield_farming' | 'lending' | 'insurance',
    quantity: 0,
    initialInvestment: 0,
    apy: 3.5,
    description: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('wealth_api_keys');
    if (stored) {
      const keys = JSON.parse(stored);
      const active = keys.find((k: any) => k.active && k.provider === 'gemini');
      if (active) setActiveApiKey(active.key);
    }
  }, []);

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

  const handleAddAsset = () => {
    setError(null);
    setSuccess(null);

    if (!assetFormData.name || !assetFormData.quantity || !assetFormData.initialInvestment) {
      setError('Please fill in all required fields for the asset');
      return;
    }

    addAsset({
      ...assetFormData,
    });

    setSuccess('Longevity asset added successfully!');
    setAssetFormData({
      name: '',
      coingeckoId: 'ethereum',
      type: 'staking',
      quantity: 0,
      initialInvestment: 0,
      apy: 3.5,
      description: ''
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

    if (!dateKey || !descKey || !amountKey) {
      setError('File must have headers: date, description (or merchant), amount');
      setIsUploading(false);
      return;
    }

    let imported = 0;
    const itemsToClassify: { description: string; amount: number; index: number }[] = [];

    data.forEach((row, idx) => {
      const txAmount = parseFloat(row[amountKey!]);
      if (!isNaN(txAmount) && row[descKey!]) {
        itemsToClassify.push({
          description: row[descKey!].toString(),
          amount: Math.abs(txAmount),
          index: idx
        });
      }
    });

    if (itemsToClassify.length === 0) {
      setError('No valid transactions found in file.');
      setIsUploading(false);
      return;
    }

    classifyTransactions(activeApiKey!, itemsToClassify).then(results => {
      results.forEach((res, i) => {
        const row = data[itemsToClassify[i].index];
        const txDateValue = row[dateKey!];
        let txDate: Date;

        if (typeof txDateValue === 'number' && txDateValue > 40000) {
          txDate = new Date((txDateValue - 25569) * 86400 * 1000);
        } else {
          txDate = new Date(txDateValue);
        }

        if (!isNaN(txDate.getTime())) {
          addTransaction({
            date: txDate,
            description: res.description,
            category: res.category,
            amount: res.amount,
            type: res.type,
          });
          imported++;
        }
      });

      if (imported === 0) {
        setError('No valid transactions could be imported. Check your date formats.');
      } else {
        setSuccess(`Successfully imported ${imported} transactions with AI classification!`);
        setTimeout(() => setSuccess(null), 3000);
      }
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }).catch(err => {
      setError(`AI Classification Failed: ${err.message}.`);
      setIsUploading(false);
    });
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
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'transactions' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('transactions')}
              className="text-xs"
            >
              Transactions
            </Button>
            <Button
              variant={activeTab === 'assets' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('assets')}
              className="text-xs"
            >
              Longevity Assets
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {activeTab === 'transactions' ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <Plus className="h-8 w-8 text-accent" />
              )}
              <h1 className="text-3xl font-bold text-foreground">
                {activeTab === 'transactions' ? 'Add Transaction Data' : 'Manage Longevity Assets'}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {activeTab === 'transactions'
                ? 'Manually input transactions or upload via CSV/Excel. The AI will analyze this data to optimize your portfolio.'
                : 'Track your holdings in staking pools, lending protocols, and other longevity-focused financial instruments.'}
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

          {activeTab === 'transactions' ? (
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
                      className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
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
                      className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
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
              <Card className="lg:col-span-2 bg-card border-border p-6 relative overflow-hidden">
                {!activeApiKey && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Gemini API Key Required</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                      Bulk import features require an active Gemini API key for intelligent transaction classification.
                    </p>
                    <Link href="/api-keys">
                      <Button className="bg-primary hover:bg-primary/90">
                        Configure API Key
                      </Button>
                    </Link>
                  </div>
                )}
                <h2 className="text-xl font-semibold text-foreground mb-4">Bulk Import (CSV/Excel)</h2>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 transition-colors hover:border-primary/50 group">
                  <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2 text-center">Upload your transaction file</h3>
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
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Asset Form */}
              <Card className="lg:col-span-1 bg-card border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Add Asset</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Asset Name</label>
                    <Input
                      placeholder="e.g., ETH Staking Pool A"
                      value={assetFormData.name}
                      onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Tracking Coin</label>
                      <select
                        value={assetFormData.coingeckoId}
                        onChange={(e) => setAssetFormData({ ...assetFormData, coingeckoId: e.target.value })}
                        className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
                      >
                        {COIN_OPTIONS.map((coin) => (
                          <option key={coin.id} value={coin.id}>{coin.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Asset Type</label>
                      <select
                        value={assetFormData.type}
                        onChange={(e) => setAssetFormData({ ...assetFormData, type: e.target.value as any })}
                        className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
                      >
                        {ASSET_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Quantity</label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={assetFormData.quantity || ''}
                        onChange={(e) => setAssetFormData({ ...assetFormData, quantity: parseFloat(e.target.value) || 0 })}
                        className="bg-muted border-border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Current APY (%)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={assetFormData.apy || ''}
                        onChange={(e) => setAssetFormData({ ...assetFormData, apy: parseFloat(e.target.value) || 0 })}
                        className="bg-muted border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Initial Investment (₹)</label>
                    <Input
                      type="number"
                      value={assetFormData.initialInvestment || ''}
                      onChange={(e) => setAssetFormData({ ...assetFormData, initialInvestment: parseFloat(e.target.value) || 0 })}
                      className="bg-muted border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Notes</label>
                    <textarea
                      placeholder="Optional notes about this investment..."
                      value={assetFormData.description}
                      onChange={(e) => setAssetFormData({ ...assetFormData, description: e.target.value })}
                      className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm min-h-[80px]"
                    />
                  </div>
                  <Button onClick={handleAddAsset} className="w-full bg-accent hover:bg-accent/90 text-white font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Save Asset
                  </Button>
                </div>
              </Card>

              {/* Assets Preview */}
              <Card className="lg:col-span-2 bg-card border-border p-6 overflow-hidden">
                <h2 className="text-xl font-semibold text-foreground mb-4">Active Longevity Assets</h2>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {assets.length > 0 ? (
                    assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border border-border hover:border-accent/30 transition-all group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-foreground">{asset.name}</h4>
                            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full uppercase font-bold">
                              {asset.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {asset.quantity} units • <span className="text-green-400 font-semibold">{asset.apy}% APY</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Investment</p>
                            <p className="font-bold text-foreground text-sm">{formatCurrency(asset.initialInvestment)}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAsset(asset.id)}
                            className="hover:bg-red-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
                      <p className="text-muted-foreground text-sm">No assets tracked yet.</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center">Add your holdings using the form on the left.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'transactions' && transactions.length > 0 && (
            <Card className="bg-card border-border p-6 mb-8 mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Recent Transactions</h2>
                  <p className="text-sm text-muted-foreground">{transactions.length} items logged</p>
                </div>
                <Link href="/">
                  <Button className="bg-primary hover:bg-primary/90">Go to Dashboard</Button>
                </Link>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between bg-muted p-4 rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">{tx.date.toLocaleDateString()} • {tx.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-semibold min-w-20 text-right ${tx.type === 'income' ? 'text-green-400' : 'text-foreground'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <Button size="sm" variant="ghost" onClick={() => removeTransaction(tx.id)} className="hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
