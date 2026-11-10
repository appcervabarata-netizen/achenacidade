import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { ShieldCheck, MapPin, Building2, ShoppingBag, Sparkles } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const Footer: React.FC = () => {
  const { cities, setSelectedCityId, openModal } = useDirectory();

  const activeCities = cities.filter((c) => c.isActive);

  return (
    <footer className="hidden md:block bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                A
              </div>
              <span className="text-lg font-bold text-white font-display">
                achena<span className="text-orange-500">cidade</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Plataforma e PWA de diretório comercial municipal. Conectando consumidores às melhores empresas e vitrines de produtos por cidades.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <PWAInstallButton compact />
            </div>
          </div>

          {/* Cidades em destaque */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Cidades Atendidas
            </h4>
            <ul className="space-y-1.5">
              {activeCities.slice(0, 6).map((city) => (
                <li key={city.id}>
                  <button
                    onClick={() => {
                      setSelectedCityId(city.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                    <span>{city.name} - {city.state}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Navegação
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a href="#empresas" className="hover:text-white transition flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>Diretório de Empresas</span>
                </a>
              </li>
              <li>
                <a href="#produtos" className="hover:text-white transition flex items-center gap-1.5">
                  <ShoppingBag className="w-3 h-3 text-orange-500 shrink-0" />
                  <span>Vitrine de Produtos</span>
                </a>
              </li>
              <li>
                <a href="#planos" className="hover:text-white transition flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Planos para Anunciantes</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => openModal('favorites')}
                  className="hover:text-white transition text-left cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-rose-500">♥</span>
                  <span>Meus Favoritos Salvos</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal('business_portal')}
                  className="hover:text-white transition text-left cursor-pointer"
                >
                  Cadastrar Minha Loja
                </button>
              </li>
            </ul>
          </div>

          {/* Painel Administrativo & HostGator */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Administração & Hospedagem
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">
              Compatível com hospedagem cPanel HostGator em PHP e banco de dados MySQL.
            </p>
            <button
              onClick={() => openModal('admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition border border-slate-700 cursor-pointer text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>Painel Admin & HostGator</span>
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} achenacidade — Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span>PWA Instalável</span>
            <span>·</span>
            <span>PHP 8.x & MySQL</span>
            <span>·</span>
            <span>Deploy HostGator</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
