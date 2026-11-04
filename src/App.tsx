import { useState, useEffect, useCallback } from 'react';
import type {
  SareeGarment,
  DrapingStyle,
  BlouseConfig,
  JewellerySet,
  OccasionScene,
  TryOnResult
} from './types/portal';
import {
  SAREE_PORTAL_CATALOG,
  DRAPING_STYLES,
  JEWELLERY_SETS,
  OCCASION_SCENES,
  SAMPLE_USER_MODELS
} from './data/portalCatalog';
import { TryOnSynthesisService } from './services/TryOnSynthesisService';
import { GeminiStylistService, type GeminiBodyAnalysis } from './services/GeminiStylistService';
import { PortalHeader } from './components/portal/PortalHeader';
import { TryOnStage } from './components/portal/TryOnStage';
import { CoutureDrawer } from './components/portal/CoutureDrawer';
import { UploadModal } from './components/portal/UploadModal';
import { SettingsModal } from './components/portal/SettingsModal';

export function App() {
  // 1. Core Couture Selection States
  const [selectedSaree, setSelectedSaree] = useState<SareeGarment>(SAREE_PORTAL_CATALOG[0]);
  const [selectedStyle, setSelectedStyle] = useState<DrapingStyle>(DRAPING_STYLES[0]);
  const [blouseConfig, setBlouseConfig] = useState<BlouseConfig>({
    color: 'inherit',
    colorName: 'Matching Saree',
    sleeveStyle: 'elbow',
    isContrast: false
  });
  const [selectedJewellery, setSelectedJewellery] = useState<JewellerySet>(JEWELLERY_SETS[0]);
  const [selectedScene, setSelectedScene] = useState<OccasionScene>(OCCASION_SCENES[0]);

  // 2. User Photo State (Sample 01 office casual default)
  const [userPhoto, setUserPhoto] = useState<string>(SAMPLE_USER_MODELS[0].photoUrl);
  const [isCustomPhoto, setIsCustomPhoto] = useState<boolean>(false);

  // 3. Generated Look State
  const [currentLook, setCurrentLook] = useState<TryOnResult>({
    lookId: 'DRAPE-INIT',
    frontUrl: `/sarees/looks/look_${SAREE_PORTAL_CATALOG[0].id}.jpg`,
    backUrl: `/sarees/looks/look_${SAREE_PORTAL_CATALOG[0].id}_back.jpg`,
    originalUserPhoto: SAMPLE_USER_MODELS[0].photoUrl,
    saree: SAREE_PORTAL_CATALOG[0],
    drapingStyle: DRAPING_STYLES[0],
    blouse: {
      color: 'inherit',
      colorName: 'Matching Saree',
      sleeveStyle: 'elbow',
      isContrast: false
    },
    jewellery: JEWELLERY_SETS[0],
    scene: OCCASION_SCENES[0],
    generatedAt: new Date().toISOString(),
    isAiGenerated: false
  });

  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<TryOnResult[]>([]);
  const [scales, setScales] = useState<{ shoulderScale: number; waistHipScale: number; heightScale: number }>({
    shoulderScale: 1.0,
    waistHipScale: 1.0,
    heightScale: 1.0
  });
  const [geminiAdvice, setGeminiAdvice] = useState<GeminiBodyAnalysis | null>(null);

  // 4. Modal Visibility
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [storeToast, setStoreToast] = useState<string | null>(null);

  // 5. Synthesize Look whenever user changes selections
  const updateLook = useCallback(async (overrides?: {
    saree?: SareeGarment;
    style?: DrapingStyle;
    blouse?: BlouseConfig;
    jewellery?: JewellerySet;
    scene?: OccasionScene;
    photo?: string;
    customPhoto?: boolean;
    forceRefresh?: boolean;
  }) => {
    const targetSaree = overrides?.saree || selectedSaree;
    const targetStyle = overrides?.style || selectedStyle;
    const targetBlouse = overrides?.blouse || blouseConfig;
    const targetJewellery = overrides?.jewellery || selectedJewellery;
    const targetScene = overrides?.scene || selectedScene;
    const targetPhoto = overrides?.photo !== undefined ? overrides.photo : userPhoto;
    const targetIsCustom = overrides?.customPhoto !== undefined ? overrides.customPhoto : isCustomPhoto;
    const targetForceRefresh = overrides?.forceRefresh || false;

    setIsAiGenerating(true);
    try {
      const result = await TryOnSynthesisService.generateTryOn({
        userImage: targetPhoto,
        saree: targetSaree,
        drapingStyle: targetStyle,
        blouse: targetBlouse,
        jewellery: targetJewellery,
        scene: targetScene,
        isCustomPhoto: targetIsCustom,
        forceRefresh: targetForceRefresh
      });
      setCurrentLook(result);
    } catch (e) {
      console.warn('Try-on update error:', e);
    } finally {
      setIsAiGenerating(false);
    }
  }, [selectedSaree, selectedStyle, blouseConfig, selectedJewellery, selectedScene, userPhoto, isCustomPhoto]);

  // Initial load
  useEffect(() => {
    updateLook();
  }, []);

  // Handlers
  const handleSelectSaree = (saree: SareeGarment) => {
    setSelectedSaree(saree);
    updateLook({ saree });
  };

  const handleSelectStyle = (style: DrapingStyle) => {
    setSelectedStyle(style);
    updateLook({ style });
  };

  const handleChangeBlouse = (blouse: BlouseConfig) => {
    setBlouseConfig(blouse);
    updateLook({ blouse });
  };

  const handleSelectJewellery = (jewellery: JewellerySet) => {
    setSelectedJewellery(jewellery);
    updateLook({ jewellery });
  };

  const handleSelectScene = (scene: OccasionScene) => {
    setSelectedScene(scene);
    updateLook({ scene });
  };

  const handlePhotoUploaded = async (photoDataUrl: string) => {
    setUserPhoto(photoDataUrl);
    setIsCustomPhoto(true);
    updateLook({ photo: photoDataUrl, customPhoto: true });

    // Call Gemini to analyze body measurements and update 3D model scales
    try {
      const analysis = await GeminiStylistService.analyzeBodyAndStyle(photoDataUrl);
      if (analysis) {
        setGeminiAdvice(analysis);
        setScales({
          shoulderScale: analysis.shoulderScale,
          waistHipScale: analysis.waistHipScale,
          heightScale: analysis.heightScale
        });
      }
    } catch (e) {
      console.warn('Gemini 3D size extraction notice:', e);
    }
  };

  const handleResetLook = () => {
    const defaultSaree = SAREE_PORTAL_CATALOG[0];
    const defaultStyle = DRAPING_STYLES[0];
    const defaultBlouse: BlouseConfig = {
      color: 'inherit',
      colorName: 'Matching Saree',
      sleeveStyle: 'elbow',
      isContrast: false
    };
    const defaultJewel = JEWELLERY_SETS[0];
    const defaultScene = OCCASION_SCENES[0];
    const defaultPhoto = SAMPLE_USER_MODELS[0].photoUrl;

    setSelectedSaree(defaultSaree);
    setSelectedStyle(defaultStyle);
    setBlouseConfig(defaultBlouse);
    setSelectedJewellery(defaultJewel);
    setSelectedScene(defaultScene);
    setUserPhoto(defaultPhoto);
    setIsCustomPhoto(false);

    updateLook({
      saree: defaultSaree,
      style: defaultStyle,
      blouse: defaultBlouse,
      jewellery: defaultJewel,
      scene: defaultScene,
      photo: defaultPhoto,
      customPhoto: false
    });
  };

  const handleToggleWishlist = (look: TryOnResult) => {
    setWishlist((prev) => {
      const exists = prev.some((l) => l.lookId === look.lookId || (l.saree.id === look.saree.id && l.drapingStyle.id === look.drapingStyle.id));
      if (exists) {
        return prev.filter((l) => l.saree.id !== look.saree.id || l.drapingStyle.id !== look.drapingStyle.id);
      }
      return [look, ...prev];
    });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleRequestInStore = () => {
    setStoreToast(`Look #${currentLook.lookId} saved! Boutique consultant notified for your trial.`);
    setTimeout(() => setStoreToast(null), 3500);
  };

  const isSavedInWishlist = wishlist.some(
    (l) => l.saree.id === currentLook.saree.id && l.drapingStyle.id === currentLook.drapingStyle.id
  );

  return (
    <main className="w-full h-[100dvh] flex flex-col bg-neutral-950 text-white font-sans overflow-hidden select-none">
      {/* 1. PORTAL HEADER */}
      <PortalHeader
        onOpenUpload={() => setIsUploadOpen(true)}
        onResetLook={handleResetLook}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isAiGenerating={isAiGenerating}
        hasCustomPhoto={isCustomPhoto}
      />

      {/* 2. MAIN 2-COLUMN LUXURY STUDIO LAYOUT */}
      <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Column: Try-On Stage Showcase (60% width on desktop) */}
        <section className="flex-1 lg:w-[60%] h-[55%] lg:h-full relative overflow-hidden">
          <TryOnStage
            currentLook={currentLook}
            isGenerating={isAiGenerating}
            onSaveToWishlist={handleToggleWishlist}
            isSavedInWishlist={isSavedInWishlist}
            onRequestInStore={handleRequestInStore}
            onRegenerate={() => updateLook({ forceRefresh: true })}
            scales={scales}
            onScalesChange={setScales}
            geminiAdvice={geminiAdvice}
          />
        </section>

        {/* Right Column: Couture Customization Suite Drawer (40% width on desktop) */}
        <section className="w-full lg:w-[40%] h-[45%] lg:h-full relative overflow-hidden shadow-2xl">
          <CoutureDrawer
            selectedSaree={selectedSaree}
            onSelectSaree={handleSelectSaree}
            selectedStyle={selectedStyle}
            onSelectStyle={handleSelectStyle}
            blouseConfig={blouseConfig}
            onChangeBlouse={handleChangeBlouse}
            selectedJewellery={selectedJewellery}
            onSelectJewellery={handleSelectJewellery}
            selectedScene={selectedScene}
            onSelectScene={handleSelectScene}
            wishlist={wishlist}
            onSelectSavedLook={(look) => {
              setSelectedSaree(look.saree);
              setSelectedStyle(look.drapingStyle);
              setBlouseConfig(look.blouse);
              setSelectedJewellery(look.jewellery);
              setSelectedScene(look.scene);
              setCurrentLook(look);
            }}
          />
        </section>
      </div>

      {/* 3. MODALS */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSelectPhoto={handlePhotoUploaded}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 4. TOAST NOTIFICATION */}
      {storeToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-neutral-900/95 border border-amber-400/80 backdrop-blur-md text-amber-300 text-xs font-medium shadow-2xl animate-bounce flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{storeToast}</span>
        </div>
      )}
    </main>
  );
}

export default App;
