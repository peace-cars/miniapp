import React from 'react';
import { 
  CheckCircle2, AlertTriangle, Battery, Zap, 
   Settings, Car, Search, FileText, User,
   DollarSign, Shield, MapPin, Calendar, ClipboardCheck, X
} from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface EvaluationReportProps {
  lead: any;
  onClose: () => void;
}

export const EvaluationReport: React.FC<EvaluationReportProps> = ({ lead, onClose }) => {
  const inspection = lead.inspections?.[0];
  if (!inspection) return null;

  const checklist = inspection.checklist || {};
  const evData = inspection.ev_data || {};
  const inspector = inspection.profiles || {};
  
  const categories = [
    { id: '1.0', name: 'EXTERIOR BODY & PAINT', icon: Car, data: checklist.exterior || [] },
    { id: '2.0', name: 'INTERIOR & CABIN SYSTEMS', icon: Search, data: checklist.interior || [] },
    { id: '3.0', name: 'MECHANICAL & DRIVETRAIN', icon: Settings, data: checklist.mechanical || [] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-8 bg-bg/95 backdrop-blur-md animate-fade-in print:bg-white print:p-0 print:block print:static print:inset-auto">
      
      {/* Precision Print Architecture */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Targeted visibility override to ensure only the dossier prints */
          body * {
            visibility: hidden !important;
          }
          
          .print-isolated, .print-isolated * {
            visibility: visible !important;
          }
  
          .print-isolated {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            background: white !important;
          }
  
          @page { 
            size: A4; 
            margin: 1.5cm; 
          }
          
          body { 
            background: white !important; 
            color: black !important;
            overflow: visible !important;
          }
  
          .no-print { display: none !important; }
  
          .dossier-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 2rem !important;
          }
  
          .official-bg {
            position: fixed !important;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='12' font-weight='900' fill='rgba(0,0,0,0.02)' font-family='monospace' text-anchor='middle' transform='rotate(-35, 100, 100)'%3EPCS OFFICIAL REGISTRY%3C/text%3E%3C/svg%3E") !important;
            background-repeat: repeat !important;
            z-index: -1 !important;
            pointer-events: none !important;
            visibility: visible !important;
          }
  
          .data-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .data-table td, .data-table th {
            border: 0.5pt solid #ddd !important;
            padding: 10pt !important;
            font-size: 10pt !important;
            line-height: 1.4 !important;
          }
        }
      `}} />

      <div className="neo-card text-text-primary w-full max-w-5xl h-[98vh] sm:h-[95vh] rounded-xl md:rounded-none overflow-hidden flex flex-col relative animate-slide-up print-isolated print:bg-white print:shadow-none">
        
        {/* Background Layer */}
        <div className="absolute inset-0 pointer-events-none official-bg print:opacity-100" />

        {/* Dossier Header */}
        <div className="p-5 sm:p-8 md:p-10 border-b-4 border-text-primary flex flex-col gap-6 md:flex-row md:items-start md:justify-between relative z-10 print:px-0 print:pb-6 print:mb-6 print:flex-row print:border-black">
          <div className="flex items-center md:items-start gap-4 md:gap-8">
             <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-text-primary text-bg flex flex-col items-center justify-center border-4 border-text-primary shadow-lg shrink-0 print:bg-black print:text-white print:border-black">
                <span className="font-black text-xl sm:text-2xl md:text-3xl leading-none">PCS</span>
                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-tighter mt-1 border-t border-white/30 pt-1">EST. 2024</span>
             </div>
             <div className="space-y-1 md:space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-text-primary tracking-tight leading-none uppercase print:text-black">Technical Appraisal Dossier</h1>
                <div className="flex flex-col gap-0.5">
                   <p className="text-[8px] sm:text-[10px] md:text-xs text-text-primary font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] print:text-black">Peace Car Sell • Asset Valuation Division</p>
                   <p className="text-[8px] md:text-[10px] text-text-secondary font-bold uppercase tracking-widest italic print:text-gray-600">Digital Certificate of Condition & Registry Entry</p>
                </div>
             </div>
          </div>
          <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-start md:text-right no-print">
             <Button variant="primary" className="bg-text-primary text-bg px-4 py-2.5 sm:px-6 sm:py-3.5 md:px-10 md:py-5 rounded-none font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl transition-all" onClick={() => window.print()}>
                Print Dossier
             </Button>
             <button onClick={onClose} className="text-[10px] font-black text-text-secondary hover:text-text-primary uppercase tracking-widest underline decoration-2 flex items-center gap-1.5 transition-all">
               <X size={12} /> Close
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 space-y-10 md:space-y-16 relative z-10 print:overflow-visible print:p-0 print:pt-6">
          
          {/* SECTION 0.0: IDENTIFICATION */}
          <div className="space-y-6 dossier-section print:mt-0">
             <div className="flex items-center justify-between border-b-2 border-border pb-3 print:border-black">
                <h2 className="text-[10px] md:text-xs font-black text-text-primary uppercase tracking-[0.2em] md:tracking-[0.4em] print:text-black">0.0 ASSET IDENTIFICATION & ORIGIN</h2>
                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-text-primary text-bg text-[8px] md:text-[9px] font-black uppercase tracking-widest print:bg-black print:text-white">Verified</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-y-10 md:gap-x-12 print:grid-cols-4 print:gap-x-4">
                {[
                  { label: 'Asset Reference', value: `PCS-${lead.id.substring(0,12).toUpperCase()}`, icon: <ClipboardCheck size={14}/> },
                  { label: 'Evaluation Date', value: new Date(inspection.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase(), icon: <Calendar size={14}/> },
                  { label: 'Processing Hub', value: (lead.locations?.name || 'Central Registry').toUpperCase(), icon: <MapPin size={14}/> },
                  { label: 'Lead Inspector', value: (inspector.full_name || 'Registry Agent').toUpperCase(), icon: <User size={14}/> },
                  { label: 'Vehicle Class', value: lead.vehicle_make_model || 'Standard Unit', icon: <Car size={14}/> },
                  { label: 'Audit Status', value: 'FINALIZED', icon: <Shield size={14}/> }
                ].map(item => (
                  <div key={item.label} className="space-y-1 border-l-2 border-border pl-3 md:border-l-0 md:pl-0">
                     <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2 print:text-gray-500">{item.icon} {item.label}</p>
                     <p className="text-xs md:text-sm font-bold text-text-primary md:border-l-2 md:border-border md:pl-3 print:text-black">{item.value}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* SECTION 1.0 - 3.0: TECHNICAL AUDIT */}
          <div className="space-y-10 md:space-y-12">
             <div className="flex items-center gap-3 border-b-2 border-border pb-3 print:border-black">
                <h2 className="text-[10px] md:text-xs font-black text-text-primary uppercase tracking-[0.2em] md:tracking-[0.4em] print:text-black">TECHNICAL LOG & SYSTEM DIAGNOSTICS</h2>
             </div>
             
             {categories.map(cat => (
                <div key={cat.id} className="dossier-section space-y-4 md:space-y-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-sm md:text-lg font-black text-bg bg-text-primary px-2 py-0.5 md:px-3 md:py-1 print:bg-black print:text-white">{cat.id}</span>
                        <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-widest print:text-black">{cat.name}</h3>
                     </div>
                   </div>

                   {/* Digital Card Layout (Replaces Table for Screen) */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t-2 border-border pt-4 print:hidden">
                      {cat.data.map((point: any) => (
                         <div key={point.id} className="neo-inset p-4 rounded-xl flex flex-col gap-3 transition-transform hover:-translate-y-1 duration-300">
                            <div className="flex items-start justify-between gap-2">
                               <p className="font-bold text-text-primary text-sm leading-tight">{point.label}</p>
                               <span className={cn(
                                  "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-sm shrink-0 shadow-sm",
                                  point.status === 'pass' 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-red-500 text-white'
                               )}>
                                  {point.status === 'pass' ? 'OPTIMAL' : 'DEFECT'}
                               </span>
                            </div>
                            {point.notes && (
                               <p className="italic text-text-secondary font-medium text-xs bg-bg p-2 rounded-md border border-border">"{point.notes}"</p>
                            )}
                         </div>
                      ))}
                   </div>

                   {/* Print-Only Table Layout */}
                   <div className="hidden print:block w-full border border-black">
                     <table className="data-table min-w-full">
                        <thead>
                           <tr className="border-b border-black bg-gray-100">
                              <th className="w-1/2 text-left font-black text-[9px] uppercase tracking-wider p-3">Audit Point</th>
                              <th className="w-1/4 text-center font-black text-[9px] uppercase tracking-wider p-3">Status</th>
                              <th className="w-1/4 text-left font-black text-[9px] uppercase tracking-wider p-3">Observation</th>
                           </tr>
                        </thead>
                        <tbody>
                           {cat.data.map((point: any) => (
                              <tr key={point.id} className="border-t border-gray-300">
                                 <td className="font-bold text-black text-xs p-3">{point.label}</td>
                                 <td className="text-center p-3">
                                    <span className={cn(
                                      "px-2 py-0.5 text-[8px] font-black border uppercase",
                                      point.status === 'pass' ? 'border-gray-300 text-gray-700 bg-gray-50' : 'border-black text-black bg-white'
                                    )}>
                                      {point.status === 'pass' ? 'Optimal' : 'Defect'}
                                    </span>
                                 </td>
                                 <td className="italic text-gray-600 font-medium text-xs p-3">{point.notes || '--'}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   </div>

                   {cat.data.filter((p: any) => p.photo).length > 0 && (
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 pt-2 print:grid-cols-4 print:gap-2">
                        {cat.data.filter((p: any) => p.photo).map((p: any) => (
                          <div key={p.id} className="space-y-1.5">
                             <div className="aspect-[4/3] border-2 border-border overflow-hidden grayscale hover:grayscale-0 transition-all duration-300 print:border-gray-200">
                                <img src={p.photo} alt={p.label} className="w-full h-full object-cover" />
                             </div>
                             <p className="text-[7px] font-bold text-text-secondary uppercase tracking-tighter truncate print:text-gray-500">Ref: {p.label}</p>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             ))}
          </div>

          {Object.keys(evData).length > 0 && (
            <div className="dossier-section space-y-6">
               <div className="flex items-center gap-4">
                  <span className="text-sm md:text-lg font-black text-bg bg-text-primary px-2.5 py-0.5 md:px-3 md:py-1 print:text-white print:bg-black">4.0</span>
                  <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-widest print:text-black">EV COMPONENT ANALYTICS</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 neo-inset p-6 md:p-8 print:bg-white print:border-2 print:border-gray-300">
                  {[
                    { label: 'BATTERY HEALTH (SOH)', value: `${evData.batterySoh || 'N/A'}%` },
                    { label: 'RANGE VERIFICATION', value: `${evData.range || 'N/A'} KM` },
                    { label: 'CHARGING HARDWARE', value: evData.chargerIncluded ? 'PRESENT' : 'ABSENT' },
                    { label: 'HIGH VOLTAGE STATUS', value: 'OPTIMAL' }
                  ].map(stat => (
                    <div key={stat.label} className="space-y-0.5">
                       <p className="text-[8px] md:text-[9px] font-bold text-text-secondary uppercase tracking-widest print:text-gray-500">{stat.label}</p>
                       <p className="text-xl md:text-2xl font-black text-text-primary tracking-tight print:text-black">{stat.value}</p>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* SECTION 5.0: FINAL VERDICT */}
          <div className="dossier-section space-y-8 md:space-y-10">
             <div className="flex items-center gap-4">
                <span className="text-sm md:text-lg font-black text-bg bg-text-primary px-2.5 py-0.5 md:px-3 md:py-1 print:text-white print:bg-black">5.0</span>
                <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-widest print:text-black">EXECUTIVE SUMMARY & VERDICT</h3>
             </div>
             
             <div className="p-6 md:p-10 neo-inset rounded-xl border-l-8 border-l-accent space-y-4 md:space-y-6 print:bg-white print:border-black print:border-2 print:rounded-none print:shadow-none">
                <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] print:text-black">
                   <Shield size={14} className="text-accent print:text-black" /> Regional Hub Official Verdict
                </div>
                <p className="text-text-primary text-base md:text-xl leading-relaxed font-bold italic pl-4 md:pl-8 print:text-black print:text-lg">
                   "{lead.dm_notes || "The asset has been successfully verified for inclusion in the PCS primary procurement channel."}"
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-6 print:grid-cols-2 print:gap-8">
                <div className="space-y-3 p-6 md:p-8 neo-card rounded-xl print:border-none print:bg-transparent print:p-0 print:shadow-none">
                   <p className="text-[9px] md:text-[10px] font-black text-text-primary uppercase tracking-widest print:text-black">Authorized Signatory</p>
                   <div className="h-16 border-b-2 border-border flex items-end pb-2 print:border-black">
                      <span className="text-text-secondary font-serif italic text-lg sm:text-2xl print:text-gray-500">Digital Signature Applied</span>
                   </div>
                   <p className="text-[8px] text-text-secondary font-bold uppercase tracking-widest print:text-gray-500">PCS Regional District Manager</p>
                </div>
                
                {lead.status === 'OFFER_MADE' && (
                  <div className="bg-text-primary text-bg p-6 sm:p-8 md:p-10 rounded-xl space-y-3 md:space-y-4 shadow-xl transform hover:scale-[1.02] transition-transform duration-300 print:bg-white print:text-black print:border-4 print:border-black print:shadow-none print:hover:scale-100 print:rounded-none">
                     <p className="text-[8px] md:text-[10px] font-black text-bg/60 uppercase tracking-[0.3em] md:tracking-[0.4em] print:text-gray-500">Certified Procurement Offer</p>
                     <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl md:text-6xl font-black text-accent tracking-tighter break-all print:text-black">
                          {(lead.final_dealer_offer_etb || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-black text-bg/80 uppercase tracking-widest print:text-gray-700">ETB</span>
                     </div>
                  </div>
                )}
             </div>
          </div>

          {/* Legal Footer */}
          <div className="dossier-section pt-8 border-t-4 border-text-primary flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between print:border-black print:mt-12 print:pt-6 print:flex-row">
             <div className="space-y-1.5">
                <p className="text-[9px] md:text-[10px] text-text-primary font-black uppercase tracking-[0.2em] md:tracking-[0.3em] print:text-black">Official Documentation Hub</p>
                <p className="max-w-md text-[8px] text-text-secondary font-bold uppercase leading-relaxed print:text-gray-500">
                   This document is a certified record of the Peace Market Asset Appraisal Division. 
                   Reproduction without valid seal is strictly prohibited. Sync ID: {lead.id}
                </p>
             </div>
             <div className="flex items-center justify-center gap-3 px-6 py-3 bg-text-primary text-bg self-start sm:self-auto print:bg-black print:text-white shrink-0">
                <div className="w-1.5 h-1.5 bg-accent rounded-full print:bg-gray-400 animate-pulse" />
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Registry Sync v4.28.0</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
