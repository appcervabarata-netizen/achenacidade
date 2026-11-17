import React from 'react';
import { useDirectory } from '../../context/DirectoryContext';
import { BellRing, Wrench, Tag, X, ArrowRight } from 'lucide-react';

export const PushLiveBanner: React.FC = () => {
  const {
    inAppBannerAlert,
    dismissInAppBannerAlert,
    markAlertAsRead,
    openModal,
  } = useDirectory();

  if (!inAppBannerAlert) {
    return null;
  }

  const handleOpen = () => {
    markAlertAsRead(inAppBannerAlert.id);
    if (inAppBannerAlert.itemType === 'service' && inAppBannerAlert.itemId) {
      openModal('service_detail', inAppBannerAlert.itemId);
    } else if (inAppBannerAlert.itemType === 'product' && inAppBannerAlert.itemId) {
      openModal('product_detail', inAppBannerAlert.itemId);
    } else {
      openModal('business_detail', inAppBannerAlert.businessId);
    }
    dismissInAppBannerAlert();
  };

  return (
    <div className="fixed top-20 right-3 sm:right-6 z-50 w-[calc(100%-1.5rem)] sm:w-96 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden animate-fade-in">
      <div className="p-3.5 flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            inAppBannerAlert.itemType === 'service' ? 'bg-indigo-600' : 'bg-orange-600'
          }`}
        >
          {inAppBannerAlert.itemType === 'service' ? (
            <Wrench className="w-4 h-4 text-white" />
          ) : (
            <Tag className="w-4 h-4 text-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
            <BellRing className="w-3 h-3" />
            <span>Alerta Push · Alagoinhas</span>
          </div>
          <h4 className="text-xs font-extrabold text-white truncate mt-0.5">
            {inAppBannerAlert.title}
          </h4>
          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
            {inAppBannerAlert.body}
          </p>

          <button
            onClick={handleOpen}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
          >
            <span>Ver agora</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={dismissInAppBannerAlert}
          className="text-slate-400 hover:text-white p-1 cursor-pointer shrink-0"
          title="Dispensar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
