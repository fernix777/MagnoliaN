import { useEffect } from 'react';
import { onLCP, onFID, onCLS, onFCP, onTTFB } from 'web-vitals';

/**
 * Componente que monitorea las Web Vitals y las registra en la consola.
 * Útil para verificar que la tienda carga en menos de 2 segundos (LCP).
 */
export default function PerformanceAuditor() {
    useEffect(() => {
        // Solo ejecutar en el navegador
        if (typeof window === 'undefined') return;

        console.log('🚀 Monitor de Rendimiento Activo (Web Vitals)');

        const logMetric = ({ name, value, rating }) => {
            const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
            const seconds = (value / 1000).toFixed(2);
            
            console.log(
                `${color} [${name}]: ${seconds}s (${rating.toUpperCase()})`
            );

            // Si es LCP, avisar específicamente sobre la meta de 2s
            if (name === 'LCP') {
                if (value < 2000) {
                    console.log('✅ META CUMPLIDA: Carga bajo 2 segundos lograda.');
                } else {
                    console.warn('⚠️ ALERTA: La carga superó los 2 segundos en este dispositivo.');
                }
            }
        };

        // Suscribirse a las métricas principales
        onLCP(logMetric);
        onFID(logMetric);
        onCLS(logMetric);
        onFCP(logMetric);
        onTTFB(logMetric);
    }, []);

    return null; // Este componente no renderiza nada visualmente
}
