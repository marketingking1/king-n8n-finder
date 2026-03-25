import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AggregatedCreative, FUNNEL_STAGE_CONFIG } from '@/types/creative';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { Play, Video, Image, FileText, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreativeExpandedDetailProps {
  creative: AggregatedCreative;
}

const cplColor = (v: number) => v === 0 ? 'text-muted-foreground' : v <= 10 ? 'text-success' : v <= 20 ? 'text-warning' : 'text-destructive';

export function CreativeExpandedDetail({ creative }: CreativeExpandedDetailProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const funnelConfig = creative.funnelStage ? FUNNEL_STAGE_CONFIG[creative.funnelStage] : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="p-5 space-y-5 border-t border-border/30 bg-muted/10">
        <div className="flex flex-wrap gap-5">
          {/* Media */}
          {(creative.videoUrl || creative.thumbnailUrl) && !mediaError && (
            <div className="shrink-0">
              {creative.videoUrl && videoPlaying ? (
                <div className="rounded-lg overflow-hidden bg-black aspect-video w-72">
                  <video
                    src={creative.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full"
                    onEnded={() => setVideoPlaying(false)}
                    onError={() => { setVideoPlaying(false); setMediaError(true); }}
                  >
                    <track kind="captions" />
                  </video>
                </div>
              ) : creative.thumbnailUrl ? (
                <button
                  onClick={() => { if (creative.videoUrl) setVideoPlaying(true); }}
                  className={cn(
                    'relative rounded-lg overflow-hidden bg-black w-72',
                    creative.videoUrl ? 'cursor-pointer group' : ''
                  )}
                >
                  <img
                    src={creative.thumbnailUrl}
                    alt={creative.displayName}
                    className="w-full max-h-48 object-contain"
                    onError={() => setMediaError(true)}
                  />
                  {creative.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 text-black ml-0.5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    {creative.videoUrl ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                    {creative.videoUrl ? 'Video' : 'Imagem'}
                  </div>
                </button>
              ) : null}
            </div>
          )}

          {/* Info panel */}
          <div className="flex-1 min-w-[220px] space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {funnelConfig && (
                <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: funnelConfig.color }}>
                  {funnelConfig.label}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{creative.totalDays} dias ativos</span>
              {creative.hasSupabaseData && (
                <span className="text-[10px] text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded">Supabase</span>
              )}
            </div>

            {/* CRM funnel grid */}
            {creative.totalLeadsCrm > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {[
                  { label: 'Leads CRM', value: creative.totalLeadsCrm, color: '#64748b' },
                  { label: 'MQLs', value: creative.mql, color: '#3b82f6' },
                  { label: 'Calls Ag.', value: creative.callAgendada, color: '#8b5cf6' },
                  { label: 'Calls Re.', value: creative.callRealizada, color: '#f59e0b' },
                  { label: 'Contratos', value: creative.contrato, color: '#06b6d4' },
                  { label: 'Vendas', value: creative.vendas, color: '#22c55e' },
                ].map((item) => (
                  <div key={item.label} className="p-2 rounded-md bg-card border border-border/30">
                    <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
                    <p className="font-mono text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Cost metrics */}
            <div className="grid grid-cols-3 gap-2">
              {creative.custoMql > 0 && (
                <div className="p-2 rounded-md bg-card border border-border/30 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">Custo MQL</p>
                  <p className="font-mono text-sm font-bold text-blue-400">{formatCurrency(creative.custoMql)}</p>
                </div>
              )}
              {creative.cpa > 0 && (
                <div className="p-2 rounded-md bg-card border border-border/30 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">CPA</p>
                  <p className="font-mono text-sm font-bold text-emerald-400">{formatCurrency(creative.cpa)}</p>
                </div>
              )}
              {creative.avgCpl > 0 && (
                <div className="p-2 rounded-md bg-card border border-border/30 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">CPL</p>
                  <p className={cn('font-mono text-sm font-bold', cplColor(creative.avgCpl))}>{formatCurrency(creative.avgCpl)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transcription */}
        {creative.transcription && creative.transcription.length > 3 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
              <FileText className="w-3 h-3" /> Transcrição do criativo
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/30 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
              {creative.transcription}
            </div>
          </div>
        )}

        {/* Analysis */}
        {creative.analysis && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
              <Lightbulb className="w-3 h-3" /> Por que funcionou
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-sm text-foreground/90 leading-relaxed">
              {creative.analysis}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
