import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../../shared/types';
import { useAuth } from '../../lib/auth';
import { apiClient } from '../../lib/apiClient';
import { Building2, Calculator, CheckCircle2, ChevronRight, Loader2, ArrowRight } from 'lucide-react';

interface FinanceCardProps {
  car: Vehicle;
}

type WizardStep = 'INPUT' | 'LOADING' | 'RESULTS' | 'SUCCESS';

interface BankSuggestion {
  bankId: string;
  bankName: string;
  logoUrl: string | null;
  interestRate: number;
  minDownPaymentRequired: number;
  maxLoanTermMonths: number;
  monthlyInstallmentEstimate: number;
  totalPayableEstimate: number;
  processingFeeEstimate: number;
}

interface CalcResult {
  vehiclePriceEtb: number;
  tradeInValueEtb: number;
  deltaBalance: number;
  insuranceEstimate: number;
  isEV: boolean;
  bankSuggestions: BankSuggestion[];
}

export const FinanceCard: React.FC<FinanceCardProps> = ({ car }) => {
  const { session } = useAuth();
  const [step, setStep] = useState<WizardStep>('INPUT');
  const [tradeIn, setTradeIn] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankSuggestion | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = async () => {
    setStep('LOADING');
    setError('');
    
    try {
      const data = await apiClient.post<CalcResult>('/finance/calculator', {
        targetCarPriceEtb: car.retail_price_etb || 0,
        tradeInValueEtb: Number(tradeIn) || 0,
        isEV: car.fuel === 'ELECTRIC'
      });
      setResult(data);
      setStep('RESULTS');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financing data.');
      setStep('INPUT');
    }
  };

  const handleApply = async () => {
    if (!session?.access_token) {
      alert("Please login to apply for financing.");
      return;
    }
    if (!selectedBank || !result) return;

    setStep('LOADING');
    try {
      await apiClient.post(
        '/finance-plans', 
        {
          vehicleId: car.id,
          bankId: selectedBank.bankId,
          downPaymentEtb: selectedBank.minDownPaymentRequired,
          loanAmountEtb: result.deltaBalance,
          termMonths: selectedBank.maxLoanTermMonths,
          interestRate: selectedBank.interestRate,
          monthlyPaymentEtb: selectedBank.monthlyInstallmentEstimate,
          tradeInValueEtb: result.tradeInValueEtb,
          insuranceCostEtb: result.insuranceEstimate,
          processingFeeEtb: selectedBank.processingFeeEstimate,
          totalPayableEtb: selectedBank.totalPayableEstimate
        },
        { Authorization: `Bearer ${session.access_token}` }
      );
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
      setStep('RESULTS');
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="bg-bg border border-accent/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">Application Submitted!</h3>
        <p className="text-sm text-text-secondary">Our finance team will review your application with {selectedBank?.bankName} and contact you shortly.</p>
        <button 
          onClick={() => {
            setStep('INPUT');
            setTradeIn('');
            setSelectedBank(null);
          }}
          className="mt-4 px-6 py-2 bg-bg-secondary text-text-primary rounded-xl font-semibold border border-border"
        >
          Calculate Another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="bg-bg-secondary p-5 border-b border-border flex items-center gap-3">
        <Calculator className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-text-primary">Finance Configurator</h3>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {step === 'INPUT' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Trade-In Value (ETB) - Optional
              </label>
              <input 
                type="number" 
                value={tradeIn}
                onChange={e => setTradeIn(e.target.value)}
                placeholder="e.g. 1,500,000" 
                className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3.5 text-sm text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-text-secondary"
              />
            </div>
            
            <div className="flex justify-between items-center bg-accent/5 border border-accent/10 p-4 rounded-xl">
              <div>
                <p className="text-xs text-text-secondary font-medium">Vehicle Price</p>
                <p className="text-lg font-bold text-text-primary">{((car.retail_price_etb || 0) / 1000000).toFixed(2)}M ETB</p>
              </div>
              <button
                onClick={handleCalculate}
                className="bg-accent text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-accent/90 transition flex items-center gap-2"
              >
                View Options
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'LOADING' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm font-medium text-text-secondary">Crunching numbers with our bank partners...</p>
          </div>
        )}

        {step === 'RESULTS' && result && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                 <p className="text-xs text-text-secondary mb-1">Loan Amount</p>
                 <p className="font-bold text-text-primary">{(result.deltaBalance / 1000000).toFixed(2)}M</p>
               </div>
               <div className="bg-bg-secondary p-3 rounded-xl border border-border">
                 <p className="text-xs text-text-secondary mb-1">Est. Insurance/yr</p>
                 <p className="font-bold text-text-primary">{(result.insuranceEstimate / 1000).toFixed(0)}K</p>
               </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Select a Bank Partner
              </h4>
              
              {result.bankSuggestions.map(bank => (
                <div 
                  key={bank.bankId}
                  onClick={() => setSelectedBank(bank)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedBank?.bankId === bank.bankId ? 'border-accent bg-accent/5' : 'border-border hover:border-text-secondary/30'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-text-primary">{bank.bankName}</span>
                    <span className="text-xs font-semibold bg-bg-secondary px-2 py-1 rounded text-text-secondary">
                      {bank.interestRate}% APR
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-text-secondary text-xs">Min Downpayment</p>
                      <p className="font-semibold text-text-primary">{(bank.minDownPaymentRequired / 1000000).toFixed(2)}M</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs">Est. Monthly ({bank.maxLoanTermMonths} mo)</p>
                      <p className="font-semibold text-accent">~{(bank.monthlyInstallmentEstimate / 1000).toFixed(1)}K</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button 
                onClick={() => setStep('INPUT')}
                className="text-sm font-semibold text-text-secondary hover:text-text-primary transition"
              >
                Back to Input
              </button>
              
              <button
                disabled={!selectedBank}
                onClick={handleApply}
                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${selectedBank ? 'bg-accent text-white hover:bg-accent/90' : 'bg-bg-secondary text-text-secondary cursor-not-allowed'}`}
              >
                {session ? 'Apply Now' : 'Login to Apply'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
