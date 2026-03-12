'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Star, Globe } from 'lucide-react';

const stats = [
  { icon: Users, value: '+500', label: 'Emprendedores activos', color: 'text-fourth-base' },
  { icon: TrendingUp, value: '+300%', label: 'Crecimiento promedio', color: 'text-secondary-base' },
  { icon: Star, value: '4.9/5', label: 'Satisfacción del cliente', color: 'text-tertiary' },
  { icon: Globe, value: '8+', label: 'Países alcanzados', color: 'text-primary-base' },
];

export default function StatsBar() {
  return (
    <section className="bg-slate-900 border-y border-white/5 py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center gap-2"
              >
                <Icon className={`w-6 h-6 ${stat.color}`} aria-hidden="true" />
                <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
